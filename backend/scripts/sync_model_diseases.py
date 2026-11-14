"""
Synchronizes the 13 Tomato & Potato leaf disease classes from class_names.json
into the PostgreSQL diseases and treatments tables.
"""

import json
import uuid
from app.db.session import SessionLocal
from app.models.crop import Crop, Disease, Treatment
from app.core.logging import logger

DISEASE_DEFINITIONS = [
    {
        "crop_name": "Potato",
        "name": "Potato Early Blight",
        "causal_organism": "Alternaria solani",
        "symptoms": "Dark brown concentric ring spots expanding across lower leaves; drying foliage.",
        "severity_level": "medium",
        "model_class_name": "potato_early_blight",
        "treatment": {
            "fertilizer": "Maintain balanced N-P-K and avoid moisture stress.",
            "pesticide": "Spray Chlorothalonil 75 WP @ 2g/L or Mancozeb 75 WP @ 2.5g/L.",
            "organic": "Foliar spray of Trichoderma harzianum @ 5g/L or 5% Neem extract.",
            "dosage": "2.0 grams per liter of water",
            "application_method": "Foliar spray at first appearance of spots, repeat after 10-12 days",
            "safety_note": "Confirm dose with local agriculture officer. Wear protective gear."
        }
    },
    {
        "crop_name": "Potato",
        "name": "Healthy",
        "causal_organism": "None",
        "symptoms": "Lush green foliage, normal upright growth, clean leaves without blotches.",
        "severity_level": "none",
        "model_class_name": "potato_healthy",
        "treatment": None
    },
    {
        "crop_name": "Potato",
        "name": "Potato Late Blight",
        "causal_organism": "Phytophthora infestans",
        "symptoms": "Dark water-soaked leaf spots, white mildew on leaf undersides, rapid leaf collapse.",
        "severity_level": "high",
        "model_class_name": "potato_late_blight",
        "treatment": {
            "fertilizer": "Ensure adequate potash application; avoid excessive nitrogen.",
            "pesticide": "Spray Metalaxyl 8% + Mancozeb 64% WP @ 2.5g/L or Cymoxanil 8% + Mancozeb 64% WP @ 2g/L.",
            "organic": "Prophylactic spray of Copper Hydroxide @ 2g/L or 1% Bordeaux mixture.",
            "dosage": "2.5 grams per liter of water",
            "application_method": "Thorough coverage of upper and lower leaf surfaces during cool humid weather",
            "safety_note": "Confirm dose with local agriculture officer. Do not spray right before heavy rain."
        }
    },
    {
        "crop_name": "Tomato",
        "name": "Tomato Bacterial Spot",
        "causal_organism": "Xanthomonas perforans / campestris",
        "symptoms": "Small dark brown water-soaked angular lesions with yellow halos on leaves and scabby fruit spots.",
        "severity_level": "high",
        "model_class_name": "tomato_bacterial_spot",
        "treatment": {
            "fertilizer": "Avoid overhead irrigation; maintain balanced soil calcium and potash.",
            "pesticide": "Spray Copper Oxychloride 50 WP @ 2.5g/L mixed with Streptocycline @ 0.1g/L.",
            "organic": "Foliar spray of Bacillus subtilis or Pseudomonas fluorescens @ 5g/L.",
            "dosage": "2.5g Copper Oxychloride + 1g Streptocycline per 10 liters of water",
            "application_method": "Foliar misting covering entire plant canopy",
            "safety_note": "Confirm dose with local agriculture officer. Disinfect pruning shears between plants."
        }
    },
    {
        "crop_name": "Tomato",
        "name": "Tomato Early Blight",
        "causal_organism": "Alternaria solani",
        "symptoms": "Target-like brown concentric rings on lower leaves; yellowing foliage.",
        "severity_level": "medium",
        "model_class_name": "tomato_early_blight",
        "treatment": {
            "fertilizer": "Avoid excess nitrogen; apply balanced NPK and organic compost.",
            "pesticide": "Spray Mancozeb 75 WP @ 2.5g/L or Chlorothalonil 75 WP @ 2g/L.",
            "organic": "Foliar spray of Trichoderma harzianum @ 5g/L or 1% Bordeaux mixture.",
            "dosage": "2.5 grams per liter of water",
            "application_method": "Foliar spray at first sign of target spots on lower foliage",
            "safety_note": "Confirm dose with local agriculture officer. Ensure safe harvest interval."
        }
    },
    {
        "crop_name": "Tomato",
        "name": "Healthy",
        "causal_organism": "None",
        "symptoms": "Vibrant green leaves, robust stems, no lesions or abnormal discoloration.",
        "severity_level": "none",
        "model_class_name": "tomato_healthy",
        "treatment": None
    },
    {
        "crop_name": "Tomato",
        "name": "Tomato Late Blight",
        "causal_organism": "Phytophthora infestans",
        "symptoms": "Large irregular greasy grey-green lesions with white fungal down on leaf undersides in humid conditions.",
        "severity_level": "high",
        "model_class_name": "tomato_late_blight",
        "treatment": {
            "fertilizer": "Avoid excess vegetative nitrogen; prune lower foliage to improve air circulation.",
            "pesticide": "Spray Dimethomorph 50% WP @ 1g/L or Metalaxyl-M + Mancozeb @ 2.5g/L.",
            "organic": "Spray Copper Hydroxide @ 2g/L or Potassium Phosphite @ 3ml/L.",
            "dosage": "2.5 grams per liter of water",
            "application_method": "Complete protective spray on both foliage sides upon cool rainy weather forecast",
            "safety_note": "Confirm dose with local agriculture officer. Destroy infected plant debris away from field."
        }
    },
    {
        "crop_name": "Tomato",
        "name": "Tomato Leaf Mold",
        "causal_organism": "Passalora fulva",
        "symptoms": "Pale yellow chlorotic patches on upper leaf surface, olive-green to brownish velvety mold underneath.",
        "severity_level": "medium",
        "model_class_name": "tomato_leaf_mold",
        "treatment": {
            "fertilizer": "Reduce greenhouse/tunnel humidity; space plants for better airflow.",
            "pesticide": "Spray Difenoconazole 25 EC @ 0.5ml/L or Chlorothalonil 75 WP @ 2g/L.",
            "organic": "Spray wettable sulfur @ 2.5g/L or copper-based biofungicide.",
            "dosage": "0.5 ml per liter of water",
            "application_method": "Spray directed at underside of lower and middle leaves",
            "safety_note": "Confirm dose with local agriculture officer. Improve ventilation in polyhouses."
        }
    },
    {
        "crop_name": "Tomato",
        "name": "Tomato Mosaic Virus",
        "causal_organism": "Tomato mosaic virus (ToMV)",
        "symptoms": "Mottling, light and dark green mosaic patterns on leaves, fern-like shoestring foliage, stunted plants.",
        "severity_level": "high",
        "model_class_name": "tomato_mosaic_virus",
        "treatment": {
            "fertilizer": "Foliar spray of micronutrients (zinc, boron) and seaweed extract to sustain plant vigor.",
            "pesticide": "No curative chemical exists for viral infections; rogue and burn infected plants immediately.",
            "organic": "Spray 20% skimmed milk solution to inhibit viral contact transmission during handling.",
            "dosage": "200 ml milk per liter of water",
            "application_method": "Wash hands with soap or 10% trisodium phosphate before touching plants",
            "safety_note": "Confirm disease with local agriculture officer. Control chewing/vector insects."
        }
    },
    {
        "crop_name": "Tomato",
        "name": "Tomato Septoria Leaf Spot",
        "causal_organism": "Septoria lycopersici",
        "symptoms": "Numerous circular brown spots with dark margins and gray centers containing tiny black fruiting bodies.",
        "severity_level": "medium",
        "model_class_name": "tomato_septoria_leaf_spot",
        "treatment": {
            "fertilizer": "Mulch around base to prevent soil splash; practice 2-year crop rotation.",
            "pesticide": "Spray Azoxystrobin 23% SC @ 1ml/L or Mancozeb 75 WP @ 2.5g/L.",
            "organic": "Spray Copper Oxychloride @ 2.5g/L or bio-fungicide Trichoderma @ 5g/L.",
            "dosage": "1 ml per liter of water",
            "application_method": "Foliar application focusing on bottom foliage up to mid-canopy",
            "safety_note": "Confirm dose with local agriculture officer. Avoid working in fields when plants are wet."
        }
    },
    {
        "crop_name": "Tomato",
        "name": "Tomato Two-Spotted Spider Mites",
        "causal_organism": "Tetranychus urticae",
        "symptoms": "Fine pale stippling or yellow speckles on upper leaf surface, fine silken webbing on undersides, leaf bronzing.",
        "severity_level": "medium",
        "model_class_name": "tomato_spider_mites",
        "treatment": {
            "fertilizer": "Maintain regular irrigation; avoid dusty dry field edges that foster mite explosions.",
            "pesticide": "Spray Spiromesifen 22.9 SC @ 1ml/L or Propargite 57 EC @ 2ml/L.",
            "organic": "Spray Neem oil (3000 ppm) @ 5ml/L or release predatory mites (Phytoseiulus persimilis).",
            "dosage": "1 ml per liter of water",
            "application_method": "High-pressure fine spray targeting leaf undersides",
            "safety_note": "Confirm dose with local agriculture officer. Alternate chemical classes to prevent mite resistance."
        }
    },
    {
        "crop_name": "Tomato",
        "name": "Tomato Target Spot",
        "causal_organism": "Corynespora cassiicola",
        "symptoms": "Pinpoint brown specks enlarging into circular lesions with concentric target rings and broad chlorotic halos.",
        "severity_level": "medium",
        "model_class_name": "tomato_target_spot",
        "treatment": {
            "fertilizer": "Ensure balanced nutrition and avoid high nitrogen during flowering.",
            "pesticide": "Spray Pyraclostrobin 20% WG @ 1g/L or Chlorothalonil 75 WP @ 2g/L.",
            "organic": "Foliar spray of Bacillus amyloliquefaciens or Copper Hydroxide @ 2g/L.",
            "dosage": "1 gram per liter of water",
            "application_method": "Foliar canopy spray at early stage of leaf spot detection",
            "safety_note": "Confirm dose with local agriculture officer."
        }
    },
    {
        "crop_name": "Tomato",
        "name": "Tomato Yellow Leaf Curl Virus",
        "causal_organism": "Tomato yellow leaf curl virus (TYLCV)",
        "symptoms": "Severe upward leaf curling, yellowing of leaf edges, bushy stunted growth, complete blossom drop.",
        "severity_level": "high",
        "model_class_name": "tomato_yellow_leaf_curl_virus",
        "treatment": {
            "fertilizer": "Apply zinc and boron micronutrients to support stress resistance.",
            "pesticide": "Control whitefly vector with Imidacloprid 17.8 SL @ 0.3ml/L or Diafenthiuron 50 WP @ 1.2g/L.",
            "organic": "Install yellow sticky traps (15-20 traps/acre); spray 5% Neem Seed Kernel Extract (NSKE).",
            "dosage": "0.3 ml per liter of water",
            "application_method": "Early morning spray on leaf undersides where whiteflies feed",
            "safety_note": "Confirm dose with local agriculture officer."
        }
    }
]

def main():
    db = SessionLocal()
    try:
        tomato = db.query(Crop).filter(Crop.name == "Tomato").first()
        potato = db.query(Crop).filter(Crop.name == "Potato").first()
        if not tomato or not potato:
            raise ValueError("Tomato and Potato crops must exist in DB.")

        print("Syncing 13 disease classes to database...")
        for item in DISEASE_DEFINITIONS:
            crop = tomato if item["crop_name"] == "Tomato" else potato

            # Check if disease with this model_class_name already exists
            disease = db.query(Disease).filter(
                Disease.model_class_name == item["model_class_name"]
            ).first()

            if not disease:
                # Check by name and crop_id
                disease = db.query(Disease).filter(
                    Disease.crop_id == crop.id,
                    Disease.name == item["name"]
                ).first()

            if disease:
                disease.name = item["name"]
                disease.causal_organism = item["causal_organism"]
                disease.symptoms = item["symptoms"]
                disease.severity_level = item["severity_level"]
                disease.model_class_name = item["model_class_name"]
                print(f"Updated disease: {disease.model_class_name}")
            else:
                disease = Disease(
                    crop_id=crop.id,
                    name=item["name"],
                    causal_organism=item["causal_organism"],
                    symptoms=item["symptoms"],
                    severity_level=item["severity_level"],
                    model_class_name=item["model_class_name"]
                )
                db.add(disease)
                db.flush()
                print(f"Added new disease: {disease.model_class_name}")

            # Upsert treatment if applicable
            t_data = item.get("treatment")
            if t_data:
                treatment = db.query(Treatment).filter(Treatment.disease_id == disease.id).first()
                if treatment:
                    treatment.fertilizer_recommendation = t_data["fertilizer"]
                    treatment.pesticide_recommendation = t_data["pesticide"]
                    treatment.organic_option = t_data["organic"]
                    treatment.dosage = t_data["dosage"]
                    treatment.application_method = t_data["application_method"]
                    treatment.safety_note = t_data["safety_note"]
                else:
                    treatment = Treatment(
                        disease_id=disease.id,
                        fertilizer_recommendation=t_data["fertilizer"],
                        pesticide_recommendation=t_data["pesticide"],
                        organic_option=t_data["organic"],
                        dosage=t_data["dosage"],
                        application_method=t_data["application_method"],
                        safety_note=t_data["safety_note"]
                    )
                    db.add(treatment)

        db.commit()
        print("\nAll 13 model disease classes and treatments synchronized successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
