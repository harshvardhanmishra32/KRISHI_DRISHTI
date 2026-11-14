# Krishi Drishti - Crop Leaf Disease Classification Model Card

## Model Overview
- **Model Architecture**: MobileNetV2 with transfer learning (ImageNet pretrained base).
- **Target Crops**: Tomato (10 classes) and Potato (3 classes) — 13 disease classes total.
- **Input Specification**: 
  - Resolution: 224 x 224 x 3 (RGB)
  - Data Type: `float32`
  - Normalization: Embedded inside model (`[-1.0, 1.0]` scaling via MobileNetV2 preprocessing layer).
- **Output Specification**:
  - Softmax probabilities over 13 classes.
  - Shape: `[1, 13]`, `float32`.

## Target Classes (13 Total)
- `0`: potato_early_blight
- `1`: potato_healthy
- `2`: potato_late_blight
- `3`: tomato_bacterial_spot
- `4`: tomato_early_blight
- `5`: tomato_healthy
- `6`: tomato_late_blight
- `7`: tomato_leaf_mold
- `8`: tomato_mosaic_virus
- `9`: tomato_septoria_leaf_spot
- `10`: tomato_spider_mites
- `11`: tomato_target_spot
- `12`: tomato_yellow_leaf_curl_virus

## Performance Metrics
- **Test Accuracy**: 93.27%
- **Macro F1 Score**: 0.9160
- **Keras Model Size**: 20.90 MB
- **Quantized TFLite Model Size**: 2.45 MB
- **Float16 TFLite Model Size**: 4.36 MB
- **Top-1 Prediction Agreement (Keras vs TFLite)**: 100.0%
- **Average CPU Inference Latency**: ~5.8 ms per image on local CPU.

## Operational Thresholds
- **Recommended `low_confidence` Threshold**: `0.70`
- Any inference resulting in a top class confidence below 70% must be flagged with `is_low_confidence = true` in API responses, prompting the farmer to retake the photo with better lighting or consult a local Krishi Vigyan Kendra (KVK) officer.

## Limitations & Edge Cases
1. **Non-leaf inputs**: The model was trained on crop leaves. Submitting photos of stems, soil, non-plant objects, or extreme close-ups without leaf context may produce spurious predictions; the frontend and backend should enforce minimum leaf coverage.
2. **Background variability**: Images in PlantVillage have uniform lab/controlled backgrounds. Real-world field photos with complex shadows or busy soil backgrounds should undergo human officer review when confidence is below 0.70.
3. **Crops covered**: Currently covers Tomato and Potato. Additional crops (Rice, Wheat, Cotton) will be integrated in subsequent releases.

## License & Attribution
- PlantVillage Dataset (David Hughes and Marcel Salathé, Penn State University), CC-BY 4.0.
