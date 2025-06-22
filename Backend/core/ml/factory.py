"""Model Factory for TrinetraSec ML models.

This module provides a factory pattern for creating and managing
instances of ML models used in the TrinetraSec platform.
"""
from typing import Dict, Type, Any, Optional
import importlib
import logging

from .base import BaseModel

logger = logging.getLogger(__name__)

# Model registry mapping model names to their implementations
MODEL_REGISTRY = {
    "network_ids": "trinetrasec.core.ml.network_ids.NetworkIDSModel",
    "apk_analyzer": "trinetrasec.core.ml.apk_analyzer.APKAnalyzerModel",
    "phishing_detector": "trinetrasec.core.ml.phishing_detector.PhishingDetectorModel",
    "llm_abuse_detector": "trinetrasec.core.ml.llm_abuse_detector.LLMAbuseDetectorModel",
}

class ModelFactory:
    """Factory class for creating and managing ML model instances."""
    
    _instance = None
    _models: Dict[str, BaseModel] = {}
    
    def __new__(cls):
        """Ensure only one instance of the factory exists (Singleton pattern)."""
        if cls._instance is None:
            cls._instance = super(ModelFactory, cls).__new__(cls)
        return cls._instance
    
    @classmethod
    def get_model_class(cls, model_name: str) -> Type[BaseModel]:
        """Get the model class for the given model name.
        
        Args:
            model_name: Name of the model to get
            
        Returns:
            The model class
            
        Raises:
            ValueError: If the model name is not registered
            ImportError: If there's an error importing the model module
        """
        if model_name not in MODEL_REGISTRY:
            raise ValueError(f"Model '{model_name}' is not registered. Available models: {list(MODEL_REGISTRY.keys())}")
        
        module_path, class_name = MODEL_REGISTRY[model_name].rsplit('.', 1)
        
        try:
            module = importlib.import_module(module_path)
            model_class = getattr(module, class_name)
            return model_class
        except (ImportError, AttributeError) as e:
            logger.error(f"Error importing model {model_name}: {str(e)}")
            raise ImportError(f"Could not import model {model_name}: {str(e)}")
    
    async def get_model(self, model_name: str) -> BaseModel:
        """Get an instance of the specified model, loading it if necessary.
        
        Args:
            model_name: Name of the model to get
            
        Returns:
            An instance of the requested model
            
        Raises:
            ValueError: If the model name is not registered
            RuntimeError: If there's an error initializing the model
        """
        # Return cached model if available
        if model_name in self._models:
            return self._models[model_name]
        
        # Create and initialize new model instance
        model_class = self.get_model_class(model_name)
        try:
            model = model_class()
            await model.load()
            self._models[model_name] = model
            logger.info(f"Initialized model: {model_name}")
            return model
        except Exception as e:
            logger.error(f"Error initializing model {model_name}: {str(e)}")
            raise RuntimeError(f"Failed to initialize model {model_name}: {str(e)}")
    
    async def get_all_models(self) -> Dict[str, BaseModel]:
        """Get all registered models, initializing them if necessary.
        
        Returns:
            Dictionary mapping model names to model instances
        """
        for model_name in MODEL_REGISTRY:
            if model_name not in self._models:
                try:
                    await self.get_model(model_name)
                except Exception as e:
                    logger.error(f"Skipping model {model_name} due to error: {str(e)}")
        return self._models
    
    def clear_cache(self):
        """Clear the model cache, forcing models to be reloaded on next access."""
        self._models = {}
        logger.info("Cleared model cache")

# Global factory instance
model_factory = ModelFactory()

# Convenience functions
def get_model_factory() -> ModelFactory:
    """Get the global model factory instance."""
    return model_factory

async def get_model(model_name: str) -> BaseModel:
    """Get a model instance by name.
    
    This is a convenience function that uses the global model factory.
    """
    return await model_factory.get_model(model_name)

async def get_all_models() -> Dict[str, BaseModel]:
    """Get all registered models.
    
    This is a convenience function that uses the global model factory.
    """
    return await model_factory.get_all_models()
