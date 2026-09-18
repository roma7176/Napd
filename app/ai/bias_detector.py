import json
import glob
import os
from datetime import datetime
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, MODEL_NAME

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def latest():
    files = glob.glob(
        os.path.join(BASE_DIR, "task6_adaptive_logic_*.json")
    )
    if not files:
        raise FileNotFoundError("No Task 6 result files found.")
    return max(files, key=os.path.getmtime)

def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def main():
    source = latest()

    task6 = load_json(source)

    if task6.get("status") != "PASSED":
        raise ValueError("Task 6 status is not PASSED.")

    clinical_reasoning = task6.get("clinical_reasoning")
    case_rubric = task6.get("case_rubric")

    if not isinstance(clinical_reasoning, dict):
        raise ValueError("Invalid Task 6 clinical reasoning.")

    if not isinstance(case_rubric, dict):
        raise ValueError("Invalid Task 6 case rubric.")

    required_keywords = case_rubric.get("must_include_keywords")
    potential_biases = case_rubric.get("potential_biases_to_detect")

    if not isinstance(required_keywords, list):
        raise ValueError("Invalid required keywords.")

    if not isinstance(potential_biases, list):
        raise ValueError("Invalid potential biases.")

    prompt = f"""
You are a clinical reasoning cognitive bias detector.

Use ONLY the supplied clinical reasoning.

Detect ONLY:
- Anchoring Bias
- Premature Closure

A bias must be reported only when the reasoning explicitly provides evidence supporting it.

Do not infer bias from the diagnosis alone.
Do not add medical information.
Do not correct the student's reasoning.
Do not evaluate whether the diagnosis is medically correct.
Do not describe the reasoning as accurate or inaccurate.

If there is insufficient evidence, return:
"bias_detected": false
and an empty "biases" array.

Return ONLY valid JSON in exactly this structure:

{{
  "bias_detected": false,
  "biases": [],
  "overall_assessment": ""
}}

Clinical reasoning:
{json.dumps(clinical_reasoning, ensure_ascii=False, indent=2)}
"""

    print("=" * 70)
    print("NABD - TASK 7")
    print("BIAS DETECTOR")
    print("=" * 70)

    print("\n[1] FINDING LATEST TASK 6 FILE")
    print("Latest Task 6 file:", os.path.basename(source))
    print("Task 6 validation: PASS")

    print("\n[2] LOADING CLINICAL REASONING FROM TASK 6")
    print("Clinical reasoning: PASS")

    print("\n[3] LOADING CASE RUBRIC FROM TASK 6")
    print("Case rubric: PASS")
    print("Required keywords:", ", ".join(required_keywords))
    print("Potential biases:", ", ".join(potential_biases))

    print("\n[4] DETECTING BIAS")

    client = genai.Client(api_key=GEMINI_API_KEY)

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    if not response.text:
        raise RuntimeError("Empty Gemini response.")

    result = json.loads(response.text)

    for field in [
        "bias_detected",
        "biases",
        "overall_assessment"
    ]:
        if field not in result:
            raise ValueError(f"Missing field: {field}")

    if not isinstance(result["bias_detected"], bool):
        raise ValueError("bias_detected must be boolean.")

    if not isinstance(result["biases"], list):
        raise ValueError("biases must be a list.")

    print("Detection: PASS")

    print("\n[5] RESULT")
    print(json.dumps(result, ensure_ascii=False, indent=2))

    filename = (
        "task7_bias_detector_"
        + datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        + ".json"
    )

    output = {
        "task": "NABD Task 7 - Bias Detector",
        "created_at": datetime.now().isoformat(),
        "task6_source": os.path.basename(source),
        "model": MODEL_NAME,
        "clinical_reasoning": clinical_reasoning,
        "case_rubric": {
            "must_include_keywords": required_keywords,
            "potential_biases_to_detect": potential_biases
        },
        "result": result,
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

    print("\n[6] SAVING RESULT")
    print("Saved:", filename)

    print("\n" + "=" * 70)
    print("TASK 7 STATUS: PASSED")
    print("=" * 70)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("\n" + "=" * 70)
        print("TASK 7 STATUS: FAILED")
        print("=" * 70)
        print("Error type:", type(e).__name__)
        print("Error:", str(e))