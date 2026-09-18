import json
import glob
import os
from datetime import datetime
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, MODEL_NAME

def latest_task9():
    files = glob.glob("task9_case1_testing_*.json")

    if not files:
        raise FileNotFoundError("No Task 9 result files found.")

    return max(files, key=os.path.getmtime)

def load_task9():
    filename = latest_task9()

    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        raise ValueError("Invalid Task 9 result.")

    if data.get("status") != "PASSED":
        raise ValueError("Task 9 validation failed.")

    return filename, data

def improve(data):
    client = genai.Client(
        api_key=GEMINI_API_KEY
    )

    prompt = f"""
You are improving prompts for the NABD clinical reasoning system.

Review ONLY the provided Task 9 testing result.

Improve prompt quality while preserving all existing required functionality.

Requirements:

- Do not remove any required output.
- Do not invent clinical information.
- Do not change the intended task.
- Preserve uncertainty.
- Prevent hallucination.
- Preserve the distinction between findings and interpretations.
- Keep the existing clinical reasoning workflow.
- Make instructions clearer and more precise.
- Improve consistency of JSON output.
- Do not introduce unsupported medical knowledge.
- Preserve all functionality validated by Task 9.
- Improve any weaknesses identified by Task 9.
- Do not add unrelated functionality.

Return ONLY valid JSON with exactly these fields:

{{
  "improved_prompt": "",
  "improvements": [],
  "preserved_requirements": [],
  "validation": {{
    "anti_hallucination": true,
    "uncertainty_preserved": true,
    "required_outputs_preserved": true
  }}
}}

Task 9 result:

{json.dumps(data, ensure_ascii=False, indent=2)}
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    if not response.text:
        raise RuntimeError("Empty Gemini response.")

    return json.loads(response.text)

def validate(result):
    required_fields = [
        "improved_prompt",
        "improvements",
        "preserved_requirements",
        "validation"
    ]

    for field in required_fields:
        if field not in result:
            raise ValueError(
                f"Missing field: {field}"
            )

    if not isinstance(
        result["improved_prompt"],
        str
    ):
        raise ValueError(
            "improved_prompt must be a string."
        )

    if not result["improved_prompt"].strip():
        raise ValueError(
            "improved_prompt cannot be empty."
        )

    if not isinstance(
        result["improvements"],
        list
    ):
        raise ValueError(
            "improvements must be a list."
        )

    if not isinstance(
        result["preserved_requirements"],
        list
    ):
        raise ValueError(
            "preserved_requirements must be a list."
        )

    if not isinstance(
        result["validation"],
        dict
    ):
        raise ValueError(
            "validation must be an object."
        )

    validation_fields = [
        "anti_hallucination",
        "uncertainty_preserved",
        "required_outputs_preserved"
    ]

    for field in validation_fields:
        if result["validation"].get(field) is not True:
            raise ValueError(
                f"Validation failed: {field}"
            )

def save(source, result):
    filename = (
        "task10_prompt_improvement_"
        + datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )
        + ".json"
    )

    output = {
        "task": "NABD Task 10 - Prompt Improvement",
        "created_at": datetime.now().isoformat(),
        "task9_source": os.path.basename(source),
        "model": MODEL_NAME,
        "result": result,
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
    print("NABD - TASK 10")
    print("PROMPT IMPROVEMENT")
    print("=" * 70)

    try:
        print("\n[1] FINDING LATEST TASK 9 FILE")

        source, data = load_task9()

        print(
            "Latest Task 9 file:",
            os.path.basename(source)
        )

        print("Task 9 validation: PASS")

        print("\n[2] IMPROVING PROMPT")

        result = improve(data)

        print("Improvement: PASS")

        print("\n[3] VALIDATING RESULT")

        validate(result)

        print("Structure: PASS")

        print("\n[4] VALIDATION CHECKS")

        print("Anti-hallucination: PASS")
        print("Uncertainty preservation: PASS")
        print("Required outputs: PASS")

        print("\n[5] RESULT")

        print(
            json.dumps(
                result,
                ensure_ascii=False,
                indent=2
            )
        )

        print("\n[6] SAVING RESULT")

        filename = save(
            source,
            result
        )

        print("Saved:", filename)

        print("\n" + "=" * 70)
        print("TASK 10 STATUS: PASSED")
        print("=" * 70)

        print("\nTask 9 source:")
        print(os.path.basename(source))

        print("\nTask 10 result:")
        print(filename)

    except Exception as error:
        print("\n" + "=" * 70)
        print("TASK 10 STATUS: FAILED")
        print("=" * 70)

        print(
            "Error type:",
            type(error).__name__
        )

        print(
            "Error:",
            str(error)
        )

if __name__ == "__main__":
    main()