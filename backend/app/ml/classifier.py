"""
Krishi Drishti - TFLite Leaf Disease Classifier (P13)
Loads the quantized MobileNetV2 TFLite model ONCE at startup (FastAPI lifespan),
protects inference with a threading lock for thread safety, and returns top-3 predictions.
"""

import os
import json
import time
import threading
from typing import List, Dict, Any, Tuple

# Ensure writable cache paths for sandboxed and restricted environments
os.environ.setdefault("KERAS_HOME", "/tmp/.keras")
os.environ.setdefault("MPLCONFIGDIR", "/tmp/.matplotlib")

from PIL import Image
import numpy as np
import tensorflow as tf

from app.core.config import settings
from app.core.logging import logger

_interpreter = None
_lock = threading.Lock()
_class_names: List[str] = []
_input_details = None
_output_details = None
_model_version = "v1.0-mobilenetv2-int8"


def load_classifier(
    model_path: str = settings.TFLITE_MODEL_PATH,
    class_names_path: str = settings.CLASS_NAMES_PATH
):
    """Initializes the TFLite interpreter and loads class names list."""
    global _interpreter, _class_names, _input_details, _output_details

    # Fallback to alternate artifact locations if needed
    if not os.path.exists(model_path):
        alt_paths = [
            "app/ml/artifacts/model.tflite",
            "backend/app/ml/artifacts/model.tflite",
            "ml-training/models/model.tflite"
        ]
        for p in alt_paths:
            if os.path.exists(p):
                model_path = p
                break

    if not os.path.exists(class_names_path):
        alt_names = [
            "app/ml/artifacts/class_names.json",
            "backend/app/ml/artifacts/class_names.json",
            "ml-training/data/class_names.json"
        ]
        for p in alt_names:
            if os.path.exists(p):
                class_names_path = p
                break

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"TFLite model not found at {model_path}")
    if not os.path.exists(class_names_path):
        raise FileNotFoundError(f"Class names JSON not found at {class_names_path}")

    logger.info(f"Loading TFLite model from {model_path}...")
    _interpreter = tf.lite.Interpreter(model_path=model_path)
    _interpreter.allocate_tensors()

    _input_details = _interpreter.get_input_details()
    _output_details = _interpreter.get_output_details()

    with open(class_names_path, "r", encoding="utf-8") as f:
        _class_names = json.load(f)

    logger.info(
        f"TFLite model loaded successfully! Classes: {len(_class_names)}, "
        f"Input shape: {_input_details[0]['shape']}, Dtype: {_input_details[0]['dtype']}"
    )


def get_model_info() -> Dict[str, Any]:
    """Returns metadata about the active ML model."""
    return {
        "model_architecture": "MobileNetV2 (Transfer Learning from ImageNet)",
        "model_version": _model_version,
        "input_resolution": [224, 224, 3],
        "num_classes": len(_class_names),
        "classes": _class_names,
        "low_confidence_threshold": settings.LOW_CONFIDENCE_THRESHOLD,
        "quantization": "INT8 Dynamic Range Quantization",
        "supported_crops": ["Tomato", "Potato"]
    }


def predict_disease(image: Image.Image) -> Tuple[str, float, List[Dict[str, Any]], float]:
    """
    Runs leaf disease inference on a PIL Image.
    Preprocesses to 224x224 RGB float32 (normalization is embedded in model).
    Thread-safe execution via Lock.
    Returns:
      (top_class_name, top_confidence, top3_predictions, inference_time_ms)
    """
    global _interpreter, _lock, _class_names, _input_details, _output_details

    if _interpreter is None or not _class_names:
        raise RuntimeError("Classifier not loaded. Call load_classifier() at startup.")

    t0 = time.perf_counter()

    # Preprocess: RGB conversion, resize to 224x224, expand batch dimension
    img = image.convert("RGB").resize((224, 224), Image.Resampling.BILINEAR)
    img_array = np.array(img, dtype=np.float32)
    input_tensor = np.expand_dims(img_array, axis=0)

    # Thread-safe interpreter invocation
    with _lock:
        _interpreter.set_tensor(_input_details[0]["index"], input_tensor)
        _interpreter.invoke()
        output_tensor = _interpreter.get_tensor(_output_details[0]["index"])[0]

    inference_ms = (time.perf_counter() - t0) * 1000

    # Top-3 predictions
    top_indices = np.argsort(output_tensor)[::-1][:3]
    top3: List[Dict[str, Any]] = [
        {
            "class_name": _class_names[idx],
            "confidence": round(float(output_tensor[idx]), 4)
        }
        for idx in top_indices
    ]

    top_class = top3[0]["class_name"]
    top_conf = top3[0]["confidence"]

    logger.info(
        f"Inference complete in {inference_ms:.2f}ms: Top={top_class} ({top_conf * 100:.2f}%)"
    )

    return top_class, top_conf, top3, inference_ms
