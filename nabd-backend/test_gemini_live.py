import os
from google import genai

# تعيين المفتاح مباشرة في البيئة للاختبار
os.environ["GEMINI_API_KEY"] = "AQ.Ab8RN6Jqq7M5MHPAfV9W3WAWYoIQPWemK1HrLZ7H90XtW8go7w"

client = genai.Client()

print("--- Available Models ---")
try:
    for model in client.models.list():
        print(model.name)
except Exception as e:
    print(f"Error listing models: {e}")