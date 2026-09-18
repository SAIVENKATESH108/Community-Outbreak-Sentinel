"""Telegram Outbreak Alert & Messaging Service."""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
import httpx
from app.core.config import settings
from app.core.database import get_db, SupabaseClient
from app.models.cluster import ClusterResponse
from app.services.gemini_service import get_gemini_service

logger = logging.getLogger("sentinel.telegram_alerts")


class TelegramAlertService:
    """Dispatches real-time outbreak alerts and replies via Telegram Bot API."""

    def __init__(self, db: Optional[SupabaseClient] = None):
        self.db = db or get_db()
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.mock_mode = settings.TELEGRAM_MOCK_MODE
        self.api_base = f"https://api.telegram.org/bot{self.bot_token}"

    async def send_cluster_alert(
        self,
        cluster: ClusterResponse | Dict[str, Any],
        recipient_chat_ids: Optional[List[str]] = None,
        force_send: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Drafts a Gemini-powered outbreak alert advisory and dispatches it
        to PHC Medical Officers via Telegram Bot API, logging to alerts_log.
        """
        # 1. Normalize cluster data
        if isinstance(cluster, ClusterResponse):
            cluster_id = cluster.id
            village_name = cluster.village_name
            case_count = cluster.case_count
            severity_score = cluster.severity_score
            has_va = cluster.has_linked_verbal_autopsy
            stages = cluster.stages_breakdown or {}
        else:
            cluster_id = UUID(str(cluster["id"]))
            village_name = cluster.get("village_name", "Unknown Village")
            case_count = cluster.get("case_count", 0)
            severity_score = cluster.get("severity_score", 0.0)
            has_va = cluster.get("has_linked_verbal_autopsy", False)
            stages = cluster.get("stages_breakdown", {})

        # 2. Draft action-oriented message content via Gemini
        message_text = await self._draft_alert_message(
            village_name=village_name,
            case_count=case_count,
            severity_score=severity_score,
            has_va=has_va,
            stages=stages
        )

        # 3. Determine recipients
        targets = recipient_chat_ids or settings.alert_chat_ids
        if not targets:
            targets = ["default_phc_officer"]

        delivery_results = []
        now = datetime.now(timezone.utc)

        for chat_id in targets:
            status_str = "sent"
            # If in mock mode and not forced, bypass network call
            if self.mock_mode and not force_send:
                logger.info("[TELEGRAM MOCK MODE] Simulated alert to chat %s:\n%s", chat_id, message_text)
                status_str = "mock_sent"
            else:
                try:
                    await self.send_message(chat_id=chat_id, text=message_text)
                    logger.info("Successfully sent live Telegram alert to chat %s", chat_id)
                except Exception as e:
                    logger.error("Failed to send Telegram alert to %s: %s", chat_id, e)
                    status_str = "failed"

            # 4. Log to alerts_log table
            log_id = str(uuid4())
            log_payload = {
                "id": log_id,
                "cluster_id": str(cluster_id),
                "channel": "telegram",
                "recipient": str(chat_id),
                "message_summary": message_text[:300],
                "sent_at": now.isoformat(),
                "delivery_status": status_str
            }

            try:
                await self.db.insert("alerts_log", log_payload)
                logger.info("Recorded alert log entry %s", log_id)
            except Exception as e:
                logger.warning("Could not persist alert log to database: %s", e)

            delivery_results.append({
                "recipient": chat_id,
                "status": status_str,
                "summary": message_text[:150]
            })

        return delivery_results

    async def send_message(self, chat_id: str, text: str, parse_mode: str = "HTML") -> Dict[str, Any]:
        """Direct call to Telegram Bot API sendMessage endpoint."""
        url = f"{self.api_base}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.error("Telegram sendMessage returned %d: %s", resp.status_code, resp.text)
                resp.raise_for_status()
            return resp.json()

    async def _draft_alert_message(
        self,
        village_name: str,
        case_count: int,
        severity_score: float,
        has_va: bool,
        stages: Dict[str, int]
    ) -> str:
        """Constructs an urgent, structured alert advisory."""
        urgency = "CRITICAL EPIDEMIC ALERT" if severity_score >= 0.85 else "SURVEILLANCE WARNING"
        va_badge = "🔴 <b>CONFIRMED MORTALITY SIGNAL:</b> Linked to acute syndromic death.\n" if has_va else ""

        stage_lines = ""
        if stages:
            stage_lines = f"• Cold & Insomnia: {stages.get('cold_insomnia', 0)} cases\n• Motor Weakness: {stages.get('mobility_loss', 0)} cases\n• Confusion/Delirium: {stages.get('confusion', 0)} cases\n"

        return (
            f"🚨 <b>{urgency}</b> 🚨\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"📍 <b>Location:</b> Village {village_name} (Samastipur District)\n"
            f"📊 <b>Cluster Severity:</b> {severity_score * 100:.0f}%\n"
            f"👥 <b>Active Cases in Window:</b> {case_count}\n"
            f"{va_badge}"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"<b>Progression Breakdown:</b>\n"
            f"{stage_lines or '• Multi-individual sequence verified'}\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"📋 <b>Immediate Protocols:</b>\n"
            f"1. Mobilize PHC Rapid Response Team to {village_name}.\n"
            f"2. Initiate localized vector control & water source inspection.\n"
            f"3. Expedite CSF / Serological sampling for neuro-invasive arbovirus.\n"
            f"<i>Generated by Community Outbreak Sentinel AI</i>"
        )


_telegram_service: Optional[TelegramAlertService] = None


def get_telegram_service() -> TelegramAlertService:
    global _telegram_service
    if _telegram_service is None:
        _telegram_service = TelegramAlertService()
    return _telegram_service