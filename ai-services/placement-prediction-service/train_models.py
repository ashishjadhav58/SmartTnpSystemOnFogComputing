"""
Training Script for Placement Prediction Models
Run this script once to train and save ML/DL models for faster predictions.

Usage:
    python train_models.py

This will:
1. Load training data (from CSV, JSON, or generate synthetic data)
2. Train Random Forest (ML) model
3. Train Neural Network (DL) model if TensorFlow is available
4. Save models to disk for fast loading during service startup
"""

import numpy as np
import pandas as pd
import os
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

# Try to import TensorFlow/Keras for Deep Learning model
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TENSORFLOW_AVAILABLE = True
    print("[OK] TensorFlow/Keras available for Deep Learning models")
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("[WARN] TensorFlow not available - will only train ML model")

# Model save paths
MODELS_DIR = "models"
RF_MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model.joblib")
NN_MODEL_PATH = os.path.join(MODELS_DIR, "neural_network_model.h5")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.joblib")

def load_training_data():
    """
    Load training data from file or generate synthetic data for demonstration.
    
    In production, replace this with your actual historical placement data.
    Expected format:
    - CSV/JSON with columns: resumeScore, cgpa, attendancePercent, hasInternship, numProjects, numSkills, placed
    - placed: 1 = placed, 0 = not placed
    """
    # Option 1: Load from CSV file
    if os.path.exists("training_data.csv"):
        print("[INFO] Loading training data from training_data.csv")
        df = pd.read_csv("training_data.csv")
        features = df[['resumeScore', 'cgpa', 'attendancePercent', 'hasInternship', 'numProjects', 'numSkills']].values
        labels = df['placed'].values
        return features, labels
    
    # Option 2: Load from JSON file
    if os.path.exists("training_data.json"):
        print("[INFO] Loading training data from training_data.json")
        import json
        with open("training_data.json", 'r') as f:
            data = json.load(f)
        features = np.array([[d['resumeScore'], d['cgpa'], d['attendancePercent'], 
                            1 if d['hasInternship'] else 0, d['numProjects'], d['numSkills']] 
                            for d in data])
        labels = np.array([d['placed'] for d in data])
        return features, labels
    
    # Option 3: Generate synthetic training data for demonstration
    # In production, replace this with real historical data
    print("[WARN] No training data file found. Generating synthetic data for demonstration.")
    print("[INFO] In production, replace this with real historical placement data.")
    
    np.random.seed(42)
    n_samples = 200  # Generate 200 synthetic samples
    
    # Generate features
    features = np.array([
        np.random.uniform(40, 100, n_samples),  # resumeScore
        np.random.uniform(6.0, 10.0, n_samples),  # cgpa
        np.random.uniform(60, 100, n_samples),  # attendancePercent
        np.random.choice([0, 1], n_samples),  # hasInternship
        np.random.randint(0, 5, n_samples),  # numProjects
        np.random.randint(3, 15, n_samples)  # numSkills
    ]).T
    
    # Generate labels based on weighted scoring (simulating real placement outcomes)
    scores = (
        features[:, 0] * 0.30 +  # resumeScore
        features[:, 1] * 10 * 0.25 +  # cgpa
        features[:, 2] * 0.20 +  # attendance
        features[:, 3] * 15 +  # internship
        np.minimum(features[:, 4] * 3, 15) +  # projects
        np.minimum(features[:, 5] * 2, 10)  # skills
    )
    
    # Add some randomness to make it more realistic
    scores += np.random.normal(0, 10, n_samples)
    labels = (scores >= 60).astype(int)  # Placed if score >= 60
    
    return features, labels


def train_random_forest(features, labels, scaler):
    """Train Random Forest model and save it"""
    print("\n[INFO] Training Random Forest (ML) model...")
    
    # Scale features
    X_scaled = scaler.fit_transform(features)
    
    # Train model
    rf_model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        max_depth=10,
        n_jobs=-1  # Use all CPU cores
    )
    
    rf_model.fit(X_scaled, labels)
    
    # Evaluate
    train_score = rf_model.score(X_scaled, labels)
    print(f"[OK] Random Forest model trained successfully")
    print(f"[INFO] Training accuracy: {train_score:.4f}")
    
    # Save model
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(rf_model, RF_MODEL_PATH)
    print(f"[OK] Model saved to {RF_MODEL_PATH}")
    
    return rf_model


def train_neural_network(features, labels, scaler):
    """Train Neural Network (DL) model and save it"""
    if not TENSORFLOW_AVAILABLE:
        print("[WARN] TensorFlow not available - skipping Neural Network training")
        return None
    
    if len(features) < 20:
        print("[WARN] Training dataset too small for Neural Network (< 20 samples). Skipping.")
        return None
    
    print("\n[INFO] Training Neural Network (DL) model...")
    
    # Scale features
    X_scaled = scaler.transform(features)  # Use already-fitted scaler
    y_nn = labels.astype(np.float32)
    
    # Build neural network
    nn_model = keras.Sequential([
        layers.Dense(64, activation='relu', input_shape=(6,)),
        layers.Dropout(0.3),
        layers.Dense(32, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(16, activation='relu'),
        layers.Dense(1, activation='sigmoid')  # Binary classification
    ])
    
    # Compile
    nn_model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    
    # Train with early stopping
    early_stopping = keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True
    )
    
    validation_split = 0.2 if len(features) > 20 else 0.0
    batch_size = min(8, len(features) // 4)
    
    history = nn_model.fit(
        X_scaled, y_nn,
        epochs=100,
        batch_size=batch_size,
        verbose=1,
        validation_split=validation_split,
        callbacks=[early_stopping] if validation_split > 0 else []
    )
    
    # Evaluate
    final_accuracy = history.history['accuracy'][-1]
    print(f"[OK] Neural Network model trained successfully")
    print(f"[INFO] Final training accuracy: {final_accuracy:.4f}")
    
    # Save model
    os.makedirs(MODELS_DIR, exist_ok=True)
    nn_model.save(NN_MODEL_PATH)
    print(f"[OK] Model saved to {NN_MODEL_PATH}")
    
    return nn_model


def main():
    """Main training function"""
    print("=" * 60)
    print("Placement Prediction Model Training Script")
    print("=" * 60)
    
    # Load training data
    print("\n[STEP 1] Loading training data...")
    features, labels = load_training_data()
    print(f"[OK] Loaded {len(features)} training samples")
    print(f"[INFO] Features shape: {features.shape}")
    print(f"[INFO] Labels distribution: {np.bincount(labels)} (0=not placed, 1=placed)")
    
    if len(features) < 10:
        print("[ERROR] Training dataset too small (< 10 samples). Need at least 10 samples.")
        return
    
    # Initialize scaler
    scaler = StandardScaler()
    
    # Train Random Forest model
    print("\n[STEP 2] Training Random Forest (ML) model...")
    rf_model = train_random_forest(features, labels, scaler)
    
    # Save scaler (needed for predictions)
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(scaler, SCALER_PATH)
    print(f"[OK] Scaler saved to {SCALER_PATH}")
    
    # Train Neural Network model (optional)
    if TENSORFLOW_AVAILABLE and len(features) >= 20:
        print("\n[STEP 3] Training Neural Network (DL) model...")
        nn_model = train_neural_network(features, labels, scaler)
    else:
        print("\n[STEP 3] Skipping Neural Network training")
        if not TENSORFLOW_AVAILABLE:
            print("[INFO] Reason: TensorFlow not available")
        else:
            print("[INFO] Reason: Training dataset too small (< 20 samples)")
    
    print("\n" + "=" * 60)
    print("Training completed successfully!")
    print("=" * 60)
    print("\n[INFO] Models saved to:")
    print(f"  - Random Forest: {RF_MODEL_PATH}")
    if TENSORFLOW_AVAILABLE and len(features) >= 20:
        print(f"  - Neural Network: {NN_MODEL_PATH}")
    print(f"  - Scaler: {SCALER_PATH}")
    print("\n[INFO] The placement prediction service will automatically load these models on startup.")
    print("[INFO] This will significantly improve prediction speed!")


if __name__ == "__main__":
    main()
