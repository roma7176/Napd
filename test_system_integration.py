import pytest
from core.agent_core import NabdMultiAgentOrchestrator
from data.data_freeze import ClinicalDataFreezer

@pytest.mark.asyncio
async def test_full_system_clinical_pipeline():
    # 1. Initialize Components
    freezer = ClinicalDataFreezer()
    orchestrator = NabdMultiAgentOrchestrator()
    
    # 2. Register Frozen Clinical Case
    mi_case = {
        "case_id": "CASE_MI_003",
        "condition": "Acute STEMI",
        "mandatory_labs": ["12-lead ECG", "Cardiac Troponin"]
    }
    freezer.freeze_case("CASE_MI_003", mi_case)
    
    # Verify Data Integrity
    assert freezer.verify_integrity("CASE_MI_003", mi_case) == True
    
    # 3. Run Async Multi-Agent Evaluation
    result = await orchestrator.evaluate_case_async(
        case_id="CASE_MI_003",
        student_input="Patient presents with retrosternal chest pain. Ordered 12-lead ECG and Troponin.",
        mandatory_labs=mi_case["mandatory_labs"]
    )
    
    # 4. Verify System Output Safety
    assert result.case_id == "CASE_MI_003"
    assert result.overall_safety_rating in ["OPTIMAL", "NEEDS REVIEW", "CRITICAL RISK"]
    assert len(result.agent_insights) == 2
