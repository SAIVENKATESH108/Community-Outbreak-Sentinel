"""TestSprite Automated Test Suite for Sentinel Backend API.

Covers Critical Flows:
1. POST /api/v1/reports/icon-app with valid structured symptom payload -> 200/201 and stored record
2. POST /api/v1/verbal-autopsy with raw transcript -> processed and linked correctly
3. POST /api/v1/clusters/run-detection -> seeded demo cluster detected (case_count >= 3, correct village)
4. GET /api/v1/clusters/active -> detected cluster appears in response
5. POST /api/v1/clusters/{id}/confirm -> status updates correctly to 'confirmed'
6. Edge cases: submitting report with missing required fields -> proper 4xx error, not crash
"""

import pytest
import httpx
from uuid import uuid4


class TestSentinelBackendAPI:
    """Automated test suite validating Sentinel REST API endpoints."""

    def test_flow_1_icon_app_valid_payload(self, client: httpx.Client):
        """1. POST /api/v1/reports/icon-app with valid structured symptom payload."""
        payload = {
            "village_name": "Kalyanpur",
            "subject_name": "Test Resident Icon Flow",
            "ward_or_area": "Ward 2",
            "symptom_stage": "mobility_loss",
            "selected_symptoms": ["fever", "joint_pain", "inability_to_walk"],
            "reporter_type": "asha_worker",
            "notes": "Automated icon reporting verification",
            "latitude": 12.985,
            "longitude": 77.580
        }

        response = client.post("/api/v1/reports/icon-app", json=payload)
        
        # Verify HTTP status code (200 OK or 201 Created)
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success", f"Expected status 'success', got: {data}"
        assert "report_id" in data, "Response missing report_id"
        assert data.get("village_name") == "Kalyanpur"
        assert data.get("stage") == "mobility_loss"

    def test_flow_2_verbal_autopsy_processing_and_linking(self, client: httpx.Client):
        """2. POST /api/v1/verbal-autopsy with raw transcript -> processed and linked correctly."""
        transcript = (
            "Family interview for deceased resident Ramu Lal in Kalyanpur. "
            "Patient developed high continuous fever and shivering on Day 1, followed by acute loss of leg "
            "mobility on Day 4, and progressive mental disorientation and confusion before passing away."
        )
        payload = {
            "deceased_name": "Ramu Lal",
            "village_name": "Kalyanpur",
            "interview_raw_transcript": transcript,
            "date_of_death": "2026-09-17",
            "interview_conducted_by": "asha_worker",
            "civil_registration_prompted": True,
            "latitude": 12.985,
            "longitude": 77.580
        }

        response = client.post("/api/v1/verbal-autopsy", json=payload)
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success", f"Expected status 'success', got: {data}"
        assert "id" in data or "va_id" in data or "verbal_autopsy_id" in data or "report_id" in data
        assert data.get("deceased_name") == "Ramu Lal"
        assert data.get("village_name") == "Kalyanpur"
        
        # Validate WHO structured verbal autopsy output
        assert "who_va_structured_data" in data or "probable_cause_category" in data
        assert data.get("probable_cause_category") is not None
        
        # Validate auto-linking to matching Kalyanpur symptom report
        linked_id = data.get("linked_symptom_report_id")
        assert linked_id is not None, f"Expected linked_symptom_report_id to be populated, got {data}"

    def test_flow_3_run_cluster_detection(self, client: httpx.Client):
        """3. POST /api/v1/clusters/run-detection -> demo cluster detected (case_count >= 3, correct village)."""
        response = client.post("/api/v1/clusters/run-detection")
        
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success"
        
        detected_clusters = data.get("detected_clusters") or data.get("clusters") or []
        assert len(detected_clusters) >= 1, f"Expected at least 1 cluster detected in response: {data}"
        
        clusters_found = data.get("clusters_detected_count") or data.get("clusters_found") or len(detected_clusters)
        assert clusters_found >= 1, f"Expected at least 1 cluster detected, found {clusters_found}"
        
        # Check that Kalyanpur demo cluster was identified
        kalyanpur_cluster = next((c for c in detected_clusters if c.get("village_name") == "Kalyanpur"), None)
        assert kalyanpur_cluster is not None, f"Kalyanpur cluster not found in detected list: {detected_clusters}"
        assert kalyanpur_cluster.get("case_count", 0) >= 3, f"Expected case_count >= 3, got: {kalyanpur_cluster}"
        assert kalyanpur_cluster.get("severity_score", 0) >= 0.5, f"Expected elevated severity score: {kalyanpur_cluster}"

    def test_flow_4_get_active_clusters(self, client: httpx.Client):
        """4. GET /api/v1/clusters/active -> expect detected cluster to appear in the response."""
        response = client.get("/api/v1/clusters/active")
        
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
        
        clusters = response.json()
        assert isinstance(clusters, list), f"Expected list of clusters, got: {type(clusters)}"
        assert len(clusters) >= 1, f"Expected at least 1 active cluster, got: {clusters}"
        
        # Verify cluster details
        cluster = next((c for c in clusters if c.get("village_name") == "Kalyanpur"), None)
        assert cluster is not None, f"Kalyanpur cluster not in active clusters list: {clusters}"
        assert "id" in cluster
        assert cluster.get("case_count", 0) >= 3
        assert "center_location" in cluster
        assert cluster.get("status") in ["detected", "confirmed"]

    def test_flow_5_confirm_cluster_status(self, client: httpx.Client):
        """5. POST /api/v1/clusters/{id}/confirm -> expect status to update correctly."""
        # 1. Fetch current active clusters to get an ID
        active_resp = client.get("/api/v1/clusters/active")
        assert active_resp.status_code == 200
        clusters = active_resp.json()
        assert len(clusters) >= 1
        
        cluster_id = clusters[0]["id"]
        
        # 2. Call confirm endpoint
        confirm_resp = client.post(f"/api/v1/clusters/{cluster_id}/confirm")
        assert confirm_resp.status_code == 200, f"Confirm failed: {confirm_resp.status_code}: {confirm_resp.text}"
        
        result = confirm_resp.json()
        assert result.get("id") == cluster_id
        assert result.get("status") == "confirmed"
        
        # 3. Verify that getting active clusters reflects 'confirmed' status
        verify_resp = client.get("/api/v1/clusters/active")
        assert verify_resp.status_code == 200
        updated_cluster = next((c for c in verify_resp.json() if c["id"] == cluster_id), None)
        assert updated_cluster is not None
        assert updated_cluster["status"] == "confirmed"

    def test_flow_6_edge_cases_missing_required_fields(self, client: httpx.Client):
        """6. Edge cases: submitting report with missing required fields -> proper 4xx error, not crash."""
        # Case 6a: Icon report missing village_name and selected_symptoms
        bad_payload_icon = {
            "subject_name": "Incomplete Person",
            # missing village_name, selected_symptoms, symptom_stage
        }
        res_icon = client.post("/api/v1/reports/icon-app", json=bad_payload_icon)
        assert 400 <= res_icon.status_code < 500, f"Expected 4xx for missing fields, got {res_icon.status_code}: {res_icon.text}"
        assert res_icon.status_code != 500, "Server crashed with 500 on missing required fields"

        # Case 6b: Verbal autopsy missing raw transcript and date_of_death
        bad_payload_va = {
            "deceased_name": "Nobody",
            "village_name": "Kalyanpur"
            # missing interview_raw_transcript, date_of_death
        }
        res_va = client.post("/api/v1/verbal-autopsy", json=bad_payload_va)
        assert 400 <= res_va.status_code < 500, f"Expected 4xx for missing VA fields, got {res_va.status_code}: {res_va.text}"
        assert res_va.status_code != 500, "Server crashed with 500 on missing required fields"

        # Case 6c: Confirming non-existent cluster ID
        fake_uuid = str(uuid4())
        res_fake = client.post(f"/api/v1/clusters/{fake_uuid}/confirm")
        assert res_fake.status_code in [404, 400], f"Expected 404/400 for non-existent cluster, got {res_fake.status_code}: {res_fake.text}"
        assert res_fake.status_code != 500, "Server crashed with 500 on non-existent cluster ID"
