import os
import sys
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

# تحميل متغيرات البيئة قبل تنفيذ أي استيراد
load_dotenv(find_dotenv(usecwd=True))

# إضافة المسار الداخلي لتسهيل استدعاء الموديولات
inner_dir = Path(r"D:\nabd-backend\nabd-backend")
sys.path.insert(0, str(inner_dir))

from app.core.gemini_service import gemini_service

sample_think_aloud = (
    "The patient presents with severe retrosternal chest pain radiating to the left arm, "
    "associated with diaphoresis and shortness of breath. Given the sudden onset, "
    "my primary suspicion is Acute Coronary Syndrome, specifically STEMI."
)

print("\n--- Sending request to Gemini Live ---")
result = gemini_service.analyze_clinical_reasoning(sample_think_aloud)

print("\n--- Live Gemini Output ---")
print(result)