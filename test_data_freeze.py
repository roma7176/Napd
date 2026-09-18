import pytest
from data.data_freeze import ClinicalDataFreezer

def test_data_freeze_integrity():
    freezer = ClinicalDataFreezer()
    sample_case = {
        "case_id": "FREEZE_001",
        "condition": "Acute Appendicitis",
        "mandatory_labs": ["Ultrasound", "CBC"]
    }
    
    freezer.freeze_case("FREEZE_001", sample_case)
    
    # Check valid integrity
    assert freezer.verify_integrity("FREEZE_001", sample_case) == True

def test_data_freeze_tamper_detection():
    freezer = ClinicalDataFreezer()
    sample_case = {
        "case_id": "FREEZE_002",
        "condition": "Pneumonia",
        "mandatory_labs": ["Chest X-Ray"]
    }
    
    freezer.freeze_case("FREEZE_002", sample_case)
    
    # Tamper with case data
    tampered_case = sample_case.copy()
    tampered_case["mandatory_labs"] = []
    
    # Verify tampering is detected
    assert freezer.verify_integrity("FREEZE_002", tampered_case) == False
