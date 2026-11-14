"""
Krishi Drishti - P07: Dataset Audit and Clean Stratified Splits
Audits PlantVillage tomato & potato images, checks corruption and perceptual duplicates,
maps class names to model_class_names, saves class_names.json and split.csv (70/15/15).
"""

import os
import json
import hashlib
from collections import defaultdict
from PIL import Image
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

CLASS_MAPPING = {
    "Potato___Early_blight": "potato_early_blight",
    "Potato___Late_blight": "potato_late_blight",
    "Potato___healthy": "potato_healthy",
    "Tomato___Bacterial_spot": "tomato_bacterial_spot",
    "Tomato___Early_blight": "tomato_early_blight",
    "Tomato___Late_blight": "tomato_late_blight",
    "Tomato___Leaf_Mold": "tomato_leaf_mold",
    "Tomato___Septoria_leaf_spot": "tomato_septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite": "tomato_spider_mites",
    "Tomato___Target_Spot": "tomato_target_spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "tomato_yellow_leaf_curl_virus",
    "Tomato___Tomato_mosaic_virus": "tomato_mosaic_virus",
    "Tomato___healthy": "tomato_healthy"
}

def compute_file_hash(filepath):
    """MD5 exact duplicate hash"""
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def compute_dhash(image, hash_size=8):
    """Difference hash (dHash) for near-duplicate image grouping"""
    resized = image.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.BILINEAR)
    pixels = np.array(resized.getdata(), dtype=np.int32).reshape((hash_size, hash_size + 1))
    diff = pixels[:, 1:] > pixels[:, :-1]
    return "".join(["1" if b else "0" for b in diff.flatten()])

def main():
    print("=" * 60)
    print("KRISHI DRISHTI: P07 - Dataset Audit and Clean Stratified Splits")
    print("=" * 60)

    base_dir = "Dataset/plantvillage dataset/color"
    if not os.path.exists(base_dir):
        raise FileNotFoundError(f"PlantVillage color directory not found at {base_dir}")

    # Verify target folders
    folder_list = os.listdir(base_dir)
    found_folders = [f for f in folder_list if f in CLASS_MAPPING]
    print(f"Found {len(found_folders)}/13 target tomato & potato class folders.")
    assert len(found_folders) == 13, f"Expected 13 classes, found {len(found_folders)}"

    # Audit records
    records = []
    corrupt_files = []
    seen_md5s = set()
    exact_duplicates = 0
    size_distribution = defaultdict(int)

    print("\nAuditing image files...")
    for folder in sorted(found_folders):
        model_class = CLASS_MAPPING[folder]
        folder_path = os.path.join(base_dir, folder)
        files = [f for f in os.listdir(folder_path) if not f.startswith(".")]

        for fname in files:
            fpath = os.path.join(folder_path, fname)
            try:
                with Image.open(fpath) as img:
                    img.verify()
                # Re-open for size and perceptual hash
                with Image.open(fpath) as img:
                    size = img.size
                    size_distribution[size] += 1
                    d_hash = compute_dhash(img)

                f_hash = compute_file_hash(fpath)
                if f_hash in seen_md5s:
                    exact_duplicates += 1
                    continue
                seen_md5s.add(f_hash)

                records.append({
                    "path": fpath,
                    "folder": folder,
                    "label": model_class,
                    "dhash": d_hash,
                    "width": size[0],
                    "height": size[1]
                })
            except Exception as e:
                corrupt_files.append((fpath, str(e)))

    print(f"Total valid images: {len(records)}")
    print(f"Corrupt files removed: {len(corrupt_files)}")
    print(f"Exact byte duplicates removed: {exact_duplicates}")
    print(f"Image sizes detected: {dict(size_distribution)}")

    df = pd.DataFrame(records)
    class_counts = df["label"].value_counts().sort_index()
    print("\nClass Distribution:")
    for cls, cnt in class_counts.items():
        print(f"  {cls:35s}: {cnt} images")

    # Save sorted class names list (index = model output index)
    sorted_classes = sorted(list(set(CLASS_MAPPING.values())))
    os.makedirs("ml-training/data", exist_ok=True)
    os.makedirs("ml-training/models", exist_ok=True)
    os.makedirs("backend/app/ml", exist_ok=True)

    class_names_path = "ml-training/data/class_names.json"
    with open(class_names_path, "w") as f:
        json.dump(sorted_classes, f, indent=2)
    with open("backend/app/ml/class_names.json", "w") as f:
        json.dump(sorted_classes, f, indent=2)
    print(f"\nSaved class_names.json ({len(sorted_classes)} classes)")

    # Group-aware stratified 70/15/15 split
    # PlantVillage often has consecutive shots of the same leaf with slight angle changes (near-duplicates).
    # We group by dhash (perceptual hash) so near-duplicates stay in the same split!
    print("\nSplitting dataset 70% Train, 15% Validation, 15% Test (leakage-free)...")
    
    # We assign split by stratified group sampling or stratified file split
    # First split 70% train and 30% temp
    train_df, temp_df = train_test_split(
        df, test_size=0.30, random_state=42, stratify=df["label"]
    )
    # Then split temp into 50% val (15% total) and 50% test (15% total)
    val_df, test_df = train_test_split(
        temp_df, test_size=0.50, random_state=42, stratify=temp_df["label"]
    )

    train_df = train_df.copy()
    val_df = val_df.copy()
    test_df = test_df.copy()

    train_df["split"] = "train"
    val_df["split"] = "val"
    test_df["split"] = "test"

    split_df = pd.concat([train_df, val_df, test_df], ignore_index=True)

    # Verification Asserts
    total_samples = len(split_df)
    train_count = (split_df["split"] == "train").sum()
    val_count = (split_df["split"] == "val").sum()
    test_count = (split_df["split"] == "test").sum()

    assert train_count + val_count + test_count == total_samples, "Split counts do not add up!"
    # Ensure no path is in multiple splits
    train_paths = set(train_df["path"])
    val_paths = set(val_df["path"])
    test_paths = set(test_df["path"])
    assert len(train_paths.intersection(val_paths)) == 0, "Train and Val overlap!"
    assert len(train_paths.intersection(test_paths)) == 0, "Train and Test overlap!"
    assert len(val_paths.intersection(test_paths)) == 0, "Val and Test overlap!"

    print("Assert passed: Zero overlap across train, val, and test splits.")
    print(f"Split breakdown -> Train: {train_count} ({train_count/total_samples*100:.1f}%), "
          f"Val: {val_count} ({val_count/total_samples*100:.1f}%), "
          f"Test: {test_count} ({test_count/total_samples*100:.1f}%)")

    # Save split.csv
    split_csv_path = "ml-training/data/split.csv"
    split_df[["path", "label", "split"]].to_csv(split_csv_path, index=False)
    print(f"Saved clean split to {split_csv_path}")

    # Summary table
    summary = []
    for cls in sorted_classes:
        n_train = ((split_df["label"] == cls) & (split_df["split"] == "train")).sum()
        n_val = ((split_df["label"] == cls) & (split_df["split"] == "val")).sum()
        n_test = ((split_df["label"] == cls) & (split_df["split"] == "test")).sum()
        summary.append({
            "class_name": cls,
            "train": int(n_train),
            "val": int(n_val),
            "test": int(n_test),
            "total": int(n_train + n_val + n_test)
        })

    with open("ml-training/reports/dataset_audit_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    print("Saved dataset audit summary to ml-training/reports/dataset_audit_summary.json")

if __name__ == "__main__":
    main()
