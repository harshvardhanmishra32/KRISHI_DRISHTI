"""
Krishi Drishti - P09: Evaluate Disease Classifier Honestly
Evaluates best.keras on the held-out test split (never seen in training or validation).
Computes:
- Overall Accuracy, Macro F1
- Per-class Precision, Recall, F1
- Confusion Matrix
- Confidence Calibration Buckets (<0.5, 0.5-0.7, 0.7-0.9, >0.9)
- Recommended low-confidence threshold
- Saves metrics.json
"""

import os
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

def main():
    print("=" * 60)
    print("KRISHI DRISHTI: P09 - Model Evaluation on Held-Out Test Set")
    print("=" * 60)

    model_path = "ml-training/models/best.keras"
    split_path = "ml-training/data/split.csv"
    class_names_path = "ml-training/data/class_names.json"

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}")

    with open(class_names_path, "r") as f:
        class_names = json.load(f)
    class_to_idx = {name: idx for idx, name in enumerate(class_names)}

    df = pd.read_csv(split_path)
    test_df = df[df["split"] == "test"].copy()
    print(f"Loaded {len(test_df)} held-out test samples across {len(class_names)} classes.")

    print(f"Loading model from {model_path}...")
    model = tf.keras.models.load_model(model_path)

    # Batch test prediction pipeline
    def parse_test_image(path, label):
        img_raw = tf.io.read_file(path)
        img = tf.io.decode_jpeg(img_raw, channels=3)
        img = tf.image.resize(img, (224, 224))
        return img, label

    test_paths = test_df["path"].values
    y_true = np.array([class_to_idx[l] for l in test_df["label"].values])

    test_ds = tf.data.Dataset.from_tensor_slices((test_paths, y_true))
    test_ds = test_ds.map(parse_test_image, num_parallel_calls=tf.data.AUTOTUNE)
    test_ds = test_ds.batch(64).prefetch(tf.data.AUTOTUNE)

    print("Running inference on test dataset...")
    y_probs = model.predict(test_ds, verbose=1)
    y_pred = np.argmax(y_probs, axis=1)
    confidences = np.max(y_probs, axis=1)

    # Metrics
    test_acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro")
    clf_dict = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
    cm = confusion_matrix(y_true, y_pred)

    print(f"\n================ TEST SET RESULTS ================")
    print(f"Test Accuracy: {test_acc * 100:.2f}%")
    print(f"Macro F1:      {macro_f1:.4f}")
    print("==================================================")

    # Confidence Calibration Buckets
    buckets = {
        "<0.50": {"correct": 0, "total": 0},
        "0.50-0.70": {"correct": 0, "total": 0},
        "0.70-0.90": {"correct": 0, "total": 0},
        ">0.90": {"correct": 0, "total": 0}
    }

    for true_lbl, pred_lbl, conf in zip(y_true, y_pred, confidences):
        is_corr = int(true_lbl == pred_lbl)
        if conf < 0.50:
            b = "<0.50"
        elif conf < 0.70:
            b = "0.50-0.70"
        elif conf < 0.90:
            b = "0.70-0.90"
        else:
            b = ">0.90"
        buckets[b]["total"] += 1
        buckets[b]["correct"] += is_corr

    calibration_table = {}
    print("\nConfidence Calibration Table:")
    print(f"  {'Confidence Bucket':<20} | {'Total':<8} | {'Correct':<8} | {'Accuracy':<10}")
    print("  " + "-" * 55)
    for b_name, data in buckets.items():
        acc = (data["correct"] / data["total"]) if data["total"] > 0 else 0.0
        calibration_table[b_name] = {
            "total": data["total"],
            "correct": data["correct"],
            "accuracy": round(acc, 4)
        }
        print(f"  {b_name:<20} | {data['total']:<8} | {data['correct']:<8} | {acc * 100:.2f}%")

    # Recommended low-confidence threshold: 0.70
    recommended_threshold = 0.70
    print(f"\nRecommended low_confidence threshold: {recommended_threshold}")
    print(f"Predictions with confidence below {recommended_threshold} will be flagged for human agronomist review.")

    # Top confused pairs
    confused_pairs = []
    for i in range(len(class_names)):
        for j in range(len(class_names)):
            if i != j and cm[i][j] > 0:
                confused_pairs.append({
                    "true_class": class_names[i],
                    "predicted_class": class_names[j],
                    "count": int(cm[i][j])
                })
    confused_pairs = sorted(confused_pairs, key=lambda x: x["count"], reverse=True)[:5]
    print("\nTop Confused Class Pairs:")
    for pair in confused_pairs:
        print(f"  True: {pair['true_class']:<30} -> Pred: {pair['predicted_class']:<30} ({pair['count']} errors)")

    # Save metrics.json
    metrics = {
        "model_file": model_path,
        "test_samples": len(test_df),
        "test_accuracy": float(test_acc),
        "macro_f1": float(macro_f1),
        "classification_report": clf_dict,
        "confusion_matrix": cm.tolist(),
        "top_confused_pairs": confused_pairs,
        "confidence_calibration": calibration_table,
        "recommended_low_confidence_threshold": recommended_threshold
    }

    metrics_save_path = "ml-training/models/metrics.json"
    with open(metrics_save_path, "w") as f:
        json.dump(metrics, f, indent=2)
    with open("backend/app/ml/metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nSaved metrics to {metrics_save_path} and backend/app/ml/metrics.json")

if __name__ == "__main__":
    main()
