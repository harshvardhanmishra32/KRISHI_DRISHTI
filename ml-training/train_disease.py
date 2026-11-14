"""
Krishi Drishti - P08: Two-Stage Transfer Learning with MobileNetV2
Trains a 13-class Tomato & Potato Leaf Disease Classifier using TensorFlow / Keras.
Features:
- MobileNetV2 pretrained on ImageNet
- Preprocessing inside the model (Rescaling to [-1, 1])
- tf.data pipeline with caching and prefetching
- Stage 1: Frozen base model, train head (Adam lr=1e-3, 3 epochs)
- Stage 2: Fine-tune top 30 layers with BatchNorm frozen (Adam lr=1e-5, 3 epochs)
- Callbacks: EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
- Saves best.keras and training_config.json
"""

import os
import json
import time
import shutil
import numpy as np
import pandas as pd
from PIL import Image
import tensorflow as tf
from sklearn.utils.class_weight import compute_class_weight

SEED = 42
tf.keras.utils.set_random_seed(SEED)

def build_dataset(df_subset, class_to_idx, cache_path, img_size=(224, 224), batch_size=64, is_training=False):
    paths = df_subset["path"].values
    labels = [class_to_idx[l] for l in df_subset["label"].values]

    def parse_image(path, label):
        img_raw = tf.io.read_file(path)
        img = tf.io.decode_jpeg(img_raw, channels=3)
        img = tf.image.resize(img, img_size)
        return img, label

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    ds = ds.map(parse_image, num_parallel_calls=tf.data.AUTOTUNE)
    
    if os.path.exists(cache_path):
        try:
            if os.path.isdir(cache_path):
                shutil.rmtree(cache_path)
            else:
                os.remove(cache_path)
        except Exception:
            pass

    ds = ds.cache(cache_path)
    if is_training:
        ds = ds.shuffle(buffer_size=1024, seed=SEED)
    ds = ds.batch(batch_size)
    ds = ds.prefetch(tf.data.AUTOTUNE)
    return ds

def create_model(num_classes=13, input_shape=(224, 224, 3)):
    inputs = tf.keras.Input(shape=input_shape, name="input_image")
    # Preprocessing INSIDE model: scales 0-255 pixels to [-1, 1]
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)

    base_model = tf.keras.applications.MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet"
    )
    base_model.trainable = False

    x = base_model(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = tf.keras.layers.Dropout(0.2, name="head_dropout")(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = tf.keras.Model(inputs, outputs, name="KrishiDrishti_MobileNetV2")
    return model, base_model

def main():
    print("=" * 60)
    print("KRISHI DRISHTI: P08 - Disease Classifier Transfer Learning")
    print("=" * 60)

    split_path = "ml-training/data/split.csv"
    class_names_path = "ml-training/data/class_names.json"

    if not os.path.exists(split_path) or not os.path.exists(class_names_path):
        raise FileNotFoundError("Missing split.csv or class_names.json. Run P07 first!")

    with open(class_names_path, "r") as f:
        class_names = json.load(f)
    class_to_idx = {name: idx for idx, name in enumerate(class_names)}
    num_classes = len(class_names)
    print(f"Loaded {num_classes} classes.")

    df = pd.read_csv(split_path)
    train_df = df[df["split"] == "train"].copy()
    val_df = df[df["split"] == "val"].copy()
    test_df = df[df["split"] == "test"].copy()

    # Assert test split is strictly isolated
    assert len(set(train_df["path"]).intersection(set(test_df["path"]))) == 0, "Test leakage in train!"
    assert len(set(val_df["path"]).intersection(set(test_df["path"]))) == 0, "Test leakage in val!"
    print(f"Dataset splits -> Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")

    # Class weights calculation
    y_train = [class_to_idx[l] for l in train_df["label"].values]
    weights = compute_class_weight("balanced", classes=np.unique(y_train), y=y_train)
    class_weight_dict = {i: float(w) for i, w in enumerate(weights)}
    print(f"Class weights range: {min(weights):.2f} to {max(weights):.2f}")

    # Build tf.data datasets with fast caching
    batch_size = 64
    train_ds = build_dataset(train_df, class_to_idx, cache_path="/tmp/krishi_train_cache", batch_size=batch_size, is_training=True)
    val_ds = build_dataset(val_df, class_to_idx, cache_path="/tmp/krishi_val_cache", batch_size=batch_size, is_training=False)

    # Build model
    model, base_model = create_model(num_classes=num_classes)
    os.makedirs("ml-training/models", exist_ok=True)
    best_model_path = "ml-training/models/best.keras"

    # STAGE 1: Feature Extraction
    print("\n" + "=" * 50)
    print("STAGE 1: Training Classification Head (Base Frozen, 3 epochs)")
    print("=" * 50)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    stage1_epochs = 3
    t0 = time.time()
    history_s1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=stage1_epochs,
        class_weight=class_weight_dict,
        verbose=1
    )
    s1_time = time.time() - t0
    print(f"Stage 1 finished in {s1_time:.1f}s (avg {s1_time/stage1_epochs:.1f}s/epoch)")

    # STAGE 2: Fine-Tuning
    print("\n" + "=" * 50)
    print("STAGE 2: Fine-Tuning Top 30 Layers (BatchNorm Frozen, 3 epochs)")
    print("=" * 50)

    base_model.trainable = True
    fine_tune_at = len(base_model.layers) - 30

    for i, layer in enumerate(base_model.layers):
        if i < fine_tune_at or isinstance(layer, tf.keras.layers.BatchNormalization):
            layer.trainable = False
        else:
            layer.trainable = True

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=2, restore_best_weights=True, verbose=1),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.2, patience=1, min_lr=1e-6, verbose=1),
        tf.keras.callbacks.ModelCheckpoint(filepath=best_model_path, monitor="val_accuracy", save_best_only=True, verbose=1)
    ]

    stage2_epochs = 3
    t0 = time.time()
    history_s2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=stage2_epochs,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1
    )
    s2_time = time.time() - t0
    print(f"Stage 2 finished in {s2_time:.1f}s (avg {s2_time/stage2_epochs:.1f}s/epoch)")

    # Save final model
    model.save(best_model_path)
    print(f"\nSuccessfully saved model to {best_model_path}")

    # Verification test: Predict one image from test set
    sample_row = test_df.iloc[0]
    sample_img = Image.open(sample_row["path"]).convert("RGB").resize((224, 224))
    sample_arr = np.expand_dims(np.array(sample_img, dtype=np.float32), axis=0)

    pred_probs = model.predict(sample_arr, verbose=0)[0]
    pred_idx = int(np.argmax(pred_probs))
    pred_class = class_names[pred_idx]
    pred_conf = float(pred_probs[pred_idx])

    print("\nVerification Inference Check:")
    print(f"  Test image path: {sample_row['path']}")
    print(f"  True Label:      {sample_row['label']}")
    print(f"  Predicted Label: {pred_class} (Confidence: {pred_conf * 100:.2f}%)")

    # Training configuration log
    config = {
        "architecture": "MobileNetV2",
        "input_shape": [224, 224, 3],
        "preprocessing": "tf.keras.applications.mobilenet_v2.preprocess_input [-1, 1]",
        "num_classes": num_classes,
        "classes": class_names,
        "stage1": {
            "epochs": stage1_epochs,
            "learning_rate": 1e-3,
            "duration_seconds": round(s1_time, 1),
            "val_accuracy": float(history_s1.history["val_accuracy"][-1])
        },
        "stage2": {
            "epochs": len(history_s2.history["loss"]),
            "learning_rate": 1e-5,
            "duration_seconds": round(s2_time, 1),
            "val_accuracy": float(history_s2.history["val_accuracy"][-1])
        },
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    config_path = "ml-training/models/training_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    print(f"Saved training config to {config_path}")

if __name__ == "__main__":
    main()
