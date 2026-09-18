import os
import json
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv

# تحميل ملف .env مباشرة
load_dotenv()

class GeminiService:
    def _get_api_key(self) -> str:
        # القراءة من os.getenv أو مباشرة من ملف .env
        key = os.getenv("GEMINI_API_KEY")
        if key:
            return key
        
        env_path = Path(__file__).resolve().parent.parent.parent / ".env"
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                if line.strip().startswith("GEMINI_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
        return None

    def analyze_clinical_reasoning(self, think_aloud_text: str) -> dict:
        api_key = self._get_api_key()
        
        if not api_key:
            return {
                "status": "error",
                "message": "GEMINI_API_KEY is missing."
            }

        try:
            client = genai.Client(api_key=api_key)

            prompt = f"""
            You are NabdCognitiveEngine, an advanced AI clinical reasoning evaluator for medical students.
            Analyze the following 'Think Aloud' student response and evaluate their clinical reasoning:

            Student Response: "{think_aloud_text}"

            Return your response strictly in valid JSON format with these exact keys:
            - "extracted_concepts": list of key medical concepts identified.
            - "cognitive_bias_detected": boolean (true/false).
            - "feedback": concise clinical feedback for the student.
            """

            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)

        except Exception as e:
            return {
                "status": "error",
                "message": f"Gemini Error: {str(e)}"
            }

gemini_service = GeminiService()