import uvicorn
from app import app
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    # Run the FastAPI app
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
        workers=1
    )
