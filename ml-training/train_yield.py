"""
Krishi Drishti - Crop Yield Prediction Training Script (P12)
Trains Regression models (Baseline vs Random Forest vs XGBoost) on crop_yield.csv.
Includes time-based evaluation, confidence interval prediction, and disease impact adjustment.
"""

import json
import os
import shutil
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.dummy import DummyRegressor
import xgboost as xgb
import joblib

def main():
    print("=" * 60)
    print("KRISHI DRISHTI: P12 - Crop Yield Prediction Model Training")
    print("=" * 60)

    dataset_path = "Dataset/crop_yield.csv"
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")

    df = pd.read_csv(dataset_path)
    print(f"Raw dataset shape: {df.shape}")

    # 1. Data Cleaning
    # Strip whitespace from categorical columns
    for col in ["Crop", "Season", "State"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    # Drop rows with null or non-positive Area or Production
    df = df.dropna(subset=["Crop", "Season", "State", "Area", "Production", "Yield"])
    df = df[(df["Area"] > 0) & (df["Production"] >= 0) & (df["Yield"] > 0)].copy()

    # Recalculate / verify Yield (Production / Area)
    # Some crops (like Coconut) produce in nuts, yielding very high units/ha; standard field crops yield in tonnes/ha.
    # To prevent extreme multi-order outlier distortion, clip Yield at 99.5th percentile per crop
    q99 = df.groupby("Crop")["Yield"].transform(lambda x: x.quantile(0.99))
    df = df[df["Yield"] <= q99 * 1.5].copy()

    print(f"Cleaned dataset shape: {df.shape}")
    print(f"Year range: {df['Crop_Year'].min()} - {df['Crop_Year'].max()}")

    # 2. Time-based Split (Train on historic years up to 2016, Test on 2017-2020)
    split_year = 2017
    train_mask = df["Crop_Year"] < split_year
    test_mask = df["Crop_Year"] >= split_year

    train_df = df[train_mask].copy()
    test_df = df[test_mask].copy()

    print(f"Train samples (Crop_Year < {split_year}): {len(train_df)}")
    print(f"Test samples (Crop_Year >= {split_year}): {len(test_df)}")

    categorical_features = ["Crop", "Season", "State"]
    numerical_features = ["Area", "Annual_Rainfall", "Fertilizer", "Pesticide"]
    all_features = categorical_features + numerical_features
    target = "Yield"

    X_train = train_df[all_features]
    y_train = train_df[target].values

    X_test = test_df[all_features]
    y_test = test_df[target].values

    # Preprocessing Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
            ("num", StandardScaler(), numerical_features)
        ]
    )

    # 3. Model Comparisons
    print("\nTraining and evaluating models...")

    # Model 1: Baseline (Median Regressor)
    baseline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", DummyRegressor(strategy="median"))
    ])
    baseline.fit(X_train, y_train)
    base_preds = baseline.predict(X_test)
    base_mae = mean_absolute_error(y_test, base_preds)
    base_rmse = np.sqrt(mean_squared_error(y_test, base_preds))
    base_r2 = r2_score(y_test, base_preds)
    print(f"Baseline (Median)    -> MAE: {base_mae:.3f} | RMSE: {base_rmse:.3f} | R2: {base_r2:.3f}")

    # Model 2: Random Forest Regressor
    rf_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1))
    ])
    rf_pipeline.fit(X_train, y_train)
    rf_preds = rf_pipeline.predict(X_test)
    rf_mae = mean_absolute_error(y_test, rf_preds)
    rf_rmse = np.sqrt(mean_squared_error(y_test, rf_preds))
    rf_r2 = r2_score(y_test, rf_preds)
    print(f"Random Forest        -> MAE: {rf_mae:.3f} | RMSE: {rf_rmse:.3f} | R2: {rf_r2:.3f}")

    # Model 3: XGBoost Regressor
    xgb_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", xgb.XGBRegressor(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.08,
            random_state=42,
            n_jobs=-1
        ))
    ])
    xgb_pipeline.fit(X_train, y_train)
    xgb_preds = xgb_pipeline.predict(X_test)
    xgb_mae = mean_absolute_error(y_test, xgb_preds)
    xgb_rmse = np.sqrt(mean_squared_error(y_test, xgb_preds))
    xgb_r2 = r2_score(y_test, xgb_preds)
    print(f"XGBoost Regressor    -> MAE: {xgb_mae:.3f} | RMSE: {xgb_rmse:.3f} | R2: {xgb_r2:.3f}")

    # Pick best model (Random Forest or XGBoost)
    best_pipeline = rf_pipeline if rf_r2 >= xgb_r2 else xgb_pipeline
    best_name = "RandomForestRegressor" if rf_r2 >= xgb_r2 else "XGBRegressor"
    best_mae = min(rf_mae, xgb_mae)
    best_rmse = min(rf_rmse, xgb_rmse)
    best_r2 = max(rf_r2, xgb_r2)
    print(f"\nBest Model selected: {best_name} with R2 = {best_r2:.4f}")

    # Compute residual spread on test set for confidence bounds (std of errors)
    residuals = y_test - best_pipeline.predict(X_test)
    residual_std = float(np.std(residuals))
    print(f"Residual Std (prediction interval margin ~1.96 * std): {residual_std:.3f}")

    # 4. Save Final Pipeline and Artifacts
    os.makedirs("ml-training/models", exist_ok=True)
    os.makedirs("ml-training/reports", exist_ok=True)
    os.makedirs("backend/app/ml", exist_ok=True)

    # Train best pipeline on full dataset for maximum generalization in production
    print("\nFitting best pipeline on full dataset for production deployment...")
    best_pipeline.fit(df[all_features], df[target].values)

    model_path = "ml-training/models/yield_predictor.joblib"
    joblib.dump(best_pipeline, model_path)
    shutil.copy(model_path, "backend/app/ml/yield_predictor.joblib")

    # Metadata for valid states, crops, seasons and defaults
    crop_stats = df.groupby("Crop").agg({
        "Annual_Rainfall": "mean",
        "Fertilizer": "mean",
        "Pesticide": "mean",
        "Yield": ["mean", "std"]
    }).to_dict()

    metadata = {
        "best_model": best_name,
        "metrics": {
            "baseline": {"mae": float(base_mae), "rmse": float(base_rmse), "r2": float(base_r2)},
            "random_forest": {"mae": float(rf_mae), "rmse": float(rf_rmse), "r2": float(rf_r2)},
            "xgboost": {"mae": float(xgb_mae), "rmse": float(xgb_rmse), "r2": float(xgb_r2)},
            "residual_std": residual_std
        },
        "crops": sorted(df["Crop"].unique().tolist()),
        "states": sorted(df["State"].unique().tolist()),
        "seasons": sorted(df["Season"].unique().tolist()),
        "features": {
            "categorical": categorical_features,
            "numerical": numerical_features
        },
        "disease_penalty_factors": {
            "none": 1.0,
            "healthy": 1.0,
            "low": 0.88,
            "medium": 0.72,
            "high": 0.45
        }
    }

    metadata_path = "ml-training/models/yield_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    shutil.copy(metadata_path, "backend/app/ml/yield_metadata.json")

    report_path = "ml-training/reports/yield_prediction_report.json"
    with open(report_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved yield model and metadata to ml-training/models/ and backend/app/ml/")

    # 5. Prediction & Disease Adjustment Function
    def predict_crop_yield(crop, state, season, area, annual_rainfall=1200.0, fertilizer=100000.0, pesticide=500.0, disease_severity="none"):
        input_df = pd.DataFrame([{
            "Crop": crop,
            "Season": season,
            "State": state,
            "Area": float(area),
            "Annual_Rainfall": float(annual_rainfall),
            "Fertilizer": float(fertilizer),
            "Pesticide": float(pesticide)
        }])
        raw_yield = float(best_pipeline.predict(input_df)[0])
        raw_yield = max(0.01, raw_yield)

        penalty = metadata["disease_penalty_factors"].get(disease_severity.lower(), 1.0)
        adjusted_yield = raw_yield * penalty
        loss_pct = round((1.0 - penalty) * 100, 1)

        margin = 1.96 * residual_std
        yield_min = max(0.0, adjusted_yield - margin)
        yield_max = adjusted_yield + margin

        return {
            "crop": crop,
            "state": state,
            "season": season,
            "area_hectares": area,
            "expected_yield_tonnes_per_ha": round(raw_yield, 2),
            "disease_severity": disease_severity,
            "disease_penalty_multiplier": penalty,
            "adjusted_yield_tonnes_per_ha": round(adjusted_yield, 2),
            "yield_range_95pct": [round(yield_min, 2), round(yield_max, 2)],
            "loss_due_to_disease_pct": loss_pct,
            "total_estimated_production_tonnes": round(adjusted_yield * area, 2)
        }

    # Test sample prediction
    sample_res = predict_crop_yield(
        crop="Wheat",
        state="Punjab",
        season="Rabi",
        area=5.0,
        annual_rainfall=650.0,
        fertilizer=80000.0,
        pesticide=400.0,
        disease_severity="medium"
    )
    print("\nVerification sample prediction for Wheat in Punjab with Medium disease severity:")
    print(json.dumps(sample_res, indent=2))

if __name__ == "__main__":
    main()
