"""LLM Abuse Detector model.

This module implements detection of potential abuse or malicious use of LLM prompts.
"""
import re
import random
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

from .base import BaseModel

class LLMAbuseDetectorModel(BaseModel):
    """LLM Abuse Detection model for identifying potentially harmful prompts.
    
    This is a stub implementation that simulates abuse detection.
    In a production environment, this would use more sophisticated
    techniques like fine-tuned language models or rule-based classifiers.
    """
    
    def __init__(self):
        """Initialize the LLM Abuse Detector model."""
        super().__init__(
            model_name="llm_abuse_detector",
            version="1.0.0"
        )
        
        # Categories of potential abuse
        self.abuse_categories = {
            "harmful_instructions": {
                "patterns": [
                    (r'how (to|can i) (make|create|build) (a|an)? (bomb|explosive|weapon)', 0.9, 'bomb_instructions'),
                    (r'how (to|can i) (kill|harm|hurt|attack) (someone|people|myself)', 0.9, 'violence_instructions'),
                    (r'how (to|can i) (hack|break into|access) (a|an)? (computer|system|account)', 0.8, 'hacking_instructions'),
                    (r'how (to|can i) make (a|an)? (poison|toxic|hazardous) (substance|chemical)', 0.85, 'poison_instructions'),
                ],
                "description": "Instructions for causing harm or illegal activities"
            },
            "hate_speech": {
                "patterns": [
                    (r'(kill|hurt|attack) (all|the|those) (\w+) (people|person|group)', 0.8, 'hate_speech_violence'),
                    (r'(i hate|i dislike) (all|the|those) (\w+) (people|person|group)', 0.6, 'hate_speech_general'),
                    (r'(\w+) (are|is) (stupid|dumb|worthless|evil|disgusting)', 0.5, 'hate_speech_derogatory'),
                ],
                "description": "Hate speech or discriminatory content"
            },
            "misinformation": {
                "patterns": [
                    (r'(the earth is flat|vaccines cause autism|climate change is a hoax)', 0.7, 'common_misinformation'),
                    (r'(fake news|false flag|conspiracy)', 0.5, 'conspiracy_theory'),
                ],
                "description": "Known misinformation or conspiracy theories"
            },
            "jailbreak": {
                "patterns": [
                    (r'(ignore|disregard) (all|previous|the) (instructions|prompts)', 0.8, 'ignore_instructions'),
                    (r'(act as|pretend to be|role play as) (someone|something) else', 0.7, 'role_play_request'),
                    (r'(generate|write|create) (a|an)? (inappropriate|offensive|explicit) (content|joke|story)', 0.9, 'explicit_content_request'),
                ],
                "description": "Attempts to bypass safety restrictions"
            },
            "privacy_violation": {
                "patterns": [
                    (r'(what is|tell me|give me) (the|my) (password|api[ _]?key|secret)', 0.9, 'credential_request'),
                    (r'(who is|find|locate) (a|the) (person|people) (named|called)', 0.6, 'doxing_request'),
                ],
                "description": "Requests for private or personal information"
            },
            "self_harm": {
                "patterns": [
                    (r'(i want to|i need to|help me) (die|kill myself|end it all)', 0.95, 'suicidal_ideation'),
                    (r'(i am|i feel) (hopeless|worthless|useless|like giving up)', 0.7, 'emotional_distress'),
                    (r'(cutting|hurting) (myself|myself again)', 0.9, 'self_harm_mention'),
                ],
                "description": "Indications of self-harm or suicidal ideation"
            }
        }
        
        # Common false positives to ignore
        self.false_positives = [
            r'how to protect yourself from (\w+) attacks',
            r'how to secure your (\w+) from being hacked',
            r'ethical hacking',
            r'cybersecurity training',
            r'how to report (hate speech|abuse|harassment)',
            r'how to get help for (depression|suicidal thoughts)',
        ]
    
    async def load(self):
        """Load the model weights and initialize."""
        # In a real implementation, this would load the actual model
        self.initialized = True
        return self
    
    def _check_false_positives(self, text: str) -> bool:
        """Check if the text matches any known false positive patterns."""
        for pattern in self.false_positives:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    def _analyze_text(self, text: str) -> Tuple[float, List[Dict]]:
        """Analyze text for potential abuse.
        
        Args:
            text: Text to analyze
            
        Returns:
            Tuple of (risk_score, findings)
        """
        if not text or not text.strip():
            return 0.0, []
            
        # Check for false positives first
        if self._check_false_positives(text):
            return 0.0, [{
                "type": "false_positive",
                "risk": "none",
                "description": "Text matches a known educational or safety context"
            }]
        
        risk_score = 0.0
        findings = []
        
        # Check each category of abuse
        for category, category_data in self.abuse_categories.items():
            for pattern, weight, finding_type in category_data["patterns"]:
                if re.search(pattern, text, re.IGNORECASE):
                    risk_score += weight
                    
                    # Get the matched text for context
                    matches = re.finditer(pattern, text, re.IGNORECASE)
                    matched_text = [m.group(0) for m in matches][:3]  # Get up to 3 matches
                    
                    findings.append({
                        "type": finding_type,
                        "category": category,
                        "risk": "high" if weight >= 0.8 else "medium" if weight >= 0.6 else "low",
                        "description": f"Potential {category.replace('_', ' ')} detected",
                        "matched_text": matched_text,
                        "category_description": category_data["description"]
                    })
        
        # Check for excessive length (potential prompt injection)
        if len(text) > 1000:  # Very long prompts might be trying to confuse the model
            risk_score += 0.2
            findings.append({
                "type": "excessive_length",
                "risk": "medium",
                "description": "Extremely long prompt which might be attempting prompt injection"
            })
        
        # Check for suspicious encoding or obfuscation
        if any(c > 127 for c in text.encode()):  # Non-ASCII characters
            risk_score += 0.1
            findings.append({
                "type": "non_ascii_chars",
                "risk": "low",
                "description": "Contains non-ASCII characters which might be used for obfuscation"
            })
        
        return min(max(risk_score, 0.0), 1.0), findings
    
    async def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Detect potential abuse in LLM prompts.
        
        Args:
            input_data: Dictionary containing 'prompt' and optionally 'user_id' and 'context'
                Example:
                {
                    "prompt": "How to make a bomb?",
                    "user_id": "user123",
                    "context": "user has a history of concerning behavior"
                }
                
        Returns:
            Dictionary containing analysis results
        """
        if not self.initialized:
            await self.load()
        
        prompt = input_data.get("prompt", "")
        user_id = input_data.get("user_id", "anonymous")
        context = input_data.get("context", "")
        
        # Analyze the prompt text
        risk_score, findings = self._analyze_text(prompt)
        
        # Adjust risk based on context if available
        if context and ("concerning" in context.lower() or "history" in context.lower()):
            risk_score = min(risk_score * 1.5, 1.0)  # Increase risk if context is concerning
            findings.append({
                "type": "elevated_risk_context",
                "risk": "medium",
                "description": "User context indicates elevated risk"
            })
        
        # Add some randomness to make it more realistic
        risk_score += random.uniform(-0.05, 0.05)
        risk_score = max(0.0, min(1.0, risk_score))  # Clamp to [0, 1]
        
        # Determine threat level
        if risk_score > 0.8:
            threat_level = "critical"
            action = "block"
        elif risk_score > 0.5:
            threat_level = "high"
            action = "review"
        elif risk_score > 0.2:
            threat_level = "medium"
            action = "flag"
        else:
            threat_level = "low"
            action = "allow"
        
        # Count findings by risk level
        risk_counts = {"high": 0, "medium": 0, "low": 0}
        for finding in findings:
            risk = finding.get("risk", "low").lower()
            if risk in risk_counts:
                risk_counts[risk] += 1
        
        return {
            "threat_level": threat_level,
            "risk_score": float(risk_score),
            "action": action,
            "model_used": self.model_name,
            "model_version": self.version,
            "user_id": user_id,
            "prompt_length": len(prompt),
            "findings_count": len(findings),
            "findings_by_risk": risk_counts,
            "findings": findings[:20],  # Limit to first 20 findings
            "timestamp": datetime.utcnow().isoformat()
        }
