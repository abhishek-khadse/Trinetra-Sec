from typing import Dict, Any, List, Optional, Union
import json
import os
from pathlib import Path
import logging
from datetime import datetime, timezone
import numpy as np

from sqlalchemy.ext.asyncio import AsyncSession

from core.ml.factory import get_model
from core.ml.base import BaseModel
from core.database.models import ScanResult, User
from core.utils.logger import logger
from core.event_dispatcher import event_dispatcher

class SecurityAnalyzer:
    """Core security analysis engine for TrinetraSec.
    
    This class provides a unified interface for running various security analyses
    using specialized ML models. It handles model loading, input validation,
    result processing, and audit logging.
    """
    
    def __init__(self):
        """Initialize the security analyzer."""
        self.models: Dict[str, BaseModel] = {}
        self.initialized = False
    
    async def initialize(self):
        """Initialize the analyzer and preload models."""
        if not self.initialized:
            # Preload models in the background
            # In a real implementation, you might want to load only the most critical models
            # and lazy-load others on demand
            try:
                from core.ml.factory import get_all_models
                self.models = await get_all_models()
                self.initialized = True
                logger.info(f"SecurityAnalyzer initialized with {len(self.models)} models")
            except Exception as e:
                logger.error(f"Failed to initialize SecurityAnalyzer: {str(e)}")
                raise
        return self
            
    async def _get_model(self, model_name: str) -> BaseModel:
        """Get a model by name, loading it if necessary.
        
        Args:
            model_name: Name of the model to get
            
        Returns:
            The requested model instance
            
        Raises:
            ValueError: If the model is not found or cannot be loaded
        """
        if not self.initialized:
            await self.initialize()
            
        if model_name in self.models:
            return self.models[model_name]
            
        try:
            model = await get_model(model_name)
            self.models[model_name] = model
            return model
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {str(e)}")
            raise ValueError(f"Model {model_name} not available: {str(e)}")
    
    async def analyze_network_traffic(
        self, 
        traffic_data: Dict[str, Any],
        user: Optional[User] = None,
        db_session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """Analyze network traffic for potential threats.
        
        Args:
            traffic_data: Network traffic data to analyze
            user: Optional user associated with the scan
            db_session: Optional database session for logging
            
        Returns:
            Analysis results with threat level and details
        """
        try:
            model = await self._get_model("network_ids")
            result = await model.predict(traffic_data)
            
            # Log the scan result if database session is provided
            if db_session and user:
                scan_result = ScanResult(
                    user_id=user.id,
                    scan_type="network_analysis",
                    target=traffic_data.get("dest_ip", "unknown"),
                    result=result,
                    risk_score=result.get("risk_score", 0.0),
                    threat_level=result.get("threat_level", "unknown"),
                    model_used="network_ids",
                )
                db_session.add(scan_result)
                await db_session.commit()
                await db_session.refresh(scan_result)

                # Dispatch event for WebSocket feed
                await event_dispatcher.publish(
                    event_type="scan_complete",
                    model="network_ids",
                    risk_score=scan_result.risk_score,
                    user_id=str(user.id),
                    threat_level=scan_result.threat_level,
                    timestamp=scan_result.created_at.isoformat(),
                )

            return result
            
        except Exception as e:
            logger.error(f"Error in network traffic analysis: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "threat_level": "unknown",
                "risk_score": 0.0
            }
    
    async def analyze_apk(
        self, 
        apk_metadata: Dict[str, Any],
        user: Optional[User] = None,
        db_session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """Analyze an APK file's metadata for potential security issues.
        
        Args:
            apk_metadata: APK metadata to analyze
            user: Optional user associated with the scan
            db_session: Optional database session for logging
            
        Returns:
            Analysis results with threat level and details
        """
        try:
            model = await self._get_model("apk_analyzer")
            result = await model.predict(apk_metadata)
            
            # Log the scan result if database session is provided
            if db_session and user:
                scan_result = ScanResult(
                    user_id=user.id,
                    scan_type="apk_analysis",
                    target=apk_metadata.get("package_name", "unknown"),
                    result=result,
                    risk_score=result.get("risk_score", 0.0),
                    threat_level=result.get("threat_level", "unknown"),
                    model_used="apk_analyzer",
                )
                db_session.add(scan_result)
                await db_session.commit()
                await db_session.refresh(scan_result)

                # Dispatch event for WebSocket feed
                await event_dispatcher.publish(
                    event_type="scan_complete",
                    model="apk_analyzer",
                    risk_score=scan_result.risk_score,
                    user_id=str(user.id),
                    threat_level=scan_result.threat_level,
                    timestamp=scan_result.created_at.isoformat(),
                )

            return result
            
        except Exception as e:
            logger.error(f"Error in APK analysis: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "threat_level": "unknown",
                "risk_score": 0.0
            }
    
    async def detect_phishing(
        self, 
        url: Optional[str] = None, 
        html: Optional[str] = None,
        user: Optional[User] = None,
        db_session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """Detect potential phishing attempts in a URL or HTML content.
        
        Args:
            url: URL to analyze
            html: HTML content to analyze
            user: Optional user associated with the scan
            db_session: Optional database session for logging
            
        Returns:
            Analysis results with threat level and details
        """
        if not url and not html:
            raise ValueError("Either url or html must be provided")
            
        try:
            model = await self._get_model("phishing_detector")
            result = await model.predict({
                "url": url,
                "html": html
            })
            
            # Log the scan result if database session is provided
            if db_session and user:
                target = url or f"HTML content ({len(html or '')} chars)" if html else "unknown"
                scan_result = ScanResult(
                    user_id=user.id,
                    scan_type="phishing_detection",
                    target=target,
                    result=result,
                    risk_score=result.get("risk_score", 0.0),
                    threat_level=result.get("threat_level", "unknown"),
                    model_used="phishing_detector",
                )
                db_session.add(scan_result)
                await db_session.commit()
                await db_session.refresh(scan_result)

                # Dispatch event for WebSocket feed
                await event_dispatcher.publish(
                    event_type="scan_complete",
                    model="phishing_detector",
                    risk_score=scan_result.risk_score,
                    user_id=str(user.id),
                    threat_level=scan_result.threat_level,
                    timestamp=scan_result.created_at.isoformat(),
                )

            return result
            
        except Exception as e:
            logger.error(f"Error in phishing detection: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "threat_level": "unknown",
                "risk_score": 0.0
            }
    
    async def detect_llm_abuse(
        self, 
        prompt: str,
        user_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        user: Optional[User] = None,
        db_session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """Detect potential abuse or harmful content in LLM prompts.
        
        Args:
            prompt: The prompt text to analyze
            user_id: Optional user ID for tracking
            context: Additional context about the request
            user: Optional user associated with the scan
            db_session: Optional database session for logging
            
        Returns:
            Analysis results with threat level and recommended action
        """
        try:
            model = await self._get_model("llm_abuse_detector")
            
            # Prepare input for the model
            input_data = {
                "prompt": prompt,
                "user_id": user_id or (str(user.id) if user else "anonymous"),
                "context": json.dumps(context) if context else ""
            }
            
            result = await model.predict(input_data)
            
            # Log the scan result if database session is provided
            if db_session and user:
                user_id_str = user_id or str(user.id)
                scan_result = ScanResult(
                    user_id=user.id,
                    scan_type="llm_abuse_detection",
                    target=f"user_prompt:{user_id_str}",
                    result=result,
                    risk_score=result.get("risk_score", 0.0),
                    threat_level=result.get("threat_level", "unknown"),
                    model_used="llm_abuse_detector",
                )
                db_session.add(scan_result)
                await db_session.commit()
                await db_session.refresh(scan_result)

                # Dispatch event for WebSocket feed
                await event_dispatcher.publish(
                    event_type="scan_complete",
                    model="llm_abuse_detector",
                    risk_score=scan_result.risk_score,
                    user_id=str(user.id),
                    threat_level=scan_result.threat_level,
                    timestamp=scan_result.created_at.isoformat(),
                )

            return result
            
        except Exception as e:
            logger.error(f"Error in LLM abuse detection: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "threat_level": "unknown",
                "risk_score": 0.0,
                "action": "allow"  # Default to allow on error
            }
            result = self._generate_mock_result(scan_type, input_data)
            
            # Log completion
            self._log_scan_complete(scan_id, result)
            
            return {
                "scan_id": scan_id,
                "status": "completed",
                "timestamp": datetime.utcnow().isoformat(),
                "scan_type": scan_type,
                "result": result
            }
            
        except Exception as e:
            error_msg = f"Analysis failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            self._log_scan_error(scan_id, error_msg)
            raise RuntimeError(error_msg) from e
    
    def _generate_mock_result(self, scan_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate mock analysis results for demonstration."""
        # In a real implementation, this would use actual ML models
        risk_score = np.random.uniform(0, 1)
        
        if scan_type == "network":
            return {
                "threat_level": "high" if risk_score > 0.7 else "medium" if risk_score > 0.3 else "low",
                "risk_score": float(risk_score),
                "details": {
                    "protocol": input_data.get("protocol", "tcp"),
                    "source_ip": input_data.get("source_ip", "192.168.1.1"),
                    "destination_ip": input_data.get("destination_ip", "10.0.0.1"),
                    "anomalies_detected": ["suspicious_payload", "unusual_traffic_pattern"]
                }
            }
        elif scan_type == "apk":
            return {
                "threat_level": "high" if risk_score > 0.7 else "medium" if risk_score > 0.3 else "low",
                "risk_score": float(risk_score),
                "details": {
                    "package_name": input_data.get("package_name", "com.example.app"),
                    "permissions": input_data.get("permissions", []),
                    "malware_family": "Trojan" if risk_score > 0.7 else "Adware" if risk_score > 0.4 else "None",
                    "suspicious_indicators": [
                        "requests_external_storage_permission",
                        "contains_obfuscated_code"
                    ]
                }
            }
        # Add other scan types as needed
        
        return {
            "threat_level": "unknown",
            "risk_score": 0.0,
            "details": {}
        }
    
    def _log_scan_start(self, scan_type: str, input_data: Dict[str, Any]) -> str:
        """Log the start of a scan and return a scan ID."""
        scan_id = f"scan_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{os.urandom(4).hex()}"
        
        # Read existing scans
        try:
            with open(self.scan_history_file, 'r') as f:
                scans = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            scans = []
        
        # Add new scan
        scan_entry = {
            "scan_id": scan_id,
            "scan_type": scan_type,
            "start_time": datetime.utcnow().isoformat(),
            "status": "started",
            "input_data": input_data,
            "result": None,
            "error": None
        }
        
        scans.append(scan_entry)
        
        # Save updated scans
        with open(self.scan_history_file, 'w') as f:
            json.dump(scans, f, indent=2)
        
        return scan_id
    
    def _log_scan_complete(self, scan_id: str, result: Dict[str, Any]) -> None:
        """Update scan log with completion status and results."""
        self._update_scan_log(scan_id, {
            "status": "completed",
            "end_time": datetime.utcnow().isoformat(),
            "result": result,
            "error": None
        })
    
    def _log_scan_error(self, scan_id: str, error_msg: str) -> None:
        """Update scan log with error information."""
        self._update_scan_log(scan_id, {
            "status": "failed",
            "end_time": datetime.utcnow().isoformat(),
            "error": error_msg
        })
    
    def _update_scan_log(self, scan_id: str, update_data: Dict[str, Any]) -> None:
        """Update an existing scan log entry."""
        try:
            with open(self.scan_history_file, 'r') as f:
                scans = json.load(f)
            
            # Find and update the scan
            for scan in scans:
                if scan.get("scan_id") == scan_id:
                    scan.update(update_data)
                    break
            
            # Save updated scans
            with open(self.scan_history_file, 'w') as f:
                json.dump(scans, f, indent=2)
                
        except Exception as e:
            logger.error(f"Failed to update scan log: {e}", exc_info=True)
            # Don't raise to avoid masking the original error

# Global instance for easy import
analyzer = SecurityAnalyzer()
