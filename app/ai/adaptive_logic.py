import json
import glob
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def latest():
    files = glob.glob(
        os.path.join(BASE_DIR, "task5_answer_evaluator_*.json")
    )
    if not files:
        raise FileNotFoundError("No Task 5 result files found.")
    return max(files, key=os.path.getmtime)

def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def main():
    source = latest()

    data = load_json(source)

    result = data.get("result")
    reasoning_source = data.get("clinical_reasoning_source")

    if not isinstance(result, dict):
        raise ValueError("Invalid Task 5 result.")

    required = [
        "score",
        "max_score",
        "evaluation",
        "strengths",
        "weaknesses",
        "missing_elements",
        "feedback"
    ]

    if any(x not in result for x in required):
        raise ValueError("Task 5 result is incomplete.")

    if not isinstance(result["score"], (int, float)):
        raise ValueError("Invalid score.")

    if not isinstance(result["max_score"], (int, float)):
        raise ValueError("Invalid max_score.")

    if result["max_score"] <= 0:
        raise ValueError("Invalid max_score.")

    if not reasoning_source:
        raise ValueError("Missing clinical_reasoning_source.")

    if not os.path.exists(reasoning_source):
        raise FileNotFoundError(
            f"Clinical reasoning source not found: {reasoning_source}"
        )

    reasoning_data = load_json(reasoning_source)

    clinical_reasoning = reasoning_data.get("result")

    if not isinstance(clinical_reasoning, dict):
        raise ValueError("Invalid clinical reasoning.")

    case_path = os.path.join(BASE_DIR, "pneumonia_case.json")

    if not os.path.exists(case_path):
        raise FileNotFoundError("pneumonia_case.json not found.")

    case_data = load_json(case_path)

    rubric = case_data.get("cognitive_rubric")

    if not isinstance(rubric, dict):
        raise ValueError("Invalid cognitive rubric.")

    required_keywords = rubric.get("must_include_keywords")

    if not isinstance(required_keywords, list):
        raise ValueError("Invalid must_include_keywords.")

    if not required_keywords:
        raise ValueError("No required keywords found.")

    potential_biases = rubric.get("potential_biases_to_detect", [])

    if not isinstance(potential_biases, list):
        raise ValueError("Invalid potential_biases_to_detect.")

    percentage = round(
        result["score"] / result["max_score"] * 100,
        2
    )

    if percentage < 50:
        level = "LOW"
        action = "REINFORCE"
        difficulty = "EASIER"
    elif percentage < 80:
        level = "MEDIUM"
        action = "PRACTICE"
        difficulty = "SIMILAR"
    else:
        level = "HIGH"
        action = "ADVANCE"
        difficulty = "HARDER"

    adaptation = {
        "performance_percentage": percentage,
        "performance_level": level,
        "adaptive_action": action,
        "next_difficulty": difficulty,
        "strengths": result["strengths"],
        "weaknesses": result["weaknesses"],
        "missing_elements": result["missing_elements"],
        "feedback": result["feedback"],
        "clinical_reasoning_source": reasoning_source,
        "required_keywords": required_keywords,
        "potential_biases_to_detect": potential_biases
    }

    filename = (
        "task6_adaptive_logic_"
        + datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        + ".json"
    )

    output = {
        "task": "NABD Task 6 - Adaptive Logic",
        "created_at": datetime.now().isoformat(),
        "task5_source": os.path.basename(source),
        "case_source": "pneumonia_case.json",
        "clinical_reasoning": clinical_reasoning,
        "case_rubric": {
            "must_include_keywords": required_keywords,
            "potential_biases_to_detect": potential_biases
        },
        "adaptation": adaptation,
        "status": "PASSED"
    }

    output_path = os.path.join(BASE_DIR, filename)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            output,
            f,
            ensure_ascii=False,
            indent=2
        )

    print("=" * 70)
    print("NABD - TASK 6")
    print("ADAPTIVE LOGIC")
    print("=" * 70)

    print("\nTask 5 source:", os.path.basename(source))
    print("Task 5 validation: PASS")

    print("\nClinical reasoning source:", reasoning_source)
    print("Clinical reasoning: PASS")

    print("\nCase source: pneumonia_case.json")
    print("Case rubric: PASS")

    print("\nRequired keywords:", ", ".join(required_keywords))
    print("Adaptive logic: PASS")

    print("\nSaved:", filename)

    print("\n" + "=" * 70)
    print("TASK 6 STATUS: PASSED")
    print("=" * 70)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("\n" + "=" * 70)
        print("TASK 6 STATUS: FAILED")
        print("=" * 70)
        print("Error type:", type(e).__name__)
        print("Error:", str(e))