import json
import glob
import os
import time
from datetime import datetime
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, MODEL_NAME

def latest(pattern):
    files = glob.glob(pattern)
    if not files:
        raise FileNotFoundError(f"No file found: {pattern}")
    return max(files, key=os.path.getmtime)

def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def call(prompt):
    client = genai.Client(api_key=GEMINI_API_KEY)

    for attempt in range(3):
        try:
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

        except Exception as e:
            if "503" not in str(e) or attempt == 2:
                raise
            time.sleep(5)

def validate(x):
    fields = [
        "score",
        "max_score",
        "evaluation",
        "strengths",
        "weaknesses",
        "missing_elements",
        "feedback"
    ]

    if not isinstance(x, dict):
        raise ValueError("Invalid evaluation result.")

    for field in fields:
        if field not in x:
            raise ValueError(f"Missing field: {field}")

    if not isinstance(x["score"], (int, float)):
        raise ValueError("Invalid score.")

    if not isinstance(x["max_score"], (int, float)):
        raise ValueError("Invalid max_score.")

    if x["max_score"] <= 0:
        raise ValueError("Invalid max_score.")

    if not 0 <= x["score"] <= x["max_score"]:
        raise ValueError("Score out of range.")

    for field in [
        "strengths",
        "weaknesses",
        "missing_elements"
    ]:
        if not isinstance(x[field], list):
            raise ValueError(f"{field} must be a list.")

def main():
    print("=" * 70)
    print("NABD - TASK 5")
    print("ANSWER EVALUATOR")
    print("=" * 70)

    try:
        task4_file = latest("task4_defense_generator_*.json")
        task2_file = latest("task2_think_aloud_*.json")

        task4 = load(task4_file)
        task2 = load(task2_file)

        defense = task4.get("result")
        reasoning = task2.get("result")

        if task4.get("status") != "PASSED":
            raise ValueError("Task 4 status is not PASSED.")

        if task2.get("status") != "PASSED":
            raise ValueError("Task 2 status is not PASSED.")

        if not isinstance(defense, dict):
            raise ValueError("Invalid Task 4 result.")

        if not isinstance(reasoning, dict):
            raise ValueError("Invalid Task 2 result.")

        questions = defense.get("why_questions", [])

        if not questions:
            raise ValueError("No why questions found.")

        question = questions[0]

        answer = (
            "I selected community-acquired pneumonia because "
            "the patient has high fever, elevated inflammatory "
            "markers, and lobar consolidation."
        )

        print("\n[1] FINDING LATEST TASK 4 FILE")
        print("Latest Task 4 file:", task4_file)
        print("Task 4 validation: PASS")

        print("\n[2] FINDING LATEST TASK 2 FILE")
        print("Latest Task 2 file:", task2_file)
        print("Task 2 validation: PASS")

        print("\n[3] SELECTED QUESTION")
        print(question)

        print("\n[4] EVALUATING ANSWER")

        prompt = f"""
You are a clinical reasoning answer evaluator.

Evaluate ONLY the student's answer against the defense question
and the supplied clinical reasoning.

Do not invent information.
Do not add medical facts.
Do not assume missing facts.
Do not correct the student's reasoning.
Do not require information that is not supported by the supplied
clinical reasoning or explicitly required by the question.

Return ONLY valid JSON:

{{
  "score": 0,
  "max_score": 10,
  "evaluation": "",
  "strengths": [],
  "weaknesses": [],
  "missing_elements": [],
  "feedback": ""
}}

Defense question:
{question}

Student answer:
{answer}

Clinical reasoning:
{json.dumps(reasoning, ensure_ascii=False)}
"""

        result = call(prompt)

        print("Evaluation: PASS")

        print("\n[5] VALIDATING RESULT")

        validate(result)

        print("Structure: PASS")

        print("\n[6] RESULT")
        print(json.dumps(result, ensure_ascii=False, indent=2))

        filename = (
            "task5_answer_evaluator_"
            + datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            + ".json"
        )

        output = {
            "task": "NABD Task 5 - Answer Evaluator",
            "created_at": datetime.now().isoformat(),
            "task4_source": task4_file,
            "task2_source": task2_file,
            "model": MODEL_NAME,
            "question": question,
            "student_answer": answer,
            "clinical_reasoning_source": task2_file,
            "clinical_reasoning": reasoning,
            "result": result,
            "status": "PASSED"
        }

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(
                output,
                f,
                ensure_ascii=False,
                indent=2
            )

        print("\n[7] SAVING RESULT")
        print("Saved:", filename)

        print("\n" + "=" * 70)
        print("TASK 5 STATUS: PASSED")
        print("=" * 70)

    except Exception as e:
        print("\n" + "=" * 70)
        print("TASK 5 STATUS: FAILED")
        print("=" * 70)
        print("Error type:", type(e).__name__)
        print("Error:", str(e))

if __name__ == "__main__":
    main()