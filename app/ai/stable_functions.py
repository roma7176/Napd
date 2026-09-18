import json
import glob
import os
from datetime import datetime

def latest_task10():
    files = glob.glob("task10_prompt_improvement_*.json")
    if not files:
        raise FileNotFoundError("No Task 10 result files found.")
    return max(files, key=os.path.getmtime)

def load_task10():
    filename = latest_task10()

    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)

    if data.get("status") != "PASSED":
        raise ValueError("Task 10 is not valid.")

    result = data.get("result")

    if not isinstance(result, dict):
        raise ValueError("Invalid Task 10 result.")

    required = [
        "improved_prompt",
        "improvements",
        "preserved_requirements",
        "validation"
    ]

    for field in required:
        if field not in result:
            raise ValueError(
                f"Missing Task 10 field: {field}"
            )

    return filename, result

def validate_functions():
    required = [
        "analyze_thinkaloud",
        "generate_defense",
        "evaluate_answer",
        "detect_bias"
    ]

    import ai_engine

    missing = [
        name for name in required
        if not hasattr(ai_engine, name)
    ]

    if missing:
        raise ValueError(
            "Missing functions: "
            + ", ".join(missing)
        )

    return required

def save(source, functions):
    filename = (
        "task11_stable_functions_"
        + datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )
        + ".json"
    )

    output = {
        "task": "NABD Task 11 - Stable Functions",
        "created_at": datetime.now().isoformat(),
        "task10_source": os.path.basename(source),
        "stable_functions": functions,
        "function_count": len(functions),
        "status": "PASSED"
    }

    with open(
        filename,
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(
            output,
            f,
            ensure_ascii=False,
            indent=2
        )

    return filename

def main():
    print("=" * 70)
    print("NABD - TASK 11")
    print("STABLE FUNCTIONS")
    print("=" * 70)

    try:
        print("\n[1] FINDING LATEST TASK 10 FILE")

        source, data = load_task10()

        print(
            "Latest Task 10 file:",
            os.path.basename(source)
        )

        print("Task 10 validation: PASS")

        print("\n[2] VALIDATING STABLE FUNCTIONS")

        functions = validate_functions()

        for function in functions:
            print(function + ": READY")

        print("\n[3] FUNCTION COUNT")
        print("Total:", len(functions))

        filename = save(
            source,
            functions
        )

        print("\n[4] SAVING RESULT")
        print("Saved:", filename)

        print("\n" + "=" * 70)
        print("TASK 11 STATUS: PASSED")
        print("=" * 70)

        print("\nTask 10 source:")
        print(os.path.basename(source))

        print("\nTask 11 result:")
        print(filename)

    except Exception as error:
        print("\n" + "=" * 70)
        print("TASK 11 STATUS: FAILED")
        print("=" * 70)
        print("Error type:", type(error).__name__)
        print("Error:", str(error))

if __name__ == "__main__":
    main()
    