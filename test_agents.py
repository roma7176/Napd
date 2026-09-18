import pytest
import asyncio
from core.agent_core import NabdMultiAgentOrchestrator

@pytest.mark.asyncio
async def test_multi_agent_orchestrator_execution():
    orchestrator = NabdMultiAgentOrchestrator()
    result = await orchestrator.evaluate_case_async(
        case_id="TEST_001",
        student_input="Patient with chest pain, ECG ordered.",
        mandatory_labs=["ECG", "Troponin"]
    )
    
    assert result.case_id == "TEST_001"
    assert len(result.agent_insights) == 2
    assert result.composite_cognitive_score >= 0.0
