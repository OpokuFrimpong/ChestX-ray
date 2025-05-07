from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from utils import preprocess_image
from tensorflow.keras.models import load_model
import uvicorn
from typing import List
import io

app = FastAPI()

# Load model
model = load_model("C:/Users/nadon/Backend/chest-xray/c:\Users\nadon\Downloads\my_model.h5.h5")

# Define class labels
labels = [
    'Atelectasis', 'Cardiomegaly', 'Effusion', 'Infiltration', 
    'Mass', 'Nodule', 'Pneumonia', 'Pneumothorax', 'Consolidation', 
    'Edema', 'Emphysema', 'Fibrosis', 'Pleural_Thickening', 'Hernia', 'No Finding'
]

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Read and preprocess
        contents = await file.read()
        img = io.BytesIO(contents)
        preprocessed = preprocess_image(img)

        # Run model
        preds = model.predict(preprocessed)[0]

        # Format output
        response = {label: float(pred) for label, pred in zip(labels, preds)}
        return JSONResponse(content=response)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# Run with: uvicorn main:app --reload
