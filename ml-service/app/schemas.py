"""Request schema. Answers are generated from the questionnaire, so the two can never disagree."""
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, create_model, model_validator

from app.family import CONDITIONS, RELATIONS
from app.questionnaire import GRADES, QUESTIONS, YES_NO, normalise_answers
from app.safety import RED_FLAG_IDS


def _field(q):
    if q["type"] == "number":
        return (Optional[int], Field(None, ge=q["min"], le=q["max"], strict=False))
    allowed = tuple(GRADES) if q["type"] == "grade" else tuple(YES_NO)
    return (Optional[Literal[allowed]], None)


_Answers = create_model("Answers", __config__=ConfigDict(extra="forbid"), **{q["id"]: _field(q) for q in QUESTIONS})


class Answers(_Answers):
    """Every question is optional; omitted / null / 'not sure' = missing (never assumed 'no')."""
    @model_validator(mode="before")
    @classmethod
    def _tidy(cls, data: Any):
        if isinstance(data, dict):
            return normalise_answers(data)
        return data


# --- red flags: yes/no/null each; null = not answered (never treated as 'no') -------------------------------------
RedFlags = create_model("RedFlags", __config__=ConfigDict(extra="forbid"), **{i: (Optional[bool], None) for i in RED_FLAG_IDS})

YesNoUnsure = Literal["yes", "no", "not_sure"]


def _yn(v: Any):
    """true/false/'Yes '/'N'/null/'not sure' -> 'yes' | 'no' | 'not_sure' (None stays None)."""
    if v is None: return None
    if v is True: return "yes"
    if v is False: return "no"
    s = str(v).strip().lower().replace(" ", "_")
    return {"y": "yes", "true": "yes", "n": "no", "false": "no", "unknown": "not_sure", "idk": "not_sure", "": "not_sure"}.get(s, s)


class Relative(BaseModel):
    model_config = ConfigDict(extra="forbid")
    relation: Literal[tuple(RELATIONS)]
    condition: Literal[tuple(CONDITIONS)]
    answer: YesNoUnsure

    @model_validator(mode="before")
    @classmethod
    def _tidy(cls, d: Any):
        if isinstance(d, dict):
            d = dict(d)
            if isinstance(d.get("relation"), str): d["relation"] = d["relation"].strip().lower().replace(" ", "_")
            if isinstance(d.get("condition"), str): d["condition"] = d["condition"].strip().lower()
            d["answer"] = _yn(d.get("answer"))
        return d


class FamilyHistory(BaseModel):
    model_config = ConfigDict(extra="forbid")
    psoriasis: Optional[YesNoUnsure] = None
    eczema: Optional[YesNoUnsure] = None
    vitiligo: Optional[YesNoUnsure] = None
    asthma_or_hay_fever: Optional[YesNoUnsure] = None
    autoimmune_disease: Optional[YesNoUnsure] = None
    relatives: List[Relative] = Field(default_factory=list, max_length=50)

    @model_validator(mode="before")
    @classmethod
    def _tidy(cls, d: Any):
        if isinstance(d, dict):
            d = dict(d)
            for k in ("psoriasis", "eczema", "vitiligo", "asthma_or_hay_fever", "autoimmune_disease"):
                if k in d: d[k] = _yn(d[k])
        return d


class AssessRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    answers: Answers
    redFlags: Optional[RedFlags] = None
    familyHistory: Optional[FamilyHistory] = None
    
class FamilyHistoryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    familyHistory: Optional[FamilyHistory] = None
