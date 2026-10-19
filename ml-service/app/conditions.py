"""The 4 outcome groups. Built from the dataset's 6 diagnoses; nothing outside the dataset is claimed."""
# dataset class code -> group id
CLASS_MAP = {1: "psoriasis", 2: "seborrheic_dermatitis", 5: "chronic_dermatitis",
             3: "other_scaly_rash", 4: "other_scaly_rash", 6: "other_scaly_rash"}
CLASS_ORDER = ["psoriasis", "seborrheic_dermatitis", "chronic_dermatitis", "other_scaly_rash"]
LABELS = {
    "psoriasis": "Psoriasis",
    "seborrheic_dermatitis": "Seborrheic dermatitis (a type of eczema/dermatitis)",
    "chronic_dermatitis": "Chronic dermatitis (eczema-type)",
    "other_scaly_rash": "Other scaly rash (lichen planus, pityriasis rosea or pityriasis rubra pilaris)",
}
DATASET_LABEL = {"psoriasis": "psoriasis", "seborrheic_dermatitis": "seboreic dermatitis",
                 "chronic_dermatitis": "cronic dermatitis",
                 "other_scaly_rash": "lichen planus + pityriasis rosea + pityriasis rubra pilaris (grouped)"}
# Vitiligo and atopic-dermatitis-specific labels do NOT exist in this dataset.
