import tensorflow as tf
from tensorflow.keras.models import load_model
import os
import h5py

def load_compatible_model(model_path):
    """
    Load a Keras model with custom handling for incompatible naming conventions
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")
    
    try:
        # First try: Standard loading
        model = load_model(model_path, compile=False)
        return model
    except Exception as e1:
        print(f"Standard loading failed: {e1}")
        
        try:
            # Second try: Skip mismatch
            model = load_model(model_path, compile=False, skip_mismatch=True)
            return model
        except Exception as e2:
            print(f"Loading with skip_mismatch failed: {e2}")
            
            try:
                # Third try: custom objects
                custom_objects = {}
                model = load_model(model_path, custom_objects=custom_objects, compile=False)
                return model
            except Exception as e3:
                print(f"Loading with custom objects failed: {e3}")
                
                # If all methods fail, raise the original error
                raise ValueError(f"Failed to load model: {e1}")