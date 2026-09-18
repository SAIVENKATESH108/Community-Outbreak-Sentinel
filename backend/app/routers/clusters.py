"""API Routes for Outbreak Clusters and Spatiotemporal Detection Triggers."""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Path, status
from app.core.database import get_db, SupabaseClient
from app.models.cluster import ClusterActionResponse, ClusterStatus
from app.services.cluster_detection_service import (
    ClusterDetectionEngine,
    get_cluster_engine
)

logger = logging.getLogger("sentinel.clusters")

router = APIRouter(prefix="/api/v1/clusters", tags=["Cluster Detection & Management"])


@router.get("/active", response_model=List[Dict[str, Any]])
async def get_active_clusters(db: SupabaseClient = Depends(get_db)):
    """
    Returns all active, confirmed, or under-investigation outbreak clusters
    for the epidemiological surveillance map.
    """
    try:
        clusters = await db.select(
            "clusters",
            params={"status": "in.(detected,confirmed)"},
            order="severity_score.desc"
        )
        return clusters
    except Exception as e:
        logger.error("Error fetching active clusters: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/run-detection", response_model=Dict[str, Any])
async def trigger_manual_detection_sweep(
    engine: ClusterDetectionEngine = Depends(get_cluster_engine)
):
    """
    Manually triggers the deterministic spatiotemporal scan sweep across all villages.
    Instantly detects clusters, calculates progression sequence matches, incorporates
    verbal autopsy signals, and saves results to the database for live demonstration.
    """
    try:
        detected_clusters = await engine.run_detection_sweep(window_days=14)
        cluster_dicts = [c.model_dump() for c in detected_clusters]
        return {
            "status": "success",
            "sweep_timestamp": datetime.now(timezone.utc).isoformat(),
            "clusters_detected_count": len(detected_clusters),
            "clusters_found": len(detected_clusters),
            "clusters": cluster_dicts,
            "detected_clusters": cluster_dicts
        }
    except Exception as e:
        logger.error("Error in detection sweep: %s", e)
        raise HTTPException(status_code=500, detail=f"Detection sweep failed: {e}")


@router.post("/{cluster_id}/confirm", response_model=ClusterActionResponse)
async def confirm_cluster(
    cluster_id: UUID = Path(..., description="ID of the cluster to confirm"),
    db: SupabaseClient = Depends(get_db)
):
    """Marks a cluster as confirmed outbreak for public health action."""
    now = datetime.now(timezone.utc)
    try:
        res = await db.update(
            "clusters",
            {"id": f"eq.{str(cluster_id)}"},
            {"status": ClusterStatus.CONFIRMED.value}
        )
        if not res:
            raise HTTPException(status_code=404, detail="Cluster not found")
        return ClusterActionResponse(
            id=cluster_id,
            status=ClusterStatus.CONFIRMED.value,
            updated_at=now,
            message="Outbreak cluster confirmed by Public Health Officer."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{cluster_id}/dismiss", response_model=ClusterActionResponse)
async def dismiss_cluster(
    cluster_id: UUID = Path(..., description="ID of the cluster to dismiss"),
    db: SupabaseClient = Depends(get_db)
):
    """Marks a cluster as dismissed (false positive or non-clustered baseline noise)."""
    now = datetime.now(timezone.utc)
    try:
        res = await db.update(
            "clusters",
            {"id": f"eq.{str(cluster_id)}"},
            {"status": ClusterStatus.DISMISSED.value}
        )
        if not res:
            raise HTTPException(status_code=404, detail="Cluster not found")
        return ClusterActionResponse(
            id=cluster_id,
            status=ClusterStatus.DISMISSED.value,
            updated_at=now,
            message="Cluster dismissed as baseline surveillance noise."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{cluster_id}/reports", response_model=List[Dict[str, Any]])
async def get_cluster_reports(
    cluster_id: UUID = Path(..., description="ID of the cluster"),
    db: SupabaseClient = Depends(get_db)
):
    """Returns the actual patient symptom reports associated with this outbreak cluster."""
    try:
        clusters = await db.select("clusters", params={"id": f"eq.{str(cluster_id)}"}, limit=1)
        if not clusters:
            raise HTTPException(status_code=404, detail="Cluster not found")
        
        cluster = clusters[0]
        village_name = cluster.get("village_name")
        matched_ids = cluster.get("matched_symptom_reports") or []

        # Query symptom reports for this village
        reports = await db.select(
            "symptom_reports",
            params={"village_name": f"eq.{village_name}"},
            limit=50,
            order="reported_at.desc"
        )
        return reports
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

