# This is example code for your Flask API

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import os
from tensorflow.keras.models import load_model
from model_loader import load_compatible_model  # Import our custom loader

app = Flask(__name__)

# Configure CORS to accept requests from your React app
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Fixed model path to match what you have in utils.py
MODEL_PATH = os.path.join(os.path.dirname(__file__), "my_model.h5")

# Load the model using our custom loader
print("Loading model...")
try:
    model = load_compatible_model(MODEL_PATH)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    exit(1)

# Define labels and thresholds
labels = ["Cardiomegaly", "Emphysema", "Effusion", "Hernia", "Infiltration", 
          "Mass", "Nodule", "Atelectasis", "Pneumothorax", "Pleural_Thickening", 
          "Pneumonia", "Fibrosis", "Edema", "Consolidation"]

thresholds = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]  # Replace with your optimal thresholds

def preprocess_image(image_path):
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (256, 256))  # Your models input size
    
    img = img.astype("float32") / 255.0
    mean = np.mean(img)
    std = np.std(img)
    img = (img - mean) / (std + 1e-7)
    
    img = np.expand_dims(img, axis=0)
    return img

@app.route("/api/predict", methods=["POST"])
def predict():
    # Check if image was uploaded
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files["image"]
    
    # Save the image temporarily
    temp_path = os.path.join(os.path.dirname(__file__), "temp_image.png")
    file.save(temp_path)
    
    try:
        # Preprocess the image
        img = preprocess_image(temp_path)
        
        # Make prediction
        prediction = model.predict(img)
        
        # Apply thresholds
        binary_predictions = (prediction[0] >= np.array(thresholds)).astype(int)
        
        # Prepare response
        response = {
            "predictions": {},
            "detected_conditions": []
        }
        
        for i, label in enumerate(labels):
            prob = float(prediction[0][i])
            response["predictions"][label] = prob
            
            if binary_predictions[i] == 1:
                response["detected_conditions"].append(label)
        
        # Delete the temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return jsonify(response)
        
    except Exception as e:
        # Make sure to delete the temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": str(e)}), 500

# Fixed the typo in the if __name__ check
if __name__ == "__main__":
    app.run(debug=True)
