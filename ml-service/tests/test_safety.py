import pytest

from app.safety import RED_FLAG_IDS, evaluate_red_flags


def test_missing_red_flags_are_not_assessed():
    result = evaluate_red_flags(None)
    assert result["level"] == "not_assessed"
    assert result["triggeredBy"] == []
    assert set(result["unanswered"]) == set(RED_FLAG_IDS)


def test_partial_answers_are_not_reported_as_all_clear():
    result = evaluate_red_flags({"rapidly_worsening": False})
    assert result["level"] == "not_assessed"
    assert result["triggeredBy"] == []
    assert set(result["unanswered"]) == set(RED_FLAG_IDS) - {"rapidly_worsening"}
    assert "not all urgent warning signs were checked" in result["message"]


@pytest.mark.parametrize("flag_id", RED_FLAG_IDS)
def test_each_positive_red_flag_triggers_urgent_review(flag_id):
    result = evaluate_red_flags({flag_id: True})
    assert result["level"] == "urgent_review"
    assert [item["id"] for item in result["triggeredBy"]] == [flag_id]


def test_all_explicit_no_answers_are_none_reported():
    result = evaluate_red_flags({flag_id: False for flag_id in RED_FLAG_IDS})
    assert result["level"] == "none_reported"
    assert result["triggeredBy"] == []
    assert result["unanswered"] == []


def test_positive_red_flag_wins_even_when_other_answers_are_missing():
    result = evaluate_red_flags({"blisters": True, "rapidly_worsening": False})
    assert result["level"] == "urgent_review"
    assert [item["id"] for item in result["triggeredBy"]] == ["blisters"]
    assert len(result["unanswered"]) == 3
