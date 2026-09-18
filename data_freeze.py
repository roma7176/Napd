import json
import hashlib
from typing import Dict, Any

class FrozenDataError(Exception):
    """Raised when an attempt is made to modify frozen clinical data."""
    pass

class ClinicalDataFreezer:
    """Enforces strict data freeze and integrity checks on clinical datasets."""
    
    def __init__(self):
        self._checksums: Dict[str, str] = {}
        self._frozen_cases: Dict[str, Dict[str, Any]] = {}

    def _compute_hash(self, data: Dict[str, Any]) -> str:
        encoded = json.dumps(data, sort_keys=True).encode('utf-8')
        return hashlib.sha256(encoded).hexdigest()

    def freeze_case(self, case_id: str, case_data: Dict[str, Any]) -> None:
        """Freezes a clinical case and records its cryptographic checksum."""
        checksum = self._compute_hash(case_data)
        self._checksums[case_id] = checksum
        self._frozen_cases[case_id] = json.loads(json.dumps(case_data))

    def verify_integrity(self, case_id: str, current_data: Dict[str, Any]) -> bool:
        """Verifies if the current case data matches the frozen checksum."""
        if case_id not in self._checksums:
            raise KeyError(f"Case {case_id} is not registered in the frozen dataset.")
        return self._compute_hash(current_data) == self._checksums[case_id]

    def get_frozen_case(self, case_id: str) -> Dict[str, Any]:
        """Returns a copy of the validated frozen case."""
        if case_id not in self._frozen_cases:
            raise KeyError(f"Case {case_id} not found.")
        return json.loads(json.dumps(self._frozen_cases[case_id]))
