# TrinetraSec Backend

Advanced cybersecurity platform backend built with FastAPI and modern ML technologies.

## Features

- Real-time threat detection and analysis
- Machine learning-based security modules
- Learning center with case studies and quizzes
- Knowledge base for security best practices
- Secure authentication and RBAC
- PDF report generation
- WebSocket-based real-time updates

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

3. Run migrations:
```bash
python -m alembic upgrade head
```

4. Start the server:
```bash
python run.py
```

## Directory Structure

```
Backend/
├── app.py               # Main FastAPI application
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
├── run.py              # Server runner script
├── routes/             # API routes
├── utils/              # Utility functions
├── services/           # Business logic services
├── config/             # Configuration files
├── scheduler/          # Background jobs
├── core/               # Core application logic
├── tests/              # Test suite
├── auth/               # Authentication system
├── docs/               # Documentation
├── scripts/            # Utility scripts
└── data/               # Persistent storage
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Security

- JWT-based authentication
- Role-based access control
- Rate limiting
- Input validation
- Secure headers
- CORS configuration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
