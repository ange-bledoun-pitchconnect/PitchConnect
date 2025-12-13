import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import datetime

class InjuryPredictor:
    """Predicts injury risk based on player statistics"""
    
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.features = [
            'age', 'minutes_played', 'matches_in_last_30_days',
            'tackle_ratio', 'physical_intensity', 'previous_injuries'
        ]
        
    def train(self, X_train, y_train):
        """Train the injury prediction model"""
        X_scaled = self.scaler.fit_transform(X_train[self.features])
        self.model.fit(X_scaled, y_train)
        return self
    
    def predict(self, player_data: dict) -> dict:
        """Predict injury risk for a player"""
        X = pd.DataFrame([player_data])[self.features]
        X_scaled = self.scaler.transform(X)
        
        probability = self.model.predict_proba(X_scaled)
        risk_level = probability  # Probability of injury
        
        return {
            'injury_risk': float(risk_level),
            'risk_category': self._categorize_risk(risk_level),
            'recommendations': self._get_recommendations(risk_level)
        }
    
    def _categorize_risk(self, risk: float) -> str:
        if risk < 0.25:
            return 'LOW'
        elif risk < 0.50:
            return 'MEDIUM'
        elif risk < 0.75:
            return 'HIGH'
        else:
            return 'CRITICAL'
    
    def _get_recommendations(self, risk: float) -> list:
        """Get personalized recommendations based on risk level"""
        recommendations = []
        
        if risk > 0.5:
            recommendations.append('Reduce playing time')
            recommendations.append('Focus on recovery')
        
        if risk > 0.7:
            recommendations.append('Medical evaluation recommended')
        
        return recommendations
    
    def save(self, path: str):
        """Save model to file"""
        joblib.dump({'model': self.model, 'scaler': self.scaler}, path)
    
    def load(self, path: str):
        """Load model from file"""
        data = joblib.load(path)
        self.model = data['model']
        self.scaler = data['scaler']
        return self

# Global instance
predictor = InjuryPredictor()
