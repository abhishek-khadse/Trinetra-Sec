"""Phishing Detector model.

This module implements detection of phishing attempts in URLs and web pages.
"""
import re
import random
import urllib.parse
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

from .base import BaseModel

class PhishingDetectorModel(BaseModel):
    """Phishing detection model for URLs and web page content.
    
    This is a stub implementation that simulates phishing detection.
    In a production environment, this would use more sophisticated
    techniques like machine learning models trained on phishing datasets.
    """
    
    def __init__(self):
        """Initialize the Phishing Detector model."""
        super().__init__(
            model_name="phishing_detector",
            version="1.0.0"
        )
        
        # Common phishing indicators
        self.suspicious_keywords = [
            "login", "signin", "account", "verify", "secure", "banking",
            "paypal", "ebay", "amazon", "apple", "microsoft", "update",
            "confirm", "billing", "invoice", "payment", "urgent", "action"
        ]
        
        self.suspicious_tlds = [
            ".xyz", ".top", ".gq", ".ml", ".cf", ".tk", ".ga", ".cc",
            ".club", ".online", ".site", ".website", ".space", ".tech"
        ]
        
        self.legit_domains = [
            "google.com", "paypal.com", "microsoft.com", "apple.com",
            "amazon.com", "ebay.com", "netflix.com", "linkedin.com",
            "facebook.com", "twitter.com", "instagram.com"
        ]
        
        # Common phishing page indicators in HTML
        self.html_indicators = [
            (r'<form.*password', 0.5, 'password_field_in_form'),
            (r'<input.*type=["\']*password', 0.6, 'password_input_field'),
            (r'<script.*eval\(', 0.7, 'obfuscated_javascript'),
            (r'document\.write\(', 0.3, 'document_write_usage'),
            (r'<iframe', 0.4, 'iframe_usage'),
            (r'style=["\'].*display\s*:\s*none', 0.5, 'hidden_elements'),
            (r'<link.*\.css', -0.1, 'external_stylesheet'),  # Less likely to be phishing
            (r'<meta.*charset=', -0.1, 'proper_meta_charset'),  # Good practice
        ]
    
    async def load(self):
        """Load the model weights and initialize."""
        # In a real implementation, this would load the actual model
        self.initialized = True
        return self
    
    def _analyze_url(self, url: str) -> Tuple[float, List[Dict]]:
        """Analyze a URL for phishing indicators.
        
        Args:
            url: URL to analyze
            
        Returns:
            Tuple of (risk_score, findings)
        """
        risk_score = 0.0
        findings = []
        
        try:
            parsed = urllib.parse.urlparse(url)
            domain = parsed.netloc.lower()
            path = parsed.path.lower()
            query = parsed.query.lower()
            
            # Check for IP address instead of domain
            ip_pattern = r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}'
            if re.match(ip_pattern, domain):
                risk_score += 0.3
                findings.append({
                    "type": "ip_address_in_url",
                    "risk": "high",
                    "description": "URL contains an IP address instead of a domain name"
                })
            
            # Check for suspicious TLDs
            if any(domain.endswith(tld) for tld in self.suspicious_tlds):
                risk_score += 0.2
                findings.append({
                    "type": "suspicious_tld",
                    "risk": "medium",
                    "description": f"URL uses a suspicious TLD: {domain}"
                })
            
            # Check for @ symbol in URL (user:pass@domain)
            if "@" in url:
                risk_score += 0.4
                findings.append({
                    "type": "credentials_in_url",
                    "risk": "high",
                    "description": "URL contains credentials (user:pass@)"
                })
            
            # Check for subdomains that try to impersonate legitimate sites
            for legit_domain in self.legit_domains:
                if legit_domain in domain and domain != legit_domain:
                    risk_score += 0.5
                    findings.append({
                        "type": "suspicious_subdomain",
                        "risk": "high",
                        "description": f"URL may be trying to impersonate {legit_domain}"
                    })
            
            # Check for URL shortening services
            shorteners = ["bit.ly", "goo.gl", "tinyurl.com", "t.co", "ow.ly", "is.gd"]
            if any(s in domain for s in shorteners):
                risk_score += 0.3
                findings.append({
                    "type": "url_shortener",
                    "risk": "medium",
                    "description": "URL uses a URL shortening service which can hide the actual destination"
                })
            
            # Check for suspicious keywords in path/query
            for keyword in self.suspicious_keywords:
                if keyword in path or keyword in query:
                    risk_score += 0.1
                    findings.append({
                        "type": "suspicious_keyword",
                        "risk": "low",
                        "description": f"URL contains suspicious keyword: {keyword}"
                    })
            
            # Check for HTTPS (negative weight - more secure)
            if parsed.scheme == 'https':
                risk_score -= 0.1
            
        except Exception as e:
            risk_score += 0.2
            findings.append({
                "type": "url_parsing_error",
                "risk": "medium",
                "description": f"Error parsing URL: {str(e)}"
            })
        
        return min(max(risk_score, 0.0), 1.0), findings
    
    def _analyze_html(self, html: str) -> Tuple[float, List[Dict]]:
        """Analyze HTML content for phishing indicators.
        
        Args:
            html: HTML content to analyze
            
        Returns:
            Tuple of (risk_score, findings)
        """
        if not html:
            return 0.0, []
            
        risk_score = 0.0
        findings = []
        
        # Convert to lowercase for case-insensitive matching
        html_lower = html.lower()
        
        # Check for common phishing indicators in HTML
        for pattern, weight, finding_type in self.html_indicators:
            if re.search(pattern, html_lower, re.IGNORECASE | re.DOTALL):
                risk_score += weight
                risk_level = "high" if weight >= 0.5 else "medium" if weight >= 0.3 else "low"
                findings.append({
                    "type": finding_type,
                    "risk": risk_level,
                    "description": f"Found {finding_type} in HTML"
                })
        
        # Check for external resources
        external_resources = re.findall(r'src=["\'](https?://[^"\']+)["\']', html_lower)
        if external_resources:
            risk_score += 0.1
            findings.append({
                "type": "external_resources",
                "risk": "low",
                "description": f"Page loads {len(external_resources)} external resources"
            })
        
        # Check for form submission to non-HTTPS URLs
        form_actions = re.findall(r'<form[^>]*action=["\'](https?://[^"\']+)["\']', html_lower, re.IGNORECASE)
        for action in form_actions:
            if action.startswith('http://'):
                risk_score += 0.3
                findings.append({
                    "type": "insecure_form_submission",
                    "risk": "high",
                    "description": f"Form submits to non-HTTPS URL: {action}"
                })
        
        return min(max(risk_score, 0.0), 1.0), findings
    
    async def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Detect phishing attempts in URLs or web pages.
        
        Args:
            input_data: Dictionary containing either 'url' or 'html' or both
                Example 1 (URL only):
                    {"url": "https://example.com/login"}
                    
                Example 2 (HTML only):
                    {"html": "<html>...</html>"}
                    
                Example 3 (URL and HTML):
                    {
                        "url": "https://example.com/login",
                        "html": "<html>...</html>"
                    }
                
        Returns:
            Dictionary containing analysis results
        """
        if not self.initialized:
            await self.load()
        
        url = input_data.get("url", "")
        html = input_data.get("html", "")
        
        # Analyze URL if provided
        url_risk = 0.0
        url_findings = []
        if url:
            url_risk, url_findings = self._analyze_url(url)
        
        # Analyze HTML if provided
        html_risk = 0.0
        html_findings = []
        if html:
            html_risk, html_findings = self._analyze_html(html)
        
        # Calculate combined risk score
        if url and html:
            # If both URL and HTML are provided, weight them
            risk_score = (url_risk * 0.6) + (html_risk * 0.4)
        elif url:
            risk_score = url_risk
        else:
            risk_score = html_risk
        
        # Add some randomness to make it more realistic
        risk_score += random.uniform(-0.05, 0.05)
        risk_score = max(0.0, min(1.0, risk_score))  # Clamp to [0, 1]
        
        # Determine threat level
        if risk_score > 0.7:
            threat_level = "critical"
        elif risk_score > 0.4:
            threat_level = "high"
        elif risk_score > 0.2:
            threat_level = "medium"
        else:
            threat_level = "low"
        
        # Combine all findings
        all_findings = url_findings + html_findings
        
        # Count findings by risk level
        risk_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for finding in all_findings:
            risk = finding.get("risk", "low").lower()
            if risk in risk_counts:
                risk_counts[risk] += 1
        
        return {
            "threat_level": threat_level,
            "risk_score": float(risk_score),
            "model_used": self.model_name,
            "model_version": self.version,
            "url_analyzed": bool(url),
            "html_analyzed": bool(html),
            "findings_count": len(all_findings),
            "findings_by_risk": risk_counts,
            "findings": all_findings[:50],  # Limit to first 50 findings
            "timestamp": datetime.utcnow().isoformat()
        }
