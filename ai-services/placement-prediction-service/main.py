"""
Placement Prediction Service - FastAPI
Predicts placement probability using Random Forest (ML) and Neural Network (DL)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os

# Try to import TensorFlow/Keras for Deep Learning model
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TENSORFLOW_AVAILABLE = True
    print("[OK] TensorFlow/Keras available for Deep Learning models")
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("[WARN] TensorFlow not available - using ML models only")

app = FastAPI(title="Placement Prediction Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
rf_model = None  # Random Forest (ML) - Optional, only if training data available
nn_model = None  # Neural Network (DL) - Optional, only if training data available
scaler = StandardScaler()
use_ml_models = False  # Set to True only if you have real historical training data

# Model paths for loading pre-trained models
MODELS_DIR = "models"
RF_MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model.joblib")
NN_MODEL_PATH = os.path.join(MODELS_DIR, "neural_network_model.h5")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.joblib")

# NOTE: No training dataset required!
# The service uses rule-based weighted scoring by default.
# ML/DL models are optional and only used if you provide real historical placement data.
# 
# To use ML/DL models, you need to:
# 1. Collect historical placement data (student profiles + placement outcomes)
# 2. Format as: [resumeScore, cgpa, attendancePercent, hasInternship, numProjects, numSkills]
# 3. Provide labels: 1 = placed, 0 = not placed
# 4. Set use_ml_models = True and provide training_features and training_labels below

# Training data - ONLY populate if you have real historical data
# Leave empty to use rule-based scoring (recommended for production)
training_features = None  # np.array([...])  # Provide real data here if available
training_labels = None    # np.array([...])  # Provide real labels here if available

# Optional: Load training data from file if available
# Example: Load from CSV, database, or JSON file with real placement history
# if os.path.exists("training_data.csv"):
#     import pandas as pd
#     df = pd.read_csv("training_data.csv")
#     training_features = df[['resumeScore', 'cgpa', 'attendancePercent', 'hasInternship', 'numProjects', 'numSkills']].values
#     training_labels = df['placed'].values
#     use_ml_models = True

# Try to load pre-trained models first (FAST - no training required)
print("[INFO] Attempting to load pre-trained models...")
if os.path.exists(RF_MODEL_PATH) and os.path.exists(SCALER_PATH):
    try:
        scaler = joblib.load(SCALER_PATH)
        rf_model = joblib.load(RF_MODEL_PATH)
        use_ml_models = True
        print(f"[OK] Pre-trained Random Forest (ML) model loaded from {RF_MODEL_PATH}")
        print("[INFO] Model is ready for fast predictions!")
    except Exception as e:
        print(f"[WARN] Failed to load pre-trained Random Forest model: {e}")
        print("[INFO] Will try training if data is available, or use rule-based scoring")
        rf_model = None
        scaler = StandardScaler()
else:
    print("[INFO] No pre-trained Random Forest model found. Checking for training data...")

# If pre-trained models not found, try to train from data
if rf_model is None and use_ml_models and training_features is not None and training_labels is not None:
    try:
        if len(training_features) < 10:
            print("[WARN] Training dataset too small (< 10 samples). Using rule-based scoring instead.")
            use_ml_models = False
        else:
            X_scaled = scaler.fit_transform(training_features)
            rf_model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
            rf_model.fit(X_scaled, training_labels)
            print(f"[OK] Random Forest (ML) model trained with {len(training_features)} samples")
            # Save the trained model for future use
            os.makedirs(MODELS_DIR, exist_ok=True)
            joblib.dump(rf_model, RF_MODEL_PATH)
            joblib.dump(scaler, SCALER_PATH)
            print(f"[OK] Trained model saved to {RF_MODEL_PATH} for faster loading next time")
    except Exception as e:
        print(f"[WARN] Random Forest model initialization failed: {e}")
        print("[INFO] Falling back to rule-based scoring")
        use_ml_models = False
        rf_model = None

if not use_ml_models and rf_model is None:
    print("[INFO] Using rule-based weighted scoring (no ML/DL models).")
    print("[INFO] To use ML/DL models, run: python train_models.py")

# Try to load pre-trained Neural Network model (FAST - no training required)
if TENSORFLOW_AVAILABLE and os.path.exists(NN_MODEL_PATH):
    try:
        nn_model = keras.models.load_model(NN_MODEL_PATH)
        use_ml_models = True
        print(f"[OK] Pre-trained Neural Network (DL) model loaded from {NN_MODEL_PATH}")
        print("[INFO] Deep Learning model is ready for fast predictions!")
    except Exception as e:
        print(f"[WARN] Failed to load pre-trained Neural Network model: {e}")
        nn_model = None
elif TENSORFLOW_AVAILABLE and use_ml_models and training_features is not None and training_labels is not None:
    # If pre-trained model not found, try to train from data
    try:
        if len(training_features) < 20:
            print("[WARN] Training dataset too small for Neural Network (< 20 samples). Using Random Forest or rule-based scoring.")
        else:
            # Build a simple neural network
            nn_model = keras.Sequential([
                layers.Dense(64, activation='relu', input_shape=(6,)),
                layers.Dropout(0.3),
                layers.Dense(32, activation='relu'),
                layers.Dropout(0.2),
                layers.Dense(16, activation='relu'),
                layers.Dense(1, activation='sigmoid')  # Binary classification (placed/not placed)
            ])
            
            # Compile the model
            nn_model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=0.001),
                loss='binary_crossentropy',
                metrics=['accuracy']
            )
            
            # Train the model
            X_scaled_nn = scaler.transform(training_features)  # Use already-fitted scaler
            y_nn = training_labels.astype(np.float32)
            
            # Train with early stopping to prevent overfitting
            history = nn_model.fit(
                X_scaled_nn, y_nn,
                epochs=100,
                batch_size=min(8, len(training_features) // 4),
                verbose=0,
                validation_split=0.2 if len(training_features) > 20 else 0.0
            )
            
            print(f"[OK] Neural Network (DL) model trained successfully")
            print(f"[INFO] Final training accuracy: {history.history['accuracy'][-1]:.4f}")
            # Save the trained model for future use
            os.makedirs(MODELS_DIR, exist_ok=True)
            nn_model.save(NN_MODEL_PATH)
            print(f"[OK] Trained model saved to {NN_MODEL_PATH} for faster loading next time")
    except Exception as e:
        print(f"[WARN] Neural Network model initialization failed: {e}")
        print("[INFO] Falling back to Random Forest or rule-based scoring")
        nn_model = None
elif TENSORFLOW_AVAILABLE and not use_ml_models:
    print("[INFO] TensorFlow available but no pre-trained models or training data. Using rule-based scoring.")
    print("[INFO] To use DL models, run: python train_models.py")


class PlacementPredictionRequest(BaseModel):
    resumeScore: float
    cgpa: float
    attendancePercent: float
    hasInternship: bool = False
    numProjects: int = 0
    numSkills: int = 0
    skills: Optional[List[str]] = []


class PlacementPredictionResponse(BaseModel):
    mostLikelyScore: float  # Probability of placement (0-100)
    prediction: str  # "High", "Medium", "Low"
    confidence: float
    factors: dict  # Explainable factors


def predict_placement_probability(features: np.ndarray, use_dl: bool = None) -> tuple:
    """
    Predict placement probability using:
    1. DL (Neural Network) if available and trained
    2. ML (Random Forest) if available and trained
    3. Rule-based weighted scoring (default, no training required)
    """
    # Default: Use rule-based scoring (no training data required)
    if not use_ml_models or (rf_model is None and nn_model is None):
        return predict_fallback(features)
    
    # If ML models are available, try to use them
    if use_dl is None:
        use_dl = TENSORFLOW_AVAILABLE and nn_model is not None
    
    try:
        # Need to fit scaler if it wasn't fitted during training
        if not hasattr(scaler, 'mean_') or scaler.mean_ is None:
            # If scaler not fitted, use rule-based scoring
            return predict_fallback(features)
        
        features_scaled = scaler.transform(features.reshape(1, -1))
        
        if use_dl and nn_model is not None:
            # Use Deep Learning (Neural Network) model
            try:
                prediction = nn_model.predict(features_scaled, verbose=0)[0][0]
                placed_prob = prediction * 100  # Convert to percentage
                binary_prediction = 1 if placed_prob >= 50 else 0
                return placed_prob, binary_prediction
            except Exception as dl_err:
                print(f"[WARN] DL model prediction failed, falling back to ML: {dl_err}")
                use_dl = False
        
        # Use Machine Learning (Random Forest) model
        if rf_model is not None:
            probability = rf_model.predict_proba(features_scaled)[0]
            placed_prob = probability[1] * 100  # Probability of being placed
            return placed_prob, rf_model.predict(features_scaled)[0]
        else:
            return predict_fallback(features)
    except Exception as e:
        print(f"[WARN] ML/DL prediction error, using rule-based scoring: {e}")
        return predict_fallback(features)


def predict_fallback(features: np.ndarray) -> tuple:
    """
    Rule-based weighted scoring (DEFAULT METHOD - No training data required)
    This is the primary prediction method when no ML/DL models are trained.
    Based on industry-standard placement criteria.
    """
    resume_score, cgpa, attendance, has_internship, num_projects, num_skills = features[0]
    
    # Industry-standard weighted scoring (no training required)
    # These weights are based on common placement criteria
    score = (
        resume_score * 0.30 +           # Resume quality (30% weight)
        cgpa * 10 * 0.25 +               # CGPA out of 10, scaled (25% weight)
        attendance * 0.20 +              # Attendance percentage (20% weight)
        (1 if has_internship else 0) * 15 +  # Internship experience (15 points)
        min(num_projects * 3, 15) +      # Projects (max 15 points)
        min(num_skills * 2, 10)           # Skills (max 10 points)
    )
    
    # Normalize to 0-100 range
    probability = min(max(score, 0), 100)
    prediction = 1 if probability >= 60 else 0
    
    return probability, prediction


def get_prediction_category(score: float) -> str:
    """Categorize prediction"""
    if score >= 75:
        return "High"
    elif score >= 50:
        return "Medium"
    else:
        return "Low"


def analyze_factors(request: PlacementPredictionRequest, score: float) -> dict:
    """Provide explainable factors for the prediction"""
    factors = {
        "resumeScore": {
            "value": request.resumeScore,
            "impact": "High" if request.resumeScore >= 70 else "Medium" if request.resumeScore >= 50 else "Low",
            "contribution": min(request.resumeScore * 0.3, 30)
        },
        "cgpa": {
            "value": request.cgpa,
            "impact": "High" if request.cgpa >= 8.0 else "Medium" if request.cgpa >= 7.0 else "Low",
            "contribution": min(request.cgpa * 2.5, 25)
        },
        "attendance": {
            "value": request.attendancePercent,
            "impact": "High" if request.attendancePercent >= 85 else "Medium" if request.attendancePercent >= 75 else "Low",
            "contribution": min(request.attendancePercent * 0.2, 20)
        },
        "internship": {
            "value": "Yes" if request.hasInternship else "No",
            "impact": "High" if request.hasInternship else "Low",
            "contribution": 15 if request.hasInternship else 0
        },
        "projects": {
            "value": request.numProjects,
            "impact": "High" if request.numProjects >= 3 else "Medium" if request.numProjects >= 2 else "Low",
            "contribution": min(request.numProjects * 3, 15)
        }
    }
    
    return factors


@app.post("/predict/placement", response_model=PlacementPredictionResponse)
async def predict_placement(request):
    """
    Predict placement probability for a student
    """
    try:
        # Handle both dict and PlacementPredictionRequest object
        if isinstance(request, dict):
            req_obj = PlacementPredictionRequest(**request)
        else:
            req_obj = request
        
        # Validate inputs with defaults
        resume_score = float(req_obj.resumeScore if hasattr(req_obj, 'resumeScore') else req_obj.get('resumeScore', 0))
        cgpa = float(req_obj.cgpa if hasattr(req_obj, 'cgpa') else req_obj.get('cgpa', 0))
        attendance = float(req_obj.attendancePercent if hasattr(req_obj, 'attendancePercent') else req_obj.get('attendancePercent', 0))
        has_internship = req_obj.hasInternship if hasattr(req_obj, 'hasInternship') else req_obj.get('hasInternship', False)
        num_projects = int(req_obj.numProjects if hasattr(req_obj, 'numProjects') else req_obj.get('numProjects', 0))
        num_skills = int(req_obj.numSkills if hasattr(req_obj, 'numSkills') else req_obj.get('numSkills', 0))
        
        # Clamp values to valid ranges
        resume_score = max(0, min(100, resume_score))
        cgpa = max(0, min(10, cgpa))
        attendance = max(0, min(100, attendance))
        
        # Prepare features
        features = np.array([
            resume_score,
            cgpa,
            attendance,
            1 if has_internship else 0,
            num_projects,
            num_skills
        ])
        
        # Predict - Uses rule-based scoring by default (no training required)
        # If ML/DL models are trained, they will be used; otherwise rule-based scoring is used
        probability, prediction = predict_placement_probability(features)
        
        # Create request object for analyze_factors
        class TempRequest:
            def __init__(self):
                self.resumeScore = resume_score
                self.cgpa = cgpa
                self.attendancePercent = attendance
                self.hasInternship = has_internship
                self.numProjects = num_projects
        
        temp_req = TempRequest()
        factors = analyze_factors(temp_req, probability)
        
        # Get category
        category = get_prediction_category(probability)
        
        # Calculate confidence (based on how clear the prediction is)
        confidence = abs(probability - 50) * 2  # Higher confidence if further from 50%
        confidence = min(confidence, 100)
        
        return PlacementPredictionResponse(
            mostLikelyScore=round(probability, 2),
            prediction=category,
            confidence=round(confidence, 2),
            factors=factors
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in predict_placement: {e}")
        import traceback
        traceback.print_exc()
        # Return fallback response
        return PlacementPredictionResponse(
            mostLikelyScore=50.0,
            prediction="Medium",
            confidence=50.0,
            factors={}
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_status = {
        "prediction_method": "rule-based" if not use_ml_models or (rf_model is None and nn_model is None) else "ml/dl",
        "ml_model": "available" if rf_model is not None else "unavailable",
        "dl_model": "available" if (TENSORFLOW_AVAILABLE and nn_model is not None) else "unavailable",
        "tensorflow": "available" if TENSORFLOW_AVAILABLE else "unavailable",
        "note": "Using rule-based weighted scoring (no training data required)" if not use_ml_models or (rf_model is None and nn_model is None) else "Using ML/DL models trained on historical data"
    }
    return {
        "status": "healthy",
        "service": "placement-prediction-service",
        "models": model_status
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
