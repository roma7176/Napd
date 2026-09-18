import sys
import warnings
from pathlib import Path

# إخفاء كافة التحذيرات غير المباشرة
warnings.filterwarnings("ignore")

# إضافة مسار المشروع
project_root = Path(__file__).resolve().parent / "nabd-backend"
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_e2e_test():
    print("\n=== STARTING E2E WORKFLOW TEST ===")
    
    # 1. Create Session
    response = client.post("/api/v1/sessions", json={"user_id": 1, "case_id": "CASE-101"})
    assert response.status_code == 200
    session_data = response.json()
    session_id = session_data["session_id"]
    print(f"[✓] Session Created ID: {session_id} | State: {session_data['state']}")

    # 2. Submit Think Aloud
    think_payload = {
        "think_aloud_text": "Patient has severe retrosternal pain, suspicion of STEMI."
    }
    response = client.post(f"/api/v1/sessions/{session_id}/think-aloud", json=think_payload)
    assert response.status_code == 200
    session_data = response.json()
    print(f"[✓] Think Aloud Submitted | State: {session_data['state']}")
    print(f"    Defense Question Generated: {session_data['defense_question']}")

    # 3. Submit Defense Answer
    defense_payload = {
        "session_id": session_id,
        "answer_text": "Rule out aortic dissection first."
    }
    response = client.post(f"/api/v1/sessions/{session_id}/defense", json=defense_payload)
    assert response.status_code == 200
    session_data = response.json()
    print(f"[✓] Defense Submitted | Final State: {session_data['state']}")

    # 4. Fetch Session Dump
    response = client.get(f"/api/v1/sessions/{session_id}")
    assert response.status_code == 200
    print("[✓] Session Dump Successfully Retrieved!")
    print("\n=== E2E WORKFLOW PASSED SUCCESSFULLY ===\n")

if __name__ == "__main__":
    run_e2e_test()