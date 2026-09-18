from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict

# ==========================================
# Enums
# ==========================================

class SessionState(str, Enum):
    START = "START"
    THINK_ALOUD = "THINK_ALOUD"
    DEFENSE = "DEFENSE"
    RESULT = "RESULT"


# ==========================================
# User Schemas
# ==========================================

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Case Schemas
# ==========================================

class CaseBase(BaseModel):
    title: str
    description: str

class CaseCreate(CaseBase):
    pass

class CaseResponse(CaseBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Session & Workflow Schemas
# ==========================================

class SessionCreate(BaseModel):
    user_id: int
    case_id: str

class SessionResponse(BaseModel):
    session_id: str
    user_id: int
    case_id: str
    state: SessionState
    think_aloud_text: Optional[str] = None
    defense_question: Optional[str] = None
    defense_answer: Optional[str] = None
    evaluation_result: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ThinkAloud & Defense Actions
# ==========================================

class ThinkAloudCreate(BaseModel):
    session_id: str
    raw_text: str

class ThinkAloudSubmit(BaseModel):
    session_id: str
    think_aloud_text: str

class ThinkAloudResponse(BaseModel):
    id: int
    session_id: str
    raw_text: str
    parsed_analysis: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class DefenseSubmit(BaseModel):
    session_id: str
    answer_text: str


# ==========================================
# Reasoning & Evaluation Schemas
# ==========================================

class ReasoningRequest(BaseModel):
    think_aloud_text: str

class ReasoningResult(BaseModel):
    clinical_findings: List[str]
    interpretations: List[str]

class ReasoningResponse(BaseModel):
    status: str
    data: ReasoningResult

class EvaluationRequest(BaseModel):
    think_aloud_text: str