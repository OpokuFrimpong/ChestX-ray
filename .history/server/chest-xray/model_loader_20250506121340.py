import tensorflow as tf
from tensorflow.keras.models import load_model

def load_compatible_model(model_path):
    """
    Load a Keras model with custom object handling for compatibility
    """
    try:
        # Add any custom objects your model might need here
        custom_objects = {
            # Example: 'CustomLayer': CustomLayer
        }
        
        # Load the model with custom objects if needed
        model = load_model(model_path, custom_objects=custom_objects)
        
        # Verify the model works by making a test prediction
        input_shape = model.input_shape[1:]  # Get expected input shape
        test_input = tf.zeros((1,) + input_shape)  # Create dummy input
        _ = model(test_input)  # Test prediction
        
        return model
        
    except Exception as e:
        raise Exception(f"Failed to load model: {str(e)}")