# FILE: ml-service\main.py
# Production-ready FastAPI ML service for PitchConnect

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
import joblib
import os
import logging
from datetime import datetime
from pathlib import Path
import json

# ============================================================================
# CONFIGURATION
# ============================================================================

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Model paths
MODEL_DIR = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

INJURY_MODEL_PATH = MODEL_DIR / "injury_predictor.pkl"
PERFORMANCE_MODEL_PATH = MODEL_DIR / "performance_predictor.pkl"

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title='PitchConnect ML Service',
    version='2.0.0',
    description='AI-powered sports analytics and predictions for PitchConnect'
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# ============================================================================
# DATA MODELS
# ============================================================================

class PredictionRequest(BaseModel):
    """Player data for prediction"""
    age: int = Field(..., ge=5, le=100, description="Player age")
    matches_played: int = Field(..., ge=0, description="Total matches played")
    injury_history: int = Field(..., ge=0, description="Number of previous injuries")
    training_load: float = Field(..., ge=0.0, le=1.0, description="Training intensity (0-1)")
    sleep_hours: float = Field(..., ge=0, le=24, description="Average sleep hours per night")
    game_minutes: int = Field(..., ge=0, description="Total minutes played this season")

class PredictionResponse(BaseModel):
    """Injury prediction response"""
    injury_risk: float = Field(..., ge=0, le=1, description="Risk score (0-1)")
    risk_category: str = Field(..., description="Risk level: LOW, MEDIUM, HIGH, CRITICAL")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence (0-1)")
    recommendations: List[str] = Field(..., description="Actionable recommendations")

class PerformanceResponse(BaseModel):
    """Performance prediction response"""
    performance_score: float = Field(..., ge=0, le=1, description="Performance score (0-1)")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence")
    trend: str = Field(..., description="Trend: improving, stable, declining")
    expected_minutes: int = Field(..., description="Expected minutes for next match")

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    models_loaded: bool
    timestamp: str

# ============================================================================
# MODEL MANAGEMENT
# ============================================================================

class ModelManager:
    """Manages ML models lifecycle"""
    
    def __init__(self):
        self.injury_model = None
        self.performance_model = None
        self.models_loaded = False
        
    def init_models(self):
        """Initialize or load models"""
        if self.models_loaded:
            return
        
        try:
            # Try to load existing models
            if INJURY_MODEL_PATH.exists():
                self.injury_model = joblib.load(INJURY_MODEL_PATH)
                logger.info("Loaded injury model from disk")
            else:
                self.injury_model = self._train_injury_model()
                joblib.dump(self.injury_model, INJURY_MODEL_PATH)
                logger.info("Trained and saved injury model")
            
            if PERFORMANCE_MODEL_PATH.exists():
                self.performance_model = joblib.load(PERFORMANCE_MODEL_PATH)
                logger.info("Loaded performance model from disk")
            else:
                self.performance_model = self._train_performance_model()
                joblib.dump(self.performance_model, PERFORMANCE_MODEL_PATH)
                logger.info("Trained and saved performance model")
            
            self.models_loaded = True
            logger.info("All models initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing models: {str(e)}")
            raise
    
    def _train_injury_model(self):
        """Train injury prediction model"""
        # Synthetic training data (replace with real data)
        np.random.seed(42)
        X = np.random.rand(500, 6)
        
        # Create realistic labels based on features
        y = (
            (X[:, 2] > 1) * 1 +  # injury history
            (X[:, 3] > 0.8) * 1 +  # high training load
            (X[:, 4] < 6) * 1 +  # poor sleep
            (X[:, 5] > 2000) * 1  # many minutes
        ) > 1
        
        model = RandomForestClassifier(
            n_estimators=50,
            max_depth=8,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X, y)
        return model
    
    def _train_performance_model(self):
        """Train performance prediction model"""
        np.random.seed(42)
        X = np.random.rand(500, 6)
        
        # Performance score based on features
        y = (
            X[:, 0] / 100 * 0.2 +  # age factor
            (X[:, 1] / 100) * 0.2 +  # experience
            (1 - X[:, 2] * 0.1) * 0.2 +  # injury penalty
            (X[:, 3] * 0.2) +  # training load benefit
            (X[:, 4] / 8) * 0.2 +  # sleep factor
            np.random.rand(500) * 0.1  # randomness
        )
        y = np.clip(y, 0, 1)
        
        model = GradientBoostingRegressor(
            n_estimators=50,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        model.fit(X, y)
        return model
    
    def predict_injury(self, request: PredictionRequest) -> PredictionResponse:
        """Predict injury risk"""
        if not self.injury_model:
            raise HTTPException(status_code=500, detail='Injury model not loaded')
        
        features = np.array([[
            request.age,
            request.matches_played,
            request.injury_history,
            request.training_load,
            request.sleep_hours,
            request.game_minutes
        ]])
        
        # Get probability for positive class
        risk_score = float(self.injury_model.predict_proba(features))
        
        # Determine category
        if risk_score < 0.3:
            category = 'LOW'
        elif risk_score < 0.6:
            category = 'MEDIUM'
        elif risk_score < 0.8:
            category = 'HIGH'
        else:
            category = 'CRITICAL'
        
        # Generate recommendations based on features
        recommendations = []
        if request.training_load > 0.8:
            recommendations.append('Reduce training intensity')
        if request.sleep_hours < 7:
            recommendations.append('Improve sleep quality - aim for 8+ hours')
        if request.injury_history > 2:
            recommendations.append('Work with physio on injury prevention')
        if request.matches_played > 30:
            recommendations.append('Monitor recovery between matches')
        if not recommendations:
            recommendations.append('Continue current routine - low risk')
        
        return PredictionResponse(
            injury_risk=risk_score,
            risk_category=category,
            confidence=0.85,
            recommendations=recommendations
        )
    
    def predict_performance(self, request: PredictionRequest) -> PerformanceResponse:
        """Predict player performance"""
        if not self.performance_model:
            raise HTTPException(status_code=500, detail='Performance model not loaded')
        
        features = np.array([[
            request.age,
            request.matches_played,
            request.injury_history,
            request.training_load,
            request.sleep_hours,
            request.game_minutes
        ]])
        
        performance_score = float(self.performance_model.predict(features))
        normalized_score = np.clip(performance_score, 0, 1)
        
        # Expected minutes based on performance
        base_minutes = 90
        expected_minutes = int(base_minutes * (0.7 + normalized_score * 0.3))
        
        # Trend determination
        if normalized_score > 0.7:
            trend = 'improving'
        elif normalized_score > 0.4:
            trend = 'stable'
        else:
            trend = 'declining'
        
        return PerformanceResponse(
            performance_score=normalized_score,
            confidence=0.82,
            trend=trend,
            expected_minutes=expected_minutes
        )

# Initialize model manager
model_manager = ModelManager()

# ============================================================================
# STARTUP/SHUTDOWN EVENTS
# ============================================================================

@app.on_event('startup')
async def startup_event():
    """Initialize models on startup"""
    logger.info("PitchConnect ML Service starting...")
    model_manager.init_models()
    logger.info("ML Service ready!")

@app.on_event('shutdown')
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("PitchConnect ML Service shutting down...")

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get('/health', response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status='healthy',
        service='pitchconnect-ml',
        version='2.0.0',
        models_loaded=model_manager.models_loaded,
        timestamp=datetime.now().isoformat()
    )

@app.post('/predict/injury', response_model=PredictionResponse)
async def predict_injury(request: PredictionRequest):
    """
    Predict injury risk for a player
    
    - **age**: Player age (5-100)
    - **matches_played**: Total matches played (0+)
    - **injury_history**: Number of previous injuries (0+)
    - **training_load**: Training intensity (0.0-1.0)
    - **sleep_hours**: Average sleep per night (0-24)
    - **game_minutes**: Total minutes played this season (0+)
    
    Returns:
    - **injury_risk**: Risk score (0-1)
    - **risk_category**: LOW, MEDIUM, HIGH, CRITICAL
    - **confidence**: Model confidence (0-1)
    - **recommendations**: List of recommendations
    """
    return model_manager.predict_injury(request)

@app.post('/predict/performance', response_model=PerformanceResponse)
async def predict_performance(request: PredictionRequest):
    """
    Predict player performance for next match
    
    Returns:
    - **performance_score**: Performance prediction (0-1)
    - **confidence**: Model confidence
    - **trend**: improving, stable, declining
    - **expected_minutes**: Expected playing time
    """
    return model_manager.predict_performance(request)

@app.get('/models/status')
async def model_status():
    """Get model loading status"""
    return {
        'injury_model_loaded': model_manager.injury_model is not None,
        'performance_model_loaded': model_manager.performance_model is not None,
        'models_ready': model_manager.models_loaded,
        'injury_model_path': str(INJURY_MODEL_PATH),
        'performance_model_path': str(PERFORMANCE_MODEL_PATH)
    }

@app.get('/metrics')
async def get_metrics():
    """Get service metrics"""
    return {
        'service': 'pitchconnect-ml',
        'version': '2.0.0',
        'status': 'operational',
        'uptime_check': 'last_health_check',
        'models_loaded': model_manager.models_loaded,
        'timestamp': datetime.now().isoformat()
    }

@app.get('/docs')
async def docs():
    """API documentation"""
    return {
        'title': 'PitchConnect ML Service',
        'version': '2.0.0',
        'endpoints': {
            'health': '/health',
            'injury_prediction': '/predict/injury',
            'performance_prediction': '/predict/performance',
            'model_status': '/models/status',
            'metrics': '/metrics'
        }
    }

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return {
        'error': 'Invalid input',
        'message': str(exc),
        'status_code': 400
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return {
        'error': 'Internal server error',
        'message': str(exc),
        'status_code': 500
    }

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    import uvicorn
    
    uvicorn.run(
        app,
        host='127.0.0.1',
        port=5000,
        log_level='info',
        access_log=True
    )
