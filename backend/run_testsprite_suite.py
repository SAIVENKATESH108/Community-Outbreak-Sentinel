"""TestSprite CLI Test Runner for Sentinel Backend API.
Runs the complete test suite against http://127.0.0.1:8000 and outputs a structured report.
"""

import sys
import time
import json
import httpx
from uuid import uuid4

BASE_URL = "http://127.0.0.1:8000"


def run_testsprite_suite():
    print("=" * 70)
    print("  TESTSPRITE AUTOMATED API TEST RUNNER - SENTINEL BACKEND")
    print(f"  Target: {BASE_URL}")
    print("=" * 70)
    print()

    client = httpx.Client(base_url=BASE_URL, timeout=30.0)
    results = []

    def record_test(name, passed, details, duration_ms):
        status_str = "[PASS]" if passed else "[FAIL]"
        print(f"  {status_str} {name} ({duration_ms:.1f}ms)")
        if not passed:
            print(f"         Error: {details}")
        results.append({
            "test": name,
            "passed": passed,
            "details": details,
            "duration_ms": duration_ms
        })

    # Flow 1
    t0 = time.perf_counter()
    try:
        res = client.post("/api/v1/reports/icon-app", json={
            "village_name": "Kalyanpur",
            "subject_name": "Test Resident Icon Flow",
            "ward_or_area": "Ward 2",
            "symptom_stage": "mobility_loss",
            "selected_symptoms": ["fever", "joint_pain", "inability_to_walk"],
            "reporter_type": "asha_worker",
            "notes": "Automated icon reporting verification",
            "latitude": 12.985,
            "longitude": 77.580
        })
        d_ms = (time.perf_counter() - t0) * 1000
        if res.status_code in [200, 201] and res.json().get("status") == "success" and "report_id" in res.json():
            record_test("Flow 1: POST /api/v1/reports/icon-app (valid payload)", True, f"Report ID: {res.json().get('report_id')}", d_ms)
        else:
            record_test("Flow 1: POST /api/v1/reports/icon-app (valid payload)", False, f"HTTP {res.status_code}: {res.text}", d_ms)
    except Exception as e:
        record_test("Flow 1: POST /api/v1/reports/icon-app (valid payload)", False, str(e), (time.perf_counter() - t0) * 1000)

    # Flow 2
    t0 = time.perf_counter()
    try:
        transcript = (
            "Family interview for deceased resident Ramu Lal in Kalyanpur. "
            "Patient developed high continuous fever and shivering on Day 1, followed by acute loss of leg "
            "mobility on Day 4, and progressive mental disorientation and confusion before passing away."
        )
        res = client.post("/api/v1/verbal-autopsy", json={
            "deceased_name": "Ramu Lal",
            "village_name": "Kalyanpur",
            "interview_raw_transcript": transcript,
            "date_of_death": "2026-09-17",
            "interview_conducted_by": "asha_worker",
            "civil_registration_prompted": True,
            "latitude": 12.985,
            "longitude": 77.580
        })
        d_ms = (time.perf_counter() - t0) * 1000
        if res.status_code in [200, 201]:
            data = res.json()
            linked_id = data.get("linked_symptom_report_id")
            if data.get("status") == "success" and linked_id:
                record_test("Flow 2: POST /api/v1/verbal-autopsy (transcript & linking)", True, f"Cause: {data.get('probable_cause_category')} | Linked: {linked_id}", d_ms)
            else:
                record_test("Flow 2: POST /api/v1/verbal-autopsy (transcript & linking)", False, f"Missing auto-linking or success status: {data}", d_ms)
        else:
            record_test("Flow 2: POST /api/v1/verbal-autopsy (transcript & linking)", False, f"HTTP {res.status_code}: {res.text}", d_ms)
    except Exception as e:
        record_test("Flow 2: POST /api/v1/verbal-autopsy (transcript & linking)", False, str(e), (time.perf_counter() - t0) * 1000)

    # Flow 3
    t0 = time.perf_counter()
    try:
        res = client.post("/api/v1/clusters/run-detection")
        d_ms = (time.perf_counter() - t0) * 1000
        if res.status_code == 200:
            data = res.json()
            clusters = data.get("detected_clusters") or data.get("clusters") or []
            k_cluster = next((c for c in clusters if c.get("village_name") == "Kalyanpur"), None)
            if k_cluster and k_cluster.get("case_count", 0) >= 3:
                record_test("Flow 3: POST /api/v1/clusters/run-detection (demo cluster detected)", True, f"Found Kalyanpur cluster with {k_cluster.get('case_count')} cases, score: {k_cluster.get('severity_score')}", d_ms)
            else:
                record_test("Flow 3: POST /api/v1/clusters/run-detection (demo cluster detected)", False, f"Kalyanpur cluster not found or case count < 3: {clusters}", d_ms)
        else:
            record_test("Flow 3: POST /api/v1/clusters/run-detection (demo cluster detected)", False, f"HTTP {res.status_code}: {res.text}", d_ms)
    except Exception as e:
        record_test("Flow 3: POST /api/v1/clusters/run-detection (demo cluster detected)", False, str(e), (time.perf_counter() - t0) * 1000)

    # Flow 4
    t0 = time.perf_counter()
    active_cluster_id = None
    try:
        res = client.get("/api/v1/clusters/active")
        d_ms = (time.perf_counter() - t0) * 1000
        if res.status_code == 200:
            clusters = res.json()
            k_cluster = next((c for c in clusters if c.get("village_name") == "Kalyanpur"), None)
            if k_cluster and k_cluster.get("case_count", 0) >= 3:
                active_cluster_id = k_cluster.get("id")
                record_test("Flow 4: GET /api/v1/clusters/active (detected cluster appears)", True, f"Active cluster ID: {active_cluster_id}, cases: {k_cluster.get('case_count')}", d_ms)
            else:
                record_test("Flow 4: GET /api/v1/clusters/active (detected cluster appears)", False, f"Kalyanpur cluster not in active list: {clusters}", d_ms)
        else:
            record_test("Flow 4: GET /api/v1/clusters/active (detected cluster appears)", False, f"HTTP {res.status_code}: {res.text}", d_ms)
    except Exception as e:
        record_test("Flow 4: GET /api/v1/clusters/active (detected cluster appears)", False, str(e), (time.perf_counter() - t0) * 1000)

    # Flow 5
    t0 = time.perf_counter()
    try:
        if active_cluster_id:
            res = client.post(f"/api/v1/clusters/{active_cluster_id}/confirm")
            d_ms = (time.perf_counter() - t0) * 1000
            if res.status_code == 200 and res.json().get("status") == "confirmed":
                record_test("Flow 5: POST /api/v1/clusters/{id}/confirm (status updates)", True, f"Status: {res.json().get('status')} for ID: {active_cluster_id}", d_ms)
            else:
                record_test("Flow 5: POST /api/v1/clusters/{id}/confirm (status updates)", False, f"HTTP {res.status_code}: {res.text}", d_ms)
        else:
            record_test("Flow 5: POST /api/v1/clusters/{id}/confirm (status updates)", False, "No active cluster ID available from Flow 4", 0)
    except Exception as e:
        record_test("Flow 5: POST /api/v1/clusters/{id}/confirm (status updates)", False, str(e), (time.perf_counter() - t0) * 1000)

    # Flow 6
    t0 = time.perf_counter()
    try:
        r1 = client.post("/api/v1/reports/icon-app", json={"subject_name": "Incomplete"})
        r2 = client.post("/api/v1/verbal-autopsy", json={"deceased_name": "Incomplete"})
        r3 = client.post(f"/api/v1/clusters/{uuid4()}/confirm")
        d_ms = (time.perf_counter() - t0) * 1000

        p1 = 400 <= r1.status_code < 500
        p2 = 400 <= r2.status_code < 500
        p3 = 400 <= r3.status_code < 500

        if p1 and p2 and p3:
            record_test("Flow 6: Edge Cases (missing fields return 4xx, not 500 crash)", True, f"r1: {r1.status_code}, r2: {r2.status_code}, r3: {r3.status_code}", d_ms)
        else:
            record_test("Flow 6: Edge Cases (missing fields return 4xx, not 500 crash)", False, f"Unexpected codes: r1={r1.status_code}, r2={r2.status_code}, r3={r3.status_code}", d_ms)
    except Exception as e:
        record_test("Flow 6: Edge Cases (missing fields return 4xx, not 500 crash)", False, str(e), (time.perf_counter() - t0) * 1000)

    # Summary
    passed_count = sum(1 for r in results if r["passed"])
    failed_count = len(results) - passed_count
    print()
    print("-" * 70)
    print(f"  TESTSPRITE SUMMARY: {passed_count} PASSED, {failed_count} FAILED (Total: {len(results)})")
    print("-" * 70)
    return 0 if failed_count == 0 else 1


if __name__ == "__main__":
    sys.exit(run_testsprite_suite())
