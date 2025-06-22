"""Base classes for ML models in TrinetraSec.

This module defines the base interfaces and common functionality
for all ML models used in the platform.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class BaseModel(ABC):
    """Abstract base class for all ML models in TrinetraSec."""
    
    def __init__(self, model_name: str, version: str = "1.0.0"):
        """Initialize the base model with name and version.
        
        Args:
            model_name: Name of the model
            version: Model version string
        """
        self.model_name = model_name
        self.version = version
        self.initialized = False
    
    @abstractmethod
    async def load(self):
        """Load the model weights and initialize the model."""
        pass
    
    @abstractmethod
    async def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Make a prediction on the input data.
        
        Args:
            input_data: Dictionary containing input features
            
        Returns:
            Dictionary containing prediction results
        """
        pass
    
    def get_metadata(self) -> Dict[str, str]:
        """Get metadata about the model.
        
        Returns:
            Dictionary containing model metadata
        """
        return {
            "model_name": self.model_name,
            "version": self.version,
            "initialized": self.initialized
        }
    
    async def __call__(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Make a prediction (convenience method)."""
        return await self.predict(input_data)
