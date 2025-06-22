# Machine Learning Integration

This directory contains the machine learning models and utilities for TrinetraSec's security analysis features.

## Overview

The ML integration is designed to be modular, allowing for easy addition of new models and analysis capabilities. The system is built with the following components:

1. **Base Model Interface**: Defines the standard interface for all ML models
2. **Model Implementations**: Individual models for different security analysis tasks
3. **Model Factory**: Manages model instantiation and lifecycle
4. **Security Analyzer**: High-level interface for performing security analyses
5. **API Routes**: REST endpoints for accessing ML analysis features

## Models

### 1. Network Intrusion Detection (NIDS)
- **File**: `network_ids.py`
- **Purpose**: Detects malicious network traffic patterns
- **Input**: Network traffic features (source/dest IP/port, protocol, packet/byte counts, etc.)
- **Output**: Threat level, risk score, and detection details

### 2. APK Analyzer
- **File**: `apk_analyzer.py`
- **Purpose**: Analyzes Android APK metadata for security issues
- **Input**: APK metadata (permissions, components, SDK versions, etc.)
- **Output**: Risk assessment, threat level, and security findings

### 3. Phishing Detector
- **File**: `phishing_detector.py`
- **Purpose**: Identifies phishing attempts in URLs and web pages
- **Input**: URL and/or HTML content
- **Output**: Phishing likelihood, risk score, and detected indicators

### 4. LLM Abuse Detector
- **File**: `llm_abuse_detector.py`
- **Purpose**: Detects potentially harmful or abusive LLM prompts
- **Input**: Text prompt and optional user/context information
- **Output**: Abuse risk level, recommended action, and detection details

## API Endpoints

All ML analysis features are exposed through the following API endpoints:

- `POST /api/v1/ml/network/analyze` - Analyze network traffic
- `POST /api/v1/ml/apk/analyze` - Analyze APK metadata
- `POST /api/v1/ml/phishing/detect` - Detect phishing attempts
- `POST /api/v1/ml/llm/abuse-detect` - Detect LLM prompt abuse
- `GET /api/v1/ml/health` - Check ML service health

## Adding a New Model

To add a new ML model:

1. Create a new Python file in the `core/ml/` directory
2. Implement a class that inherits from `BaseModel`
3. Register the model in `MODEL_REGISTRY` in `factory.py`
4. Add API routes in `app/routes/modules/ml_analysis.py`
5. Add tests in `tests/test_ml_models.py`

## Testing

Run the test suite with:

```bash
pytest tests/test_ml_models.py -v
```

For coverage reporting:

```bash
pytest tests/test_ml_models.py --cov=core.ml --cov-report=term-missing
```

## Dependencies

- Python 3.8+
- FastAPI
- SQLAlchemy (async)
- Pydantic
- scikit-learn (for future ML models)
- torch/tensorflow (for future deep learning models)

## Configuration

Model configurations can be adjusted in the respective model classes. Environment variables can be used for runtime configuration.

## Performance Considerations

- Models are loaded lazily on first use
- The model factory caches model instances for reuse
- Heavy models should implement proper batching for inference
- Consider using a model server for production deployment

## Security Considerations

- Validate all input data before passing to models
- Sanitize model outputs before returning to clients
- Implement rate limiting on API endpoints
- Monitor model performance and drift in production
- Keep models updated with the latest threat intelligence
