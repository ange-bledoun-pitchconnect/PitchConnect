from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os
from pathlib import Path
import asyncio

app = FastAPI(title='PitchConnect ML Service', version='1.0.0')

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Models storage
injury_model = None
performance_model = None
models_loaded = False

class PredictionRequest(BaseModel):
    age: int
    matches_played: int
    injury_history: int
    training_load: float
    sleep_hours: float
    game_minutes: int

class PredictionResponse(BaseModel):
    injury_risk: float
    risk_category: str
    confidence: float
    recommendations: list[str]

class PerformanceResponse(BaseModel):
    performance_score: float
    confidence: float
    trend: str

def init_models():
    global injury_model, performance_model, models_loaded
    
    if models_loaded:
        return
    
    # Training data (will be replaced with real data)
    X = np.random.rand(100, 6)
    y_injury = np.random.randint(0, 2, 100)
    
    # Train models
    injury_model = RandomForestClassifier(
        n_estimators=10,
        max_depth=5,
        random_state=42
    )
    injury_model.fit(X, y_injury)
    
    performance_model = RandomForestClassifier(
        n_estimators=10,
        max_depth=5,
        random_state=42
    )
    performance_model.fit(X, y_injury)
    
    models_loaded = True

@app.on_event('startup')
async def startup_event():
    init_models()

@app.get('/health')
async def health_check():
    return {
        'status': 'healthy',
        'service': 'pitchconnect-ml',
        'version': '1.0.0',
        'models_loaded': models_loaded
    }

@app.post('/predict/injury', response_model=PredictionResponse)
async def predict_injury(request: PredictionRequest):
    if not injury_model:
        raise HTTPException(status_code=500, detail='Model not loaded')
    
    # Prepare features
    features = np.array([[
        request.age,
        request.matches_played,
        request.injury_history,
        request.training_load,
        request.sleep_hours,
        request.game_minutes
    ]])
    
    # Predict
    risk_score = float(injury_model.predict_proba(features))
    
    # Determine category
    if risk_score < 0.3:
        category = 'LOW'
    elif risk_score < 0.6:
        category = 'MEDIUM'
    elif risk_score < 0.8:
        category = 'HIGH'
    else:
        category = 'CRITICAL'
    
    # Generate recommendations
    recommendations = []
    if request.training_load > 0.8:
        recommendations.append('Reduce training intensity')
    if request.sleep_hours < 7:
        recommendations.append('Improve sleep schedule')
    if request.injury_history > 2:
        recommendations.append('Consider injury prevention program')
    if not recommendations:
        recommendations.append('Continue current routine')
    
    return PredictionResponse(
        injury_risk=risk_score,
        risk_category=category,
        confidence=0.85,
        recommendations=recommendations
    )

@app.post('/predict/performance', response_model=PerformanceResponse)
async def predict_performance(request: PredictionRequest):
    if not performance_model:
        raise HTTPException(status_code=500, detail='Model not loaded')
    
    features = np.array([[
        request.age,
        request.matches_played,
        request.injury_history,
        request.training_load,
        request.sleep_hours,
        request.game_minutes
    ]])
    
    performance_score = float(performance_model.predict(features))
    normalized_score = min(1.0, max(0.0, performance_score))
    
    return PerformanceResponse(
        performance_score=normalized_score,
        confidence=0.82,
        trend='improving' if normalized_score > 0.5 else 'declining'
    )

@app.get('/models/status')
async def model_status():
    return {
        'injury_model_loaded': injury_model is not None,
        'performance_model_loaded': performance_model is not None,
        'models_ready': models_loaded
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(
        app,
        host='127.0.0.1',
        port=5000,
        log_level='info'
    )
