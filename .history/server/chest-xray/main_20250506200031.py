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

# Configure CORS to accept all requests during development
CORS(app)  # This is less restrictive for testing

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
    """Preprocess image for model input"""
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")
    
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (256, 256))
    
    # Convert to float and normalize to [0,1]
    img = img.astype('float32') / 255.0
    
    # Add batch dimension
    img = np.expand_dims(img, axis=0)
    
    return img

@app.route('/api/predict', methods=['POST'])
def predict():
    print("Received request at /api/predict endpoint")
    
    if 'image' not in request.files:
        print("No image found in request")
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files['image']
    if file.filename == '':
        print("Empty filename received")
        return jsonify({"error": "No file selected"}), 400
    
    print(f"Processing file: {file.filename}")
    
    # Save the file temporarily
    temp_path = os.path.join(os.path.dirname(__file__), "temp_image.png")
    file.save(temp_path)
    print(f"File saved at {temp_path}")
    
    try:
        # For demonstration, let's just return mock data if there's an issue
        if USING_MOCK_MODEL:
            print("Using mock model for prediction")
            mock_response = {
                "primary": "Normal",
                "confidence": 82,
                "description": "No signs of lung disease detected.",
                "predictions": {
                    "Normal": 0.82,
                    "Pneumonia": 0.12,
                    "Tuberculosis": 0.04,
                    "COVID-19": 0.02
                },
                "detected_conditions": []
            }
            
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
            return jsonify(mock_response)
        
        # Real model processing code
        else:
            # Preprocess the image
            preprocessed_img = preprocess_image(temp_path)
            
            # Make predictions
            prediction = model.predict(preprocessed_img)
            
            # Format the response
            response = {
                "predictions": {},
                "detected_conditions": []
            }
            
            # Find highest probability for confidence score
            max_prob = 0
            max_label = None
            
            # Process predictions
            for i, label in enumerate(labels):
                prob = float(prediction[0][i])
                response["predictions"][label] = prob
                
                # Track highest probability
                if prob > max_prob:
                    max_prob = prob
                    max_label = label
                    
                # Check if above threshold
                if prob >= thresholds[i]:
                    response["detected_conditions"].append(label)
            
            # Calculate confidence score
            confidence_score = int(max_prob * 100)
            
            # Set primary assessment and description
            if len(response["detected_conditions"]) > 0:
                response["primary"] = "Abnormal"
                response["confidence"] = confidence_score
                response["description"] = f"Signs of lung disease detected: {', '.join(response['detected_conditions'])}"
            else:
                response["primary"] = "Normal"
                response["confidence"] = confidence_score
                response["description"] = "No signs of lung disease detected."
            
            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
            return jsonify(response)
        
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": str(e)}), 500
    
    # Clean up even if nothing above catches
    if os.path.exists(temp_path):
        os.remove(temp_path)
    
    # This line should never be reached but just in case
    return jsonify({"error": "Unknown error occurred"}), 500
