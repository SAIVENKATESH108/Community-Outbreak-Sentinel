"""Supabase PostgREST Data Access Layer & Client."""

import logging
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("sentinel.database")


class SupabaseClient:
    """HTTP client communicating directly with Supabase PostgREST."""

    def __init__(self, base_url: str, secret_key: str):
        self.base_url = base_url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": secret_key,
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def select(
        self,
        table: str,
        params: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        order: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query_params = dict(params or {})
        if "select" not in query_params:
            query_params["select"] = "*"
        if limit:
            query_params["limit"] = str(limit)
        if order:
            query_params["order"] = order

        url = f"{self.base_url}/{table}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=self.headers, params=query_params)
            resp.raise_for_status()
            return resp.json()

    async def insert(self, table: str, data: Dict[str, Any] | List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/{table}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=self.headers, json=data)
            if resp.status_code >= 400:
                logger.error("Insert error (%s) on %s: %s", resp.status_code, table, resp.text)
            resp.raise_for_status()
            return resp.json()

    async def update(self, table: str, filters: Dict[str, Any], data: Dict[str, Any]) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/{table}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.patch(url, headers=self.headers, params=filters, json=data)
            resp.raise_for_status()
            return resp.json()

    async def delete(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/{table}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.delete(url, headers=self.headers, params=filters)
            resp.raise_for_status()
            return resp.json()


# Synchronous version for CLI scripts / seed tools
class SyncSupabaseClient:
    def __init__(self, base_url: str, secret_key: str):
        self.base_url = base_url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": secret_key,
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def select(
        self,
        table: str,
        params: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        order: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query_params = dict(params or {})
        if "select" not in query_params:
            query_params["select"] = "*"
        if limit:
            query_params["limit"] = str(limit)
        if order:
            query_params["order"] = order

        url = f"{self.base_url}/{table}"
        with httpx.Client(timeout=20.0) as client:
            resp = client.get(url, headers=self.headers, params=query_params)
            resp.raise_for_status()
            return resp.json()

    def insert(self, table: str, data: Dict[str, Any] | List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/{table}"
        with httpx.Client(timeout=20.0) as client:
            resp = client.post(url, headers=self.headers, json=data)
            resp.raise_for_status()
            return resp.json()

    def update(self, table: str, filters: Dict[str, Any], data: Dict[str, Any]) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/{table}"
        with httpx.Client(timeout=20.0) as client:
            resp = client.patch(url, headers=self.headers, params=filters, json=data)
            resp.raise_for_status()
            return resp.json()

    def delete(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/{table}"
        with httpx.Client(timeout=20.0) as client:
            resp = client.delete(url, headers=self.headers, params=filters)
            resp.raise_for_status()
            return resp.json()


def get_db() -> SupabaseClient:
    return SupabaseClient(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)


def get_sync_db() -> SyncSupabaseClient:
    return SyncSupabaseClient(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)