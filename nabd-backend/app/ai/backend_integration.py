import json
import glob
import os
from datetime import datetime
import ai_engine

def latest_task11():
    files = glob.glob("task11_stable_functions_*.json")
    if not files:
        raise FileNotFoundError("No Task 11 result files found.")
    return max(files, key=os.path.getmtime)

def load_task11():
    filename = latest_task11()

    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)

    if data.get("status") != "PASSED":
        raise ValueError("Task 11 result is not valid.")

    functions = data.get("stable_functions")

    if not isinstance(functions, list):
        raise ValueError("Invalid stable functions.")

    return filename, functions

def test_functions(functions):
    required = [
        "analyze_thinkaloud",
        "generate_defense",
        "evaluate_answer",
        "detect_bias"
    ]

    for name in required:
        if name not in functions:
            raise ValueError(
                f"Missing stable function: {name}"
            )

        if not callable(
            getattr(ai_engine, name, None)
        ):
            raise ValueError(
                f"Function is not callable: {name}"
            )

    return required

def save(source, functions, tests):
    filename = (
        "task12_backend_integration_"
        + datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )
        + ".json"
    )

    output = {
        "task": "NABD Task 12 - Backend Integration Support",
        "created_at": datetime.now().isoformat(),
        "task11_source": os.path.basename(source),
        "stable_functions": functions,
        "integration_tests": tests,
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
    print("NABD - TASK 12")
    print("BACKEND INTEGRATION SUPPORT")
    print("=" * 70)

    try:
        print("\n[1] FINDING LATEST TASK 11 FILE")

        source, functions = load_task11()

        print(
            "Latest Task 11 file:",
            os.path.basename(source)
        )

        print("Task 11 validation: PASS")

        print("\n[2] VALIDATING BACKEND FUNCTIONS")

        required = test_functions(functions)

        tests = {}

        for name in required:
            tests[name] = True
            print(
                f"{name}:",
                "PASS"
            )

        print("\n[3] INTEGRATION VALIDATION")

        print("Function availability: PASS")
        print("Function callability: PASS")
        print("Task 11 dependency: PASS")

        filename = save(
            source,
            functions,
            tests
        )

        print("\n[4] SAVING RESULT")
        print("Saved:", filename)

        print("\n" + "=" * 70)
        print("TASK 12 STATUS: PASSED")
        print("=" * 70)

        print("\nTask 11 source:")
        print(os.path.basename(source))

        print("\nTask 12 result:")
        print(filename)

    except Exception as error:
        print("\n" + "=" * 70)
        print("TASK 12 STATUS: FAILED")
        print("=" * 70)
        print("Error type:", type(error).__name__)
        print("Error:", str(error))

if __name__ == "__main__":
    main()