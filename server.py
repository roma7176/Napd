from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
from core.agent_core import NabdMultiAgentOrchestrator, MultiAgentEvaluationResult

app = FastAPI(
    title="Nabd Multi-Agent Clinical Decision API",
    description="Next-Generation Async AI Agent System for Medical Evaluation",
    version="2.0.0"
)

orchestrator = NabdMultiAgentOrchestrator()

class AgentEvaluationRequest(BaseModel):
    case_id: str = Field(..., example="CASE_AGENT_99")
    student_notes: str = Field(..., example="Patient has severe chest pain radiating to left arm. Differential: STEMI.")
    mandatory_labs: List[str] = Field(..., example=["ECG", "Troponin"])

@app.get("/")
async def root():
    return {"system": "Nabd Multi-Agent Engine", "status": "Agents Active"}

@app.post("/evaluate", response_model=MultiAgentEvaluationResult)
async def run_multi_agent_evaluation(request: AgentEvaluationRequest):
    try:
        result = await orchestrator.evaluate_case_async(
            case_id=request.case_id,
            student_input=request.student_notes,
            mandatory_labs=request.mandatory_labs
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
