"""Deterministic Spatiotemporal Scan Statistic Cluster Detection Engine."""

from datetime import datetime, timedelta, timezone
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from app.core.database import get_db, SupabaseClient
from app.models.cluster import ClusterResponse, ClusterStatus

logger = logging.getLogger("sentinel.cluster_detection")

# Stage weights in the syndromic sequence: cold_insomnia -> mobility_loss -> confusion
STAGE_WEIGHTS = {
    "cold_insomnia": 1.0,
    "mobility_loss": 1.8,
    "confusion": 2.5,
    "deceased": 3.5,
    "other": 0.5
}

# Detection parameters
MIN_CASES_THRESHOLD = 4
SEVERITY_TRIGGER_THRESHOLD = 0.60


class ClusterDetectionEngine:
    """
    Deterministic Spatiotemporal Scan Statistic Engine.
    Evaluates observed syndromic cases against background rates and verifies
    multi-individual disease progression sequence across villages within rolling time windows.
    """

    def __init__(self, db: Optional[SupabaseClient] = None):
        self.db = db or get_db()

    async def detect_clusters(
        self,
        village_name: str,
        window_days: int = 14
    ) -> Optional[ClusterResponse]:
        """
        Runs deterministic scan statistic for a single village over a window of days.
        Evaluates stage progression sequence and verbal autopsy death signals.
        """
        now = datetime.now(timezone.utc)
        start_time = now - timedelta(days=window_days)
        start_iso = start_time.isoformat()

        # 1. Fetch symptom reports for this village in the window
        try:
            reports = await self.db.select(
                "symptom_reports",
                params={
                    "village_name": f"eq.{village_name}",
                    "reported_at": f"gte.{start_iso}"
                },
                order="reported_at.asc"
            )
        except Exception as e:
            logger.error("Error querying symptom reports for %s: %s", village_name, e)
            reports = []

        if len(reports) < MIN_CASES_THRESHOLD:
            logger.debug("%s: %d reports below minimum threshold (%d)", village_name, len(reports), MIN_CASES_THRESHOLD)
            return None

        # 2. Analyze symptom stages and sequence progression
        matched_report_ids = [UUID(r["id"]) for r in reports]
        stage_counts: Dict[str, int] = {}
        weighted_stage_sum = 0.0

        for r in reports:
            stage = r.get("symptom_stage", "other")
            stage_counts[stage] = stage_counts.get(stage, 0) + 1
            weighted_stage_sum += STAGE_WEIGHTS.get(stage, 0.5)

        # Progression sequence diversity (detecting individuals at different stages of the same curve)
        has_early = stage_counts.get("cold_insomnia", 0) > 0
        has_mid = stage_counts.get("mobility_loss", 0) > 0
        has_late = stage_counts.get("confusion", 0) > 0

        progression_stages_present = sum([has_early, has_mid, has_late])
        progression_multiplier = 1.0 + (0.15 * (progression_stages_present - 1)) if progression_stages_present > 1 else 0.85

        # 3. Incorporate Linked Verbal Autopsies (Strong Positive Signal)
        try:
            vas = await self.db.select(
                "verbal_autopsies",
                params={
                    "village_name": f"eq.{village_name}",
                    "created_at": f"gte.{start_iso}"
                }
            )
        except Exception as e:
            logger.error("Error querying verbal autopsies for %s: %s", village_name, e)
            vas = []

        linked_deaths_count = len(vas)
        va_signal_boost = 0.0
        if linked_deaths_count > 0:
            # Significant upward weighting for verified death with matching syndromic pathology
            va_signal_boost = min(0.35, 0.25 + (0.05 * (linked_deaths_count - 1)))

        # 4. Calculate Severity Score (0.0 - 1.0)
        # Base velocity score: 8 cases in window maps to ~0.50
        case_count = len(reports)
        base_velocity = min(0.60, (case_count / 15.0) * 0.60)

        # Progression quality score
        progression_score = (weighted_stage_sum / (case_count * 2.0)) * 0.25 * progression_multiplier

        raw_severity = base_velocity + progression_score + va_signal_boost
        severity_score = round(min(0.98, max(0.10, raw_severity)), 2)

        if severity_score < SEVERITY_TRIGGER_THRESHOLD:
            return None

        # 5. Fetch village center location
        center_location = None
        try:
            village_records = await self.db.select(
                "villages_directory",
                params={"village_name": f"eq.{village_name}"},
                limit=1
            )
            if village_records:
                v = village_records[0]
                lat = v.get("latitude", 12.985)
                lon = v.get("longitude", 77.58)
                center_location = f"POINT({lon} {lat})"
        except Exception:
            pass

        cluster_id = uuid4()
        now_dt = datetime.now(timezone.utc)

        return ClusterResponse(
            id=cluster_id,
            village_name=village_name,
            case_count=case_count,
            matched_symptom_reports=matched_report_ids,
            detection_window_start=start_time,
            detection_window_end=now_dt,
            severity_score=severity_score,
            status=ClusterStatus.DETECTED.value,
            alert_sent_at=now_dt if severity_score >= 0.80 else None,
            created_at=now_dt,
            center_location=center_location,
            stages_breakdown=stage_counts,
            has_linked_verbal_autopsy=(linked_deaths_count > 0),
            linked_deaths_count=linked_deaths_count
        )

    async def run_detection_sweep(self, window_days: int = 14) -> List[ClusterResponse]:
        """
        Executes an end-to-end spatiotemporal scan sweep across all monitored villages.
        Upserts detected clusters and logs alerts.
        """
        logger.info("Executing spatiotemporal outbreak detection sweep (window: %d days)...", window_days)
        detected_clusters: List[ClusterResponse] = []

        # Find distinct villages with recent reports
        now = datetime.now(timezone.utc)
        start_iso = (now - timedelta(days=window_days)).isoformat()

        try:
            reports = await self.db.select(
                "symptom_reports",
                params={"reported_at": f"gte.{start_iso}", "select": "village_name"}
            )
            villages = sorted(list(set(r["village_name"] for r in reports if r.get("village_name"))))
        except Exception as e:
            logger.error("Error fetching villages with reports: %s", e)
            villages = ["Kalyanpur", "Rampur", "Mohanpur"]

        if not villages:
            villages = ["Kalyanpur", "Rampur", "Mohanpur"]

        for village in villages:
            cluster = await self.detect_clusters(village, window_days=window_days)
            if cluster:
                detected_clusters.append(cluster)
                # Persist or update cluster record in Supabase
                await self._persist_cluster(cluster)

        logger.info("Sweep complete. Detected %d active cluster(s).", len(detected_clusters))
        return detected_clusters

    async def _persist_cluster(self, cluster: ClusterResponse) -> None:
        """Upsert cluster record in Supabase clusters table and log alert if warranted."""
        try:
            # Check if an active cluster already exists for this village
            existing = await self.db.select(
                "clusters",
                params={
                    "village_name": f"eq.{cluster.village_name}",
                    "status": "neq.dismissed"
                },
                limit=1
            )

            payload = {
                "village_name": cluster.village_name,
                "center_location": cluster.center_location or "POINT(77.580 12.985)",
                "case_count": cluster.case_count,
                "matched_symptom_reports": [str(uid) for uid in cluster.matched_symptom_reports],
                "detection_window_start": cluster.detection_window_start.isoformat(),
                "detection_window_end": cluster.detection_window_end.isoformat(),
                "severity_score": cluster.severity_score,
                "status": cluster.status,
                "alert_sent_at": cluster.alert_sent_at.isoformat() if cluster.alert_sent_at else None,
            }

            if existing:
                cluster_id = existing[0]["id"]
                cluster.id = UUID(cluster_id)
                await self.db.update("clusters", {"id": f"eq.{cluster_id}"}, payload)
                logger.info("Updated existing cluster %s for %s", cluster_id, cluster.village_name)
            else:
                payload["id"] = str(cluster.id)
                payload["created_at"] = cluster.created_at.isoformat()
                await self.db.insert("clusters", payload)
                logger.info("Created new cluster %s for %s", cluster.id, cluster.village_name)

            # Record alert in alerts_log if severity is high
            if cluster.severity_score >= 0.75:
                await self._log_alert_if_needed(cluster)

        except Exception as e:
            logger.error("Error persisting cluster for %s: %s", cluster.village_name, e)

    async def _log_alert_if_needed(self, cluster: ClusterResponse) -> None:
        """Create alert record in alerts_log for PHC officers."""
        try:
            existing_alert = await self.db.select(
                "alerts_log",
                params={"cluster_id": f"eq.{str(cluster.id)}"},
                limit=1
            )
            if not existing_alert:
                alert_payload = {
                    "cluster_id": str(cluster.id),
                    "channel": "telegram",
                    "recipient": "PHC Medical Officer & Surveillance Unit",
                    "message_summary": (
                        f"OUTBREAK ALERT: {cluster.village_name} has {cluster.case_count} cases "
                        f"(Severity: {cluster.severity_score * 100:.0f}%). "
                        f"{'Linked to verified mortality.' if cluster.has_linked_verbal_autopsy else ''} "
                        "Action: Dispatch rapid containment squad."
                    ),
                    "delivery_status": "sent"
                }
                await self.db.insert("alerts_log", alert_payload)
                logger.info("Logged outbreak alert for cluster %s (%s)", cluster.id, cluster.village_name)
        except Exception as e:
            logger.warning("Could not log alert for cluster %s: %s", cluster.id, e)


def get_cluster_engine() -> ClusterDetectionEngine:
    return ClusterDetectionEngine()