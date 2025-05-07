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
    img = np.expand_dims(img, axis=0)
    return img

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Save the file temporarily
    temp_path = os.path.join(os.path.dirname(__file__), "temp_image.png")
    file.save(temp_path)
    
    try:
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
        max_label = "Normal"
        
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
            
    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
    
    return jsonify(response)

# Add this endpoint to your main.py
@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Simple endpoint to verify API is running
    """
    return jsonify({
        "status": "ok",
        "model_loaded": True,
        "using_mock_model": USING_MOCK_MODEL
    })

# Fixed the typo in the if __name__ check
if __name__ == "__main__":
    app.run(debug=True)
