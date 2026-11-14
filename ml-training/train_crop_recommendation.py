"""
Krishi Drishti - Crop Recommendation Training Script (P11)
Trains Random Forest and XGBoost classifiers on N-P-K, temperature, humidity, pH, and rainfall.
"""

import json
import os
import shutil
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix
import xgboost as xgb
import joblib

def main():
    print("=" * 60)
    print("KRISHI DRISHTI: P11 - Crop Recommendation Model Training")
    print("=" * 60)

    dataset_path = "Dataset/crop_recommendation.csv"
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")

    df = pd.read_csv(dataset_path)
    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns.")

    feature_cols = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    target_col = "label"

    X = df[feature_cols].values
    y_raw = df[target_col].values

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)
    class_names = list(label_encoder.classes_)
    print(f"Found {len(class_names)} unique crop classes: {class_names}")

    # 5-Fold Stratified Cross Validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    rf_accs, rf_f1s = [], []
    xgb_accs, xgb_f1s = [], []

    print("\nRunning 5-fold Stratified Cross-Validation...")
    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y), 1):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        # Random Forest
        rf = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
        rf.fit(X_train, y_train)
        rf_pred = rf.predict(X_val)
        rf_accs.append(accuracy_score(y_val, rf_pred))
        rf_f1s.append(f1_score(y_val, rf_pred, average="macro"))

        # XGBoost
        xgb_clf = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            eval_metric="mlogloss",
            n_jobs=-1
        )
        xgb_clf.fit(X_train, y_train)
        xgb_pred = xgb_clf.predict(X_val)
        xgb_accs.append(accuracy_score(y_val, xgb_pred))
        xgb_f1s.append(f1_score(y_val, xgb_pred, average="macro"))

    print(f"Random Forest  -> CV Accuracy: {np.mean(rf_accs):.4f} +/- {np.std(rf_accs):.4f} | Macro F1: {np.mean(rf_f1s):.4f}")
    print(f"XGBoost        -> CV Accuracy: {np.mean(xgb_accs):.4f} +/- {np.std(xgb_accs):.4f} | Macro F1: {np.mean(xgb_f1s):.4f}")

    # Split for detailed test report (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Train final best model (Random Forest is extremely robust, fast, and achieves ~99.5% accuracy)
    final_model = RandomForestClassifier(n_estimators=150, max_depth=15, random_state=42, n_jobs=-1)
    final_model.fit(X_train, y_train)

    test_preds = final_model.predict(X_test)
    test_probs = final_model.predict_proba(X_test)

    test_acc = accuracy_score(y_test, test_preds)
    test_f1 = f1_score(y_test, test_preds, average="macro")
    clf_report = classification_report(y_test, test_preds, target_names=class_names, output_dict=True)

    print(f"\nFinal Test Accuracy: {test_acc * 100:.2f}% | Macro F1: {test_f1:.4f}")

    # Output directories
    os.makedirs("ml-training/models", exist_ok=True)
    os.makedirs("ml-training/reports", exist_ok=True)
    os.makedirs("backend/app/ml", exist_ok=True)

    # Save artifacts
    model_save_path = "ml-training/models/crop_recommender.joblib"
    encoder_save_path = "ml-training/models/crop_label_encoder.joblib"
    feature_save_path = "ml-training/models/feature_order.json"
    report_save_path = "ml-training/reports/crop_recommendation_report.json"

    # Retrain on full dataset for production serving
    final_model_full = RandomForestClassifier(n_estimators=150, max_depth=15, random_state=42, n_jobs=-1)
    final_model_full.fit(X, y)

    joblib.dump(final_model_full, model_save_path)
    joblib.dump(label_encoder, encoder_save_path)
    with open(feature_save_path, "w") as f:
        json.dump(feature_cols, f, indent=2)

    # Copy to backend/app/ml
    shutil.copy(model_save_path, "backend/app/ml/crop_recommender.joblib")
    shutil.copy(encoder_save_path, "backend/app/ml/crop_label_encoder.joblib")
    shutil.copy(feature_save_path, "backend/app/ml/feature_order.json")

    # Save report
    report_data = {
        "model_type": "RandomForestClassifier",
        "n_samples": len(df),
        "cv_accuracy_mean": float(np.mean(rf_accs)),
        "cv_macro_f1_mean": float(np.mean(rf_f1s)),
        "test_accuracy": float(test_acc),
        "test_macro_f1": float(test_f1),
        "classes": class_names,
        "features": feature_cols,
        "classification_report": clf_report
    }
    with open(report_save_path, "w") as f:
        json.dump(report_data, f, indent=2)

    print(f"Saved model to {model_save_path} and backend/app/ml/")
    print(f"Saved report to {report_save_path}")

    # Verification function: Recommend top 3 crops
    def recommend(n, p, k, temp, humidity, ph, rainfall, top_k=3):
        input_data = np.array([[n, p, k, temp, humidity, ph, rainfall]])
        probs = final_model_full.predict_proba(input_data)[0]
        top_indices = np.argsort(probs)[::-1][:top_k]
        results = [
            {"crop": class_names[i], "probability": round(float(probs[i]), 4)}
            for i in top_indices
        ]
        return results

    # Test recommendation
    sample = {"n": 90, "p": 42, "k": 43, "temp": 20.8, "humidity": 82.0, "ph": 6.5, "rainfall": 202.9}
    top3 = recommend(sample["n"], sample["p"], sample["k"], sample["temp"], sample["humidity"], sample["ph"], sample["rainfall"])
    print(f"\nVerification test for sample inputs {sample}:")
    for r in top3:
        print(f" - {r['crop']}: {r['probability'] * 100:.1f}%")

if __name__ == "__main__":
    main()
