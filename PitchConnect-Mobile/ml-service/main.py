# Create ML service folder
mkdir -p ml-service && cd ml-service

# Create Python environment
python -m venv venv

# Activate environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn==0.24.0
numpy==1.24.3
scikit-learn==1.3.2
pandas==2.0.3
python-multipart==0.0.6
pydantic==2.4.2
EOF

# Install dependencies
pip install -r requirements.txt

# Create main.py
cat > main.py << 'PYTHON'
from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

app = FastAPI()

# Models (load or create)
injury_model = None
performance_model = None

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
    recommendations: list

def init_models():
    global injury_model, performance_model
    
    # Create dummy models (replace with real training later)
    X = np.random.rand(100, 6)
    y_injury = np.random.randint(0, 2, 100)
    y_performance = np.random.rand(100)
    
    injury_model = RandomForestClassifier(n_estimators=10)
    injury_model.fit(X, y_injury)
    
    performance_model = RandomForestClassifier(n_estimators=10)
    performance_model.fit(X, y_performance)

@app.on_event("startup")
async def startup():
    init_models()

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "pitchconnect-ml",
        "version": "1.0.0"
    }

@app.post("/predict/injury", response_model=PredictionResponse)
async def predict_injury(request: PredictionRequest):
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
        category = "LOW"
    elif risk_score < 0.6:
        category = "MEDIUM"
    elif risk_score < 0.8:
        category = "HIGH"
    else:
        category = "CRITICAL"
    
    # Generate recommendations
    recommendations = []
    if request.training_load > 0.8:
        recommendations.append("Reduce training intensity")
    if request.sleep_hours < 7:
        recommendations.append("Improve sleep schedule")
    if request.injury_history > 2:
        recommendations.append("Consider injury prevention program")
    
    return PredictionResponse(
        injury_risk=risk_score,
        risk_category=category,
        confidence=0.85,
        recommendations=recommendations
    )

@app.post("/predict/performance", response_model=dict)
async def predict_performance(request: PredictionRequest):
    features = np.array([[
        request.age,
        request.matches_played,
        request.injury_history,
        request.training_load,
        request.sleep_hours,
        request.game_minutes
    ]])
    
    performance_score = float(performance_model.predict(features))
    
    return {
        "performance_score": min(1.0, max(0.0, performance_score)),
        "confidence": 0.82,
        "trend": "improving" if performance_score > 0.5 else "declining"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
PYTHON

# Start ML service
python main.py
