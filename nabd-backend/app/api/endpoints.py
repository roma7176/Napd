import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import json
import os
import uuid
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import (
    EvaluationRequest,
    SessionCreate,
    SessionResponse,
    SessionState,
    DefenseSubmit,
)
from app.ai import ai_engine
from app.core.engine import NabdCognitiveEngine
cognitive_engine = NabdCognitiveEngine()
router = APIRouter()

sessions_db = {}

CASE_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "ai", "pneumonia_case.json")

def get_clinical_case():
    if os.path.exists(CASE_FILE_PATH):
        with open(CASE_FILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


@router.post("/evaluate")
def evaluate_student_reasoning(request: EvaluationRequest):
    return ai_engine.analyze_thinkaloud(request.think_aloud_text)


@router.post("/sessions", response_model=SessionResponse)
def create_session(session_data: SessionCreate):
    session_id = str(uuid.uuid4())
    session_dict = {
        "session_id": session_id,
        "user_id": session_data.user_id,
        "case_id": session_data.case_id,
        "state": SessionState.START,
        "think_aloud_text": None,
        "defense_question": None,
        "defense_answer": None,
        "evaluation_result": None,
    }
    sessions_db[session_id] = session_dict
    return session_dict


@router.post("/sessions/{session_id}/think-aloud", response_model=SessionResponse)
def submit_think_aloud(session_id: str, request: EvaluationRequest):
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[session_id]
    case_data = get_clinical_case()

    analysis = ai_engine.analyze_thinkaloud(request.think_aloud_text)

    required_labs = case_data.get("required_labs", ["CBC", "Chest X-ray", "Troponin", "ECG"])
    required_findings = case_data.get("required_findings", ["fever", "cough", "chest pain", "shortness of breath"])
    
    raw_diff = case_data.get("differential_diagnoses", ["Pneumonia", "ACS", "PE"])
    differential_diagnoses = [
        d if isinstance(d, str) else d.get("name", str(d)) 
        for d in raw_diff
    ]

    cognitive_report = cognitive_engine.analyze_reasoning(
        case_id=session["case_id"],
        student_input=request.think_aloud_text,
        required_labs=required_labs,
        required_findings=required_findings,
        differential_diagnoses=differential_diagnoses
    )

    try:
        raw_defense = ai_engine.generate_defense(analysis)
    except TypeError:
        raw_defense = ai_engine.generate_defense(analysis)

    if isinstance(raw_defense, dict):
        if "questions" in raw_defense and len(raw_defense["questions"]) > 0:
            first_q = raw_defense["questions"][0]
            if isinstance(first_q, dict):
                defense_q = first_q.get("question", str(first_q))
            else:
                defense_q = str(first_q)
        else:
            defense_q = json.dumps(raw_defense, ensure_ascii=False)
    else:
        defense_q = str(raw_defense)

    session["think_aloud_text"] = request.think_aloud_text
    session["evaluation_result"] = {
        "llm_analysis": analysis,
        "cognitive_assessment": cognitive_report.model_dump()
    }
    session["state"] = SessionState.DEFENSE
    session["defense_question"] = defense_q

    return session


@router.post("/sessions/{session_id}/defense", response_model=SessionResponse)
def submit_defense(session_id: str, defense: DefenseSubmit):
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[session_id]
    case_data = get_clinical_case()

    try:
        evaluation = ai_engine.evaluate_answer(
            session["defense_question"], 
            defense.answer_text, 
            case_data
        )
    except TypeError:
        evaluation = ai_engine.evaluate_answer(
            session["defense_question"], 
            defense.answer_text
        )

    bias_analysis = ai_engine.detect_bias(session["think_aloud_text"])

    session["defense_answer"] = defense.answer_text
    session["state"] = SessionState.RESULT
    session["evaluation_result"] = {
        "think_aloud_analysis": session.get("evaluation_result"),
        "defense_evaluation": evaluation,
        "bias_analysis": bias_analysis
    }

    return session


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session_status(session_id: str):
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions_db[session_id]