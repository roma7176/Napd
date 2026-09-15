import json
import glob
import os
import random
from datetime import datetime

PATTERN = "task2_think_aloud_*.json"

def latest_task2():
    files = glob.glob(PATTERN)
    if not files:
        raise FileNotFoundError("No Task 2 result files found.")
    return max(files, key=os.path.getmtime)

def load_task2():
    filename = latest_task2()
    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        raise ValueError("Invalid Task 2 file.")

    result = data.get("result")
    if not isinstance(result, dict):
        raise ValueError("Task 2 result is missing.")

    required = [
        "clinical_findings",
        "interpretations",
        "working_diagnosis",
        "differential_diagnoses",
        "investigations",
        "reasoning_steps",
        "uncertainties",
        "final_impression"
    ]

    for field in required:
        if field not in result:
            raise ValueError(f"Missing Task 2 field: {field}")

    return filename, result

def build_prompt(data):
    diagnosis = data["working_diagnosis"].get("diagnosis")
    evidence = data["working_diagnosis"].get("evidence", [])
    differentials = data["differential_diagnoses"]
    uncertainties = data["uncertainties"]
    reasoning = data["reasoning_steps"]

    why = []

    if diagnosis:
        if evidence:
            why.append(
                f"Why did you select {diagnosis} as the working diagnosis "
                f"based on the stated evidence?"
            )
        else:
            why.append(
                f"Why did you select {diagnosis} as the working diagnosis?"
            )

    what_if = []

    for item in differentials:
        name = item.get("diagnosis")
        if name:
            what_if.append(
                f"What would make you reconsider {name} "
                f"based on the reasoning provided?"
            )

    if uncertainties:
        what_if.append(
            "What additional information would help resolve "
            "the uncertainty you explicitly identified?"
        )

    evidence_questions = []

    for item in evidence[:3]:
        evidence_questions.append(
            f"What evidence in the reasoning supports this finding: {item}?"
        )

    for step in reasoning[:3]:
        evidence_questions.append(
            f"What evidence supports this reasoning step: {step}?"
        )

    return {
        "why_questions": why[:3],
        "what_if_questions": what_if[:3],
        "evidence_questions": evidence_questions[:3]
    }

def validate(result):
    required = [
        "why_questions",
        "what_if_questions",
        "evidence_questions"
    ]

    for field in required:
        if field not in result:
            raise ValueError(f"Missing field: {field}")
        if not isinstance(result[field], list):
            raise ValueError(f"{field} must be a list.")

def save(task2_file, result):
    run_id = (
        datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        + "_"
        + str(random.randint(1000, 9999))
    )

    filename = f"task3_defense_prompt_{run_id}.json"

    output = {
        "task": "NABD Task 3 - Defense Prompt",
        "run_id": run_id,
        "created_at": datetime.now().isoformat(),
        "task2_source": task2_file,
        "api_request_used": False,
        "defense_prompt": result,
        "status": "PASSED"
    }

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    return filename

def main():
    print("=" * 70)
    print("NABD - TASK 3")
    print("DEFENSE PROMPT")
    print("=" * 70)

    try:
        print("\n[1] FINDING LATEST TASK 2 FILE")

        task2_file, data = load_task2()

        print("Latest Task 2 file:", task2_file)
        print("Task 2 validation: PASS")

        print("\n[2] BUILDING DEFENSE PROMPT")

        result = build_prompt(data)

        print("Defense prompt created: PASS")

        print("\n[3] PROMPT VALIDATION")

        validate(result)

        print("Prompt validation: PASS")

        print("\n[4] OUTPUT STRUCTURE")

        print("why_questions:", len(result["why_questions"]))
        print("what_if_questions:", len(result["what_if_questions"]))
        print("evidence_questions:", len(result["evidence_questions"]))

        filename = save(task2_file, result)

        print("\n[5] SAVING RESULT")
        print("Saved:", filename)

        print("\n" + "=" * 70)
        print("TASK 3 STATUS: PASSED")
        print("=" * 70)

        print("\nDepends on latest Task 2 file:")
        print(task2_file)

        print("\nNew Task 3 file:")
        print(filename)

    except Exception as error:
        print("\n" + "=" * 70)
        print("TASK 3 STATUS: FAILED")
        print("=" * 70)
        print("Error type:", type(error).__name__)
        print("Error:", str(error))

if __name__ == "__main__":
    main()