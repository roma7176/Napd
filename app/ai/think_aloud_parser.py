import json
import random
from datetime import datetime
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, MODEL_NAME
THINK_ALOUD = """
The patient is a 62-year-old man with three days of severe fever and shortness of breath.
Temperature is 39.1 C.
Heart rate is 112.
Respiratory rate is 28.
SpO2 is 89%.
WBC is 18.2 and CRP is 142.
Chest X-ray shows dense right lower-lobe lobar consolidation with air bronchograms.

I think community-acquired pneumonia is the most likely diagnosis because of the high fever, elevated inflammatory markers, and lobar consolidation.

Pulmonary embolism is also possible because of acute dyspnea and tachycardia.
"""

SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "clinical_findings": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(type=types.Type.STRING)
        ),
        "interpretations": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(type=types.Type.STRING)
        ),
        "working_diagnosis": types.Schema(
            type=types.Type.OBJECT,
            properties={
                "diagnosis": types.Schema(type=types.Type.STRING),
                "evidence": types.Schema(
                    type=types.Type.ARRAY,
                    items=types.Schema(type=types.Type.STRING)
                )
            },
            required=["diagnosis", "evidence"]
        ),
        "differential_diagnoses": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "diagnosis": types.Schema(type=types.Type.STRING),
                    "supporting_evidence": types.Schema(
                        type=types.Type.ARRAY,
                        items=types.Schema(type=types.Type.STRING)
                    ),
                    "opposing_evidence": types.Schema(
                        type=types.Type.ARRAY,
                        items=types.Schema(type=types.Type.STRING)
                    )
                },
                required=[
                    "diagnosis",
                    "supporting_evidence",
                    "opposing_evidence"
                ]
            )
        ),
        "investigations": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "test": types.Schema(type=types.Type.STRING),
                    "purpose": types.Schema(type=types.Type.STRING)
                },
                required=["test", "purpose"]
            )
        ),
        "reasoning_steps": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(type=types.Type.STRING)
        ),
        "uncertainties": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(type=types.Type.STRING)
        ),
        "final_impression": types.Schema(
            type=types.Type.STRING
        )
    },
    required=[
        "clinical_findings",
        "interpretations",
        "working_diagnosis",
        "differential_diagnoses",
        "investigations",
        "reasoning_steps",
        "uncertainties",
        "final_impression"
    ]
)

def main():
    print("=" * 70)
    print("NABD - TASK 2")
    print("THINK-ALOUD PARSER")
    print("=" * 70)

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        print("\n[1] ANALYZING THINK-ALOUD")

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=f"""
You are a Clinical Reasoning Parser.

Extract ONLY information explicitly expressed by the student.

Identify clinical findings, symptoms and signs, laboratory and imaging
findings, interpretations, working diagnosis, differential diagnoses,
supporting evidence, opposing evidence, investigations and their stated
purpose, reasoning steps, uncertainties, and final clinical impression.

Rules:
1. Do not invent or assume information.
2. Do not add medical information.
3. Do not correct the student's reasoning.
4. Do not evaluate correctness.
5. Do not generate defense questions.
6. Do not detect cognitive biases.
7. Preserve uncertainty.
8. Do not infer investigation purposes.
9. Keep the certainty level expressed by the student.
10. Return only valid JSON.

If a field is not mentioned, use an empty array where applicable and
an empty string for a missing scalar value.

Think-Aloud:
{THINK_ALOUD}
""",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=SCHEMA
            )
        )

        if not response.text:
            raise RuntimeError("Empty Gemini response.")

        result = json.loads(response.text)

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

        if any(x not in result for x in required):
            raise ValueError("Missing required field.")

        print("Analysis: PASS")
        print("\n[2] VALIDATING RESULT")
        print("Structure: PASS")

        run_id = (
            datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            + "_"
            + str(random.randint(1000, 9999))
        )

        filename = f"task2_think_aloud_{run_id}.json"

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "task": "NABD Task 2 - Think-Aloud Parser",
                    "run_id": run_id,
                    "created_at": datetime.now().isoformat(),
                    "model": MODEL_NAME,
                    "think_aloud": THINK_ALOUD,
                    "result": result,
                    "status": "PASSED"
                },
                f,
                ensure_ascii=False,
                indent=2
            )

        print("\n[3] SAVING RESULT")
        print("Saved:", filename)

        print("\n[4] RESULT")
        print(json.dumps(result, ensure_ascii=False, indent=2))

        print("\n" + "=" * 70)
        print("TASK 2 STATUS: PASSED")
        print("=" * 70)

    except Exception as e:
        print("\n" + "=" * 70)
        print("TASK 2 STATUS: FAILED")
        print("=" * 70)
        print("Error type:", type(e).__name__)
        print("Error:", str(e))

if __name__ == "__main__":
    main()