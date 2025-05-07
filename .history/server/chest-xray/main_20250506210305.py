import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.densenet import DenseNet121
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
import cv2

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Labels for the pathologies
labels = [
    'Cardiomegaly', 'Emphysema', 'Effusion', 'Hernia', 'Infiltration', 
    'Mass', 'Nodule', 'Atelectasis', 'Pneumothorax', 'Pleural_Thickening', 
    'Pneumonia', 'Fibrosis', 'Edema', 'Consolidation'
]

# These are the optimal thresholds - replace if you have different values
thresholds = [
    0.912609, 0.5, 0.05536364, 0.05458658, 0.05614194,
    0.0711029,  0.09037294, 0.06575287, 0.06672161, 0.05656851,
    0.05656851, 0.04054752, 0.0392803,  0.05642475
]

IMAGE_SIZE = [256, 256]  # Match the size used in training

print("Creating model...")
# Create the model from scratch
base_model = DenseNet121(weights=None, include_top=False)
x = base_model.output
x = GlobalAveragePooling2D()(x)
predictions = Dense(len(labels), activation="sigmoid")(x)
model = Model(inputs=base_model.input, outputs=predictions)

# Try to load weights if available
weights_path = os.path.join(os.path.dirname(__file__), "my_model.h5")
if os.path.exists(weights_path):
    try:
        print("Loading weights...")
        model.load_weights(weights_path, by_name=True, skip_mismatch=True)
        print("Weights loaded successfully!")
    except Exception as e:
        print(f"Error loading weights: {str(e)}")
        print("Using model without pre-trained weights")
else:
    print(f"Weights file not found at {weights_path}")
    print("Using model without pre-trained weights")

def preprocess_single_image(image_path):
    """
    Preprocess a single image for prediction
    """
    # Load the image
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (IMAGE_SIZE[0], IMAGE_SIZE[1]))
    
    # Convert to float and normalize to [0,1]
    img = img.astype('float32') / 255.0
    
    # Apply same normalization as during training (samplewise normalization)
    mean = np.mean(img)
    std = np.std(img)
    img = (img - mean) / (std + 1e-7)
    
    # Add batch dimension
    img = np.expand_dims(img, axis=0)
    
    return img

def api_predict(image_path):
    """
    API-style prediction function
    Returns a JSON-serializable dictionary with prediction results
    """
    # Preprocess and get predictions
    img = preprocess_single_image(image_path)
    prediction = model.predict(img)
    
    # Apply thresholds
    binary_predictions = (prediction[0] >= np.array(thresholds)).astype(int)
    
    # Prepare the response
    response = {
        "predictions": {},
        "detected_conditions": []
    }
    
    # Fill in the predictions
    for i, label in enumerate(labels):
        prob = float(prediction[0][i])  # Convert to Python float for JSON serialization
        response["predictions"][label] = prob
        
        if binary_predictions[i] == 1:
            response["detected_conditions"].append(label)
    
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    # Check if image was uploaded
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    # Get the image file
    file = request.files['image']
    
    # Save the image temporarily
    temp_path = os.path.join(os.path.dirname(__file__), "temp_image.png")
    file.save(temp_path)
    
    try:
        # Get predictions
        results = api_predict(temp_path)
        
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify(results)
    
    except Exception as e:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Create templates folder if it doesn't exist
    templates_dir = os.path.join(os.path.dirname(__file__), "templates")
    if not os.path.exists(templates_dir):
        os.makedirs(templates_dir)
    
    # Create a simple index.html if it doesn't exist
    index_path = os.path.join(templates_dir, "index.html")
    if not os.path.exists(index_path):
        with open(index_path, "w") as f:
            f.write("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Chest X-Ray Analysis API</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0;
                        padding: 20px;
                        line-height: 1.6;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: #f9f9f9;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    h1 { color: #333; }
                    .upload-form {
                        margin: 20px 0;
                        padding: 15px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                    }
                    .result {
                        margin-top: 20px;
                        padding: 15px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        background: white;
                    }
                    .detected {
                        background-color: #e8f5e9;
                        font-weight: bold;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        padding: 8px;
                        border: 1px solid #ddd;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Chest X-Ray Analysis</h1>
                    <p>This API analyzes chest X-ray images for 14 different medical conditions.</p>
                    
                    <div class="upload-form">
                        <h3>Test the API</h3>
                        <form id="uploadForm" enctype="multipart/form-data">
                            <input type="file" id="imageInput" accept="image/*">
                            <button type="button" onclick="analyzeImage()">Analyze X-ray</button>
                        </form>
                    </div>
                    
                    <div id="result" class="result">
                        <p>Upload an X-ray image to see results</p>
                    </div>
                </div>

                <script>
                function analyzeImage() {
                    const fileInput = document.getElementById('imageInput');
                    const resultDiv = document.getElementById('result');
                    
                    if (!fileInput.files[0]) {
                        alert('Please select an image file');
                        return;
                    }
                    
                    // Display loading indicator
                    resultDiv.innerHTML = '<p>Analyzing X-ray image...</p>';
                    
                    const formData = new FormData();
                    formData.append('image', fileInput.files[0]);
                    
                    fetch('/api/predict', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Display results
                        let html = '<h3>X-ray Analysis Results:</h3>';
                        
                        // Show detected conditions
                        if (data.detected_conditions.length > 0) {
                            html += '<h4>Detected Conditions:</h4>';
                            html += '<ul>';
                            data.detected_conditions.forEach(condition => {
                                html += `<li>${condition}</li>`;
                            });
                            html += '</ul>';
                        } else {
                            html += '<p>No conditions detected.</p>';
                        }
                        
                        // Show all probabilities
                        html += '<h4>Probability Scores:</h4>';
                        html += '<table>';
                        html += '<tr><th>Condition</th><th>Probability</th></tr>';
                        
                        // Sort by probability
                        const sortedPredictions = Object.entries(data.predictions)
                            .sort((a, b) => b[1] - a[1]);
                        
                        sortedPredictions.forEach(([condition, probability]) => {
                            const isDetected = data.detected_conditions.includes(condition);
                            const rowClass = isDetected ? 'class="detected"' : '';
                            html += `<tr ${rowClass}>
                                <td>${condition}</td>
                                <td>${(probability * 100).toFixed(2)}%</td>
                            </tr>`;
                        });
                        
                        html += '</table>';
                        
                        resultDiv.innerHTML = html;
                    })
                    .catch(error => {
                        resultDiv.innerHTML = `<p style="color: red">Error: ${error.message}</p>`;
                    });
                }
                </script>
            </body>
            </html>
            """)
    
    # Start the API server
    app.run(host='0.0.0.0', port=5000, debug=True)