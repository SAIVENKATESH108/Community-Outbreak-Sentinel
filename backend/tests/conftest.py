"""Test configuration and fixtures for Sentinel automated test suite."""

import os
import pytest
import httpx

API_BASE_URL = os.environ.get("TEST_API_URL", "http://127.0.0.1:8000")


@pytest.fixture(scope="session")
def api_base_url():
    return API_BASE_URL


@pytest.fixture(scope="session")
def client(api_base_url):
    with httpx.Client(base_url=api_base_url, timeout=30.0) as http_client:
        yield http_client
