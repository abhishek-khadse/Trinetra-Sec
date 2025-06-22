"""
Learning center notes routes.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from pydantic import BaseModel, Field, validator

from config import settings
from core.database import get_db, Note, User, NoteCategory, NoteBookmark
from core.utils.logger import logger as log
from auth.services.user_service import get_current_user

router = APIRouter(prefix="/api/v1/learn/notes", tags=["Learning - Notes"])

# Models
class NoteBase(BaseModel):
    """Base note model."""
    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=10)
    category_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_public: bool = False

class NoteCreate(NoteBase):
    """Note creation model."""
    pass

class NoteUpdate(BaseModel):
    """Note update model."""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    content: Optional[str] = Field(None, min_length=10)
    category_id: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None

class NoteResponse(NoteBase):
    """Note response model."""
    id: str
    user_id: str
    category_name: Optional[str]
    is_bookmarked: bool = False
    view_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True

class NoteListResponse(BaseModel):
    """Paginated list of notes."""
    items: List[NoteResponse]
    total: int
    page: int
    pages: int

class NoteCategoryBase(BaseModel):
    """Note category base model."""
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    is_public: bool = True

class NoteCategoryCreate(NoteCategoryBase):
    """Note category creation model."""
    pass

class NoteCategoryResponse(NoteCategoryBase):
    """Note category response model."""
    id: str
    note_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True

# Routes
@router.get(
    "",
    response_model=NoteListResponse,
    summary="List notes"
)
async def list_notes(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    category_id: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    include_public: bool = Query(True, description="Include public notes"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List notes with filtering and pagination.
    
    - **page**: Page number (1-based)
    - **per_page**: Items per page (1-100)
    - **category_id**: Filter by category ID
    - **tag**: Filter by tag
    - **search**: Search in title and content
    - **include_public**: Include public notes from other users
    """
    try:
        # Build base query
        query = select(Note).where(
            or_(
                Note.user_id == current_user.id,
                Note.is_public == True if include_public else False
            )
        )
        
        # Apply filters
        if category_id:
            query = query.where(Note.category_id == category_id)
            
        if tag:
            query = query.where(Note.tags.contains([tag]))
            
        if search:
            search_filter = or_(
                Note.title.ilike(f"%{search}%"),
                Note.content.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        # Get total count for pagination
        total = await db.scalar(select(func.count()).select_from(query.subquery()))
        
        # Apply pagination
        offset = (page - 1) * per_page
        query = query.order_by(desc(Note.updated_at)).offset(offset).limit(per_page)
        
        # Execute query
        result = await db.execute(query)
        notes = result.scalars().all()
        
        # Check which notes are bookmarked by the user
        note_ids = [note.id for note in notes]
        bookmarked_notes = set()
        
        if note_ids:
            bookmark_result = await db.execute(
                select(NoteBookmark.note_id)
                .where(and_(
                    NoteBookmark.user_id == current_user.id,
                    NoteBookmark.note_id.in_(note_ids)
                ))
            )
            bookmarked_notes = {str(b[0]) for b in bookmark_result.all()}
        
        # Get category names
        category_ids = {note.category_id for note in notes if note.category_id}
        categories = {}
        
        if category_ids:
            cat_result = await db.execute(
                select(NoteCategory.id, NoteCategory.name)
                .where(NoteCategory.id.in_(category_ids))
            )
            categories = {str(cat[0]): cat[1] for cat in cat_result.all()}
        
        # Prepare response
        items = []
        for note in notes:
            note_dict = note.to_dict()
            note_dict['is_bookmarked'] = str(note.id) in bookmarked_notes
            note_dict['category_name'] = categories.get(str(note.category_id))
            items.append(note_dict)
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "pages": (total + per_page - 1) // per_page
        }
        
    except Exception as e:
        log.error(f"Error listing notes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving notes"
        )

@router.post(
    "",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new note"
)
async def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new note.
    """
    try:
        # Validate category if provided
        if note_data.category_id:
            category = await db.get(NoteCategory, note_data.category_id)
            if not category or (not category.is_public and category.user_id != current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or inaccessible category"
                )
        
        # Create note
        note = Note(
            user_id=current_user.id,
            **note_data.dict()
        )
        
        await note.save(db)
        
        # Return created note with category name
        response = note.to_dict()
        if note.category_id:
            response['category_name'] = category.name
            
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error creating note: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the note"
        )

@router.get(
    "/{note_id}",
    response_model=NoteResponse,
    summary="Get note by ID"
)
async def get_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific note by ID.
    """
    try:
        # Get note with access control
        note = await db.get(Note, note_id)
        if not note or (note.user_id != current_user.id and not note.is_public):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found or access denied"
            )
        
        # Check if bookmarked
        bookmark = await db.execute(
            select(NoteBookmark)
            .where(and_(
                NoteBookmark.user_id == current_user.id,
                NoteBookmark.note_id == note_id
            ))
        )
        
        # Get category name if exists
        category_name = None
        if note.category_id:
            category = await db.get(NoteCategory, note.category_id)
            category_name = category.name if category else None
        
        # Increment view count
        note.view_count += 1
        await db.commit()
        
        # Prepare response
        response = note.to_dict()
        response['is_bookmarked'] = bookmark.scalars().first() is not None
        response['category_name'] = category_name
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error retrieving note {note_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the note"
        )

@router.put(
    "/{note_id}",
    response_model=NoteResponse,
    summary="Update a note"
)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an existing note.
    """
    try:
        # Get note and verify ownership
        note = await db.get(Note, note_id)
        if not note or note.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found or access denied"
            )
        
        # Validate category if being updated
        if note_data.category_id is not None and note_data.category_id != note.category_id:
            if note_data.category_id:
                category = await db.get(NoteCategory, note_data.category_id)
                if not category or (not category.is_public and category.user_id != current_user.id):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid or inaccessible category"
                    )
        
        # Update note fields
        update_data = note_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(note, field, value)
        
        note.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(note)
        
        # Get category name for response
        category_name = None
        if note.category_id:
            category = await db.get(NoteCategory, note.category_id)
            category_name = category.name if category else None
        
        # Check if bookmarked
        bookmark = await db.execute(
            select(NoteBookmark)
            .where(and_(
                NoteBookmark.user_id == current_user.id,
                NoteBookmark.note_id == note_id
            ))
        )
        
        # Prepare response
        response = note.to_dict()
        response['is_bookmarked'] = bookmark.scalars().first() is not None
        response['category_name'] = category_name
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error updating note {note_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the note"
        )

@router.delete(
    "/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a note"
)
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a note.
    """
    try:
        # Get note and verify ownership
        note = await db.get(Note, note_id)
        if not note or note.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found or access denied"
            )
        
        # Delete note
        await db.delete(note)
        await db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error deleting note {note_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the note"
        )

@router.post(
    "/{note_id}/bookmark",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Bookmark a note"
)
async def bookmark_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Bookmark a note for the current user.
    """
    try:
        # Check if note exists and is accessible
        note = await db.get(Note, note_id)
        if not note or (note.user_id != current_user.id and not note.is_public):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found or access denied"
            )
        
        # Check if already bookmarked
        existing = await db.execute(
            select(NoteBookmark)
            .where(and_(
                NoteBookmark.user_id == current_user.id,
                NoteBookmark.note_id == note_id
            ))
        )
        
        if existing.scalars().first():
            return None  # Already bookmarked
        
        # Create bookmark
        bookmark = NoteBookmark(
            user_id=current_user.id,
            note_id=note_id
        )
        
        await bookmark.save(db)
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error bookmarking note {note_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while bookmarking the note"
        )

@router.delete(
    "/{note_id}/bookmark",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove bookmark from a note"
)
async def remove_bookmark(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a note from the current user's bookmarks.
    """
    try:
        # Find and delete bookmark
        result = await db.execute(
            select(NoteBookmark)
            .where(and_(
                NoteBookmark.user_id == current_user.id,
                NoteBookmark.note_id == note_id
            ))
        )
        
        bookmark = result.scalars().first()
        if bookmark:
            await db.delete(bookmark)
            await db.commit()
        
        return None
        
    except Exception as e:
        log.error(f"Error removing bookmark for note {note_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while removing the bookmark"
        )

@router.get(
    "/categories",
    response_model=List[NoteCategoryResponse],
    summary="List note categories"
)
async def list_note_categories(
    include_public: bool = Query(True, description="Include public categories"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List available note categories.
    """
    try:
        # Build query
        query = select(NoteCategory).where(
            or_(
                NoteCategory.user_id == current_user.id,
                NoteCategory.is_public == True if include_public else False
            )
        ).order_by(NoteCategory.name)
        
        # Execute query
        result = await db.execute(query)
        categories = result.scalars().all()
        
        # Get note counts for each category
        category_ids = [str(cat.id) for cat in categories]
        note_counts = {}
        
        if category_ids:
            count_query = select(
                Note.category_id,
                func.count(Note.id).label('count')
            ).where(Note.category_id.in_(category_ids)).group_by(Note.category_id)
            
            count_result = await db.execute(count_query)
            note_counts = {str(row[0]): row[1] for row in count_result.all()}
        
        # Prepare response
        response = []
        for cat in categories:
            cat_dict = cat.to_dict()
            cat_dict['note_count'] = note_counts.get(str(cat.id), 0)
            response.append(cat_dict)
        
        return response
        
    except Exception as e:
        log.error(f"Error listing note categories: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving note categories"
        )

@router.post(
    "/categories",
    response_model=NoteCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new note category"
)
async def create_note_category(
    category_data: NoteCategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new note category.
    """
    try:
        # Check for duplicate name
        existing = await db.execute(
            select(NoteCategory)
            .where(and_(
                NoteCategory.user_id == current_user.id,
                func.lower(NoteCategory.name) == category_data.name.lower()
            ))
        )
        
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A category with this name already exists"
            )
        
        # Create category
        category = NoteCategory(
            user_id=current_user.id,
            **category_data.dict()
        )
        
        await category.save(db)
        
        # Prepare response
        response = category.to_dict()
        response['note_count'] = 0
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error creating note category: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the category"
        )

@router.get(
    "/tags/popular",
    response_model=List[str],
    summary="Get popular tags"
)
async def get_popular_tags(
    limit: int = Query(20, ge=1, le=50, description="Number of tags to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a list of popular tags from notes.
    """
    try:
        # This is a simplified implementation - in production, you'd likely want
        # a more sophisticated approach to track tag usage and popularity
        
        # Get all tags from notes the user can access
        query = select(Note.tags).where(
            or_(
                Note.user_id == current_user.id,
                Note.is_public == True
            )
        )
        
        result = await db.execute(query)
        all_tags = []
        
        for tags in result.scalars().all():
            if tags:
                all_tags.extend(tags)
        
        # Count tag occurrences
        from collections import Counter
        tag_counts = Counter(all_tags)
        
        # Get most common tags
        popular_tags = [tag for tag, _ in tag_counts.most_common(limit)]
        
        return popular_tags
        
    except Exception as e:
        log.error(f"Error retrieving popular tags: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving popular tags"
        )
