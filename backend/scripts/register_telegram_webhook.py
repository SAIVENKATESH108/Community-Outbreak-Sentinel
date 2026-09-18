"""Script to register or inspect Telegram Bot Webhook URL."""

import argparse
import json
import sys
import os
import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings


def main():
    parser = argparse.ArgumentParser(description="Manage Telegram Bot Webhook")
    parser.add_argument("--url", type=str, help="Public HTTPS URL for the webhook (e.g. https://your-backend.example.com/api/v1/telegram/webhook)")
    parser.add_argument("--delete", action="store_true", help="Delete the current webhook (enables getUpdates)")
    parser.add_argument("--info", action="store_true", help="Check current webhook status")

    args = parser.parse_args()
    token = settings.TELEGRAM_BOT_TOKEN
    base = f"https://api.telegram.org/bot{token}"

    if args.delete:
        print("Deleting Telegram webhook...")
        resp = httpx.post(f"{base}/deleteWebhook")
        print(json.dumps(resp.json(), indent=2))
        return

    if args.url:
        print(f"Registering webhook: {args.url} ...")
        resp = httpx.post(f"{base}/setWebhook", json={"url": args.url, "allowed_updates": ["message"]})
        print(json.dumps(resp.json(), indent=2))
        return

    # Default: show info
    print("Fetching webhook and bot information...")
    me_resp = httpx.get(f"{base}/getMe")
    hook_resp = httpx.get(f"{base}/getWebhookInfo")
    print("\nBot Profile:")
    print(json.dumps(me_resp.json(), indent=2))
    print("\nWebhook Status:")
    print(json.dumps(hook_resp.json(), indent=2))


if __name__ == "__main__":
    main()
