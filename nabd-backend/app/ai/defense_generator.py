import json
import glob
import os
from datetime import datetime
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, MODEL_NAME

def latest_task3():
    files = glob.glob("task3_defense_prompt_*.json")
    if not files:
        raise FileNotFoundError("No Task 3 result files found.")
    return max(files, key=os.path.getmtime)

def load_task3():
    filename = latest_task3()
    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)

    result = data.get("defense_prompt")
    if not isinstance(result, dict):
        raise ValueError("Invalid Task 3 result.")

    for field in (
        "why_questions",
        "what_if_questions",
        "evidence_questions"
    ):
        if field not in result or not isinstance(result[field], list):
            raise ValueError(f"Invalid Task 3 field: {field}")

    return filename, result

def generate(prompt):
    client = genai.Client(api_key=GEMINI_API_KEY)

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=f"""
Generate clinical reasoning defense questions from the provided
Task 3 defense prompt.

Use only information contained in the input.
Do not invent clinical facts.
Do not add diagnoses or evidence.
Do not answer the questions.

Return ONLY valid JSON with exactly:
{{
  "why_questions": [],
  "what_if_questions": [],
  "evidence_questions": []
}}

Task 3:
{json.dumps(prompt, ensure_ascii=False)}
""",
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    if not response.text:
        raise RuntimeError("Empty Gemini response.")

    return json.loads(response.text)

def validate(result):
    for field in (
        "why_questions",
        "what_if_questions",
        "evidence_questions"
    ):
        if field not in result:
            raise ValueError(f"Missing field: {field}")
        if not isinstance(result[field], list):
            raise ValueError(f"{field} must be a list.")
        if not result[field]:
            raise ValueError(f"{field} cannot be empty.")

def save(source, result):
    filename = (
        "task4_defense_generator_"
        + datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        + ".json"
    )

    data = {
        "task": "NABD Task 4 - Defense Generator",
        "created_at": datetime.now().isoformat(),
        "task3_source": source,
        "model": MODEL_NAME,
        "result": result,
        "status": "PASSED"
    }

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return filename

def main():
    print("=" * 70)
    print("NABD - TASK 4")
    print("DEFENSE GENERATOR")
    print("=" * 70)

    try:
        print("\n[1] FINDING LATEST TASK 3 FILE")

        source, prompt = load_task3()

        print("Latest Task 3 file:", source)
        print("Task 3 validation: PASS")

        print("\n[2] GENERATING DEFENSE QUESTIONS")

        result = generate(prompt)

        print("Generation: PASS")

        print("\n[3] VALIDATING RESULT")

        validate(result)

        print("Structure: PASS")

        print("\n[4] QUESTIONS GENERATED")

        print("Why questions:", len(result["why_questions"]))
        print("What-if questions:", len(result["what_if_questions"]))
        print("Evidence questions:", len(result["evidence_questions"]))

        print("\n[5] SAVING RESULT")

        filename = save(source, result)

        print("Saved:", filename)

        print("\n" + "=" * 70)
        print("TASK 4 STATUS: PASSED")
        print("=" * 70)

        print("\nTask 3 source:")
        print(source)

        print("\nTask 4 result:")
        print(filename)

    except Exception as error:
        print("\n" + "=" * 70)
        print("TASK 4 STATUS: FAILED")
        print("=" * 70)
        print("Error type:", type(error).__name__)
        print("Error:", str(error))

if __name__ == "__main__":
    main()