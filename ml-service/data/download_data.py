"""
Download the REAL dermatology dataset and verify it.

Dataset : UCI "Dermatology" (erythemato-squamous diseases), Ilter & Guvenir 1998,
          https://doi.org/10.24432/C5FK5P   (366 patients, 34 attributes, 6 diagnoses)
Copy used: a GitHub copy of the UCI file, pinned to an exact commit so it never changes:
          https://github.com/syedmabusubhani/Skin_Disorder_Project  (file skin_disorder.csv)
Why a copy: the UCI server itself was not reachable from the build environment.
How we trust it: the file's SHA-256 is pinned below AND its contents are checked against the
          statistics published by UCI (row count, class counts, 8 missing ages).

Usage:  python data/download_data.py            (from the ml-service folder)
"""
import hashlib, sys, urllib.request
from pathlib import Path

import pandas as pd

URL = ("https://raw.githubusercontent.com/syedmabusubhani/Skin_Disorder_Project/"
       "4a737ef479004d525b42f5efc5c8143c161de1c9/skin_disorder.csv")
SHA256 = "4c398eba26590ea7daad1c8405f971a669da5fc6f880d69dfdeea610c1c2f68b"
DEST = Path(__file__).resolve().parent / "raw" / "skin_disorder.csv"

# Published UCI facts (class 1..6 counts, 366 rows, 34 attributes + class, 8 missing Age values)
UCI_CLASS_COUNTS = {1: 112, 2: 61, 3: 72, 4: 49, 5: 52, 6: 20}


def verify(path: Path) -> None:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != SHA256:
        raise SystemExit(f"SHA-256 mismatch for {path}: {digest} != {SHA256}")
    df = pd.read_csv(path, na_values=["?"])
    problems = []
    if df.shape != (366, 35): problems.append(f"shape {df.shape} != (366, 35)")
    if df["class"].value_counts().sort_index().to_dict() != UCI_CLASS_COUNTS: problems.append("class counts differ from UCI")
    if int(df["Age"].isna().sum()) != 8: problems.append("expected exactly 8 missing Age values")
    if problems:
        raise SystemExit("Dataset does not match published UCI statistics: " + "; ".join(problems))


def main() -> None:
    DEST.parent.mkdir(parents=True, exist_ok=True)
    if not DEST.exists():
        print("Downloading", URL)
        urllib.request.urlretrieve(URL, DEST)
    verify(DEST)
    print(f"OK: {DEST} verified (sha256 + UCI statistics).")


if __name__ == "__main__":
    sys.exit(main())
