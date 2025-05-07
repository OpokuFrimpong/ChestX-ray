# This is example code for your Flask API

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import os
from tensorflow.keras.models import load_model
from model_loader import load_compatible_model  # Import our custom loader

USING_MOCK_MODEL = False

app = Flask(__name__)

# Configure CORS to accept requests from your React app
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Fixed model path to match what you have in utils.py
MODEL_PATH = os.path.join(os.path.dirname(__file__), "my_model.h5")

# Try to load the model
try:
    print("Loading model...")
    model = load_compatible_model(MODEL_PATH)
    print("Model loaded successfully!")
    
    # Check if we got a mock model
    if hasattr(model, 'is_mock') and model.is_mock:
        USING_MOCK_MODEL = True
        print("WARNING: Using mock model for testing")
except Exception as e:
    print(f"Error loading model: {e}")
    
    # Create a basic mock model if loading fails
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Dense, Conv2D, Flatten, Input
    
    # Create a simple model that matches your expected input/output
    model = Sequential([
        Input(shape=(256, 256, 3)),  # Input image size
        Conv2D(32, (3, 3), activation='relu'),
        Conv2D(64, (3, 3), activation='relu'),
        Flatten(),
        Dense(14, activation='sigmoid')  # 14 outputs for your 14 conditions
    ])
    model.is_mock = True
    USING_MOCK_MODEL = True
    print("WARNING: Using mock model for testing purposes!")

# Define labels and thresholds
labels = ["Cardiomegaly", "Emphysema", "Effusion", "Hernia", "Infiltration", 
          "Mass", "Nodule", "Atelectasis", "Pneumothorax", "Pleural_Thickening", 
          "Pneumonia", "Fibrosis", "Edema", "Consolidation"]

thresholds = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]  # Replace with your optimal thresholds

def preprocess_image(image_path):
    img = cv
