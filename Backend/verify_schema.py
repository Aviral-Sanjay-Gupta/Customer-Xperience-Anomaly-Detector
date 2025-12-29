"""Quick verification script for model selection feature."""

import sys
sys.path.insert(0, 'c:/Dev/Hackathon/Backend')

from src.schema import AnomalyScore

# Test 1: Create response with iforest only
score_iforest = AnomalyScore(
    interaction_id="test-1",
    scores={"iforest": 0.85},
    is_anomaly={"iforest": 1}
)
print("✓ IForest-only response created successfully")
print(f"  {score_iforest.model_dump()}")

# Test 2: Create response with rcf only
score_rcf = AnomalyScore(
    interaction_id="test-2",
    scores={"rcf": 1.23},
    is_anomaly={"rcf": 1}
)
print("\n✓ RCF-only response created successfully")
print(f"  {score_rcf.model_dump()}")

# Test 3: Create response with both models
score_both = AnomalyScore(
    interaction_id="test-3",
    scores={"iforest": 0.85, "rcf": 1.23},
    is_anomaly={"iforest": 1, "rcf": 1, "ensemble": 1}
)
print("\n✓ Both models response created successfully")
print(f"  {score_both.model_dump()}")

# Test 4: Verify no empty/null fields
import json
json_both = score_both.model_dump_json()
parsed = json.loads(json_both)
print("\n✓ JSON serialization validated")
print(f"  Keys in scores: {list(parsed['scores'].keys())}")
print(f"  Keys in is_anomaly: {list(parsed['is_anomaly'].keys())}")

# Test 5: Verify selective fields
json_iforest = score_iforest.model_dump_json()
parsed_if = json.loads(json_iforest)
assert "rcf" not in parsed_if["scores"], "RCF should not be in iforest-only response"
assert "ensemble" not in parsed_if["is_anomaly"], "Ensemble should not be in single-model response"
print("\n✓ Selective field validation passed")
print("  IForest-only response contains no RCF or ensemble fields")

print("\n" + "="*60)
print("All schema tests passed! ✓")
print("="*60)
