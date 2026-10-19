# Data sources - exactly what was used (and what was not)

## USED: the only dataset behind the model
| Item | Detail |
|---|---|
| Name | **Dermatology** (erythemato-squamous diseases), UCI Machine Learning Repository |
| Official page | https://archive.ics.uci.edu/dataset/33/dermatology |
| DOI | 10.24432/C5FK5P |
| Authors | Nilsel Ilter, H. Altay Guvenir (donated 1998) |
| Real data? | **Yes** - 366 real patient records. No simulated or synthetic data is used anywhere in this project. |
| Copy actually downloaded | https://github.com/syedmabusubhani/Skin_Disorder_Project, file `skin_disorder.csv`, pinned to commit `4a737ef479004d525b42f5efc5c8143c161de1c9` (raw URL in `ml-service/data/download_data.py`). The UCI server itself was not reachable from my build environment. |
| Integrity checks (automated) | SHA-256 `4c398eba26590ea7daad1c8405f971a669da5fc6f880d69dfdeea610c1c2f68b`; 366 rows x 35 columns; class counts 112/61/72/49/52/20 and 8 missing ages, all equal to the published UCI figures. Run `python data/download_data.py` and `pytest` to re-check. |
| Downloaded and processed? | **Yes** - downloaded, verified, trained on, evaluated (`ml-service/training/`). |
| Diagnoses (6) | psoriasis 112, seborrheic dermatitis 61, lichen planus 72, pityriasis rosea 49, chronic dermatitis 52, pityriasis rubra pilaris 20 |
| Grouping used by this project | psoriasis 112 / seborrheic dermatitis 61 / chronic dermatitis (eczema-type) 52 / "other scaly rash" 141 (lichen planus + pityriasis rosea + pityriasis rubra pilaris, grouped so the three out-of-scope diseases are not reported individually) |
| Features used (12) | 11 clinical items scored 0-3 by clinicians (erythema, scaling, definite borders, itching, Koebner phenomenon, polygonal papules, follicular papules, oral mucosal involvement, knee/elbow involvement, scalp involvement, family history 0/1) + age. The 22 histopathology (biopsy) columns are **not** used because a person cannot supply them. |
| License | **Not confirmed by me.** UCI generally publishes its datasets under CC BY 4.0, but I did not see the licence statement for this dataset. Check the official page before redistributing, and cite the DOI. The CSV copy is third-party hosted on GitHub. |
| Known limitations | Small (366); single source; collected in the 1990s; the test split has only 74 patients; features were scored by clinicians (not laypeople); no vitiligo; no atopic/contact/dyshidrotic eczema labels; the exact definition of the "family history" column could not be verified here - in the data it is 28.6% in psoriasis vs 0% in chronic dermatitis, so it mostly behaves like a psoriasis-family-history flag. |

## NOT USED (so you can see nothing is pretended)
| Source | Why it is not used |
|---|---|
| GWAS Catalog / genotype data (psoriasis, vitiligo, eczema) | `ebi.ac.uk` was not reachable from my environment and no individual-level genotype data exists in the project. Genetic-risk and hereditary-risk **models** are therefore not implemented. |
| PMLB copy of the same dermatology data (EpistasisLab/pmlb) | Stored with Git LFS; the actual file could not be downloaded. |
| SCIN (Google/Stanford dermatology images) | Existence verified via web search only; not downloaded. It is an image dataset with broad condition labels, not the questionnaire-type data this API uses. |
| Any vitiligo dataset | None found/reachable. Vitiligo is **not supported**. |
| Any dataset with subtype labels (plaque/guttate/scalp/nail psoriasis; atopic/contact/dyshidrotic eczema; segmental/non-segmental vitiligo) | None found/reachable. These subtypes are **not supported**. |
| Older synthetic-data models from the previous version of this project | Removed completely. |
