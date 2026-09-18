"""Script to retrieve Telegram chat IDs from recent messages to @SentinelOutbreak_bot."""

import json
import sys
import os
import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings


def get_chat_ids():
    token = settings.TELEGRAM_BOT_TOKEN
    base = f"https://api.telegram.org/bot{token}"

    print(f"Connecting to Telegram Bot API with token: {token[:10]}...")

    # Ensure webhook is not interfering with getUpdates
    hook_info = httpx.get(f"{base}/getWebhookInfo").json()
    if hook_info.get("result", {}).get("url"):
        print(f"Note: A webhook is currently registered: {hook_info['result']['url']}")
        print("To read getUpdates directly, you can delete the webhook using:")
        print("  python backend/scripts/register_telegram_webhook.py --delete\n")

    resp = httpx.get(f"{base}/getUpdates")
    data = resp.json()

    if not data.get("ok"):
        print("Error fetching updates from Telegram:", data)
        return

    updates = data.get("result", [])
    if not updates:
        print("\n[!] No recent messages found in Telegram update buffer.")
        print("How to get your chat_id:")
        print("  1. Open Telegram on your phone or web.")
        print("  2. Search for bot: @SentinelOutbreak_bot")
        print("  3. Click 'Start' or send any message (e.g. 'Hello').")
        print("  4. Re-run this script!")
        return

    print(f"\nFound {len(updates)} recent update(s):")
    seen_chats = set()

    for u in updates:
        msg = u.get("message") or u.get("channel_post")
        if not msg:
            continue
        chat = msg.get("chat", {})
        chat_id = chat.get("id")
        user = msg.get("from", {})
        name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "User"
        username = f"@{user.get('username')}" if user.get('username') else "No username"
        text = msg.get("text", "[Media/Voice]")

        if chat_id not in seen_chats:
            seen_chats.add(chat_id)
            print("=" * 50)
            print(f"Chat ID:   {chat_id}")
            print(f"User:      {name} ({username})")
            print(f"Type:      {chat.get('type')}")
            print(f"Sample:    {text}")

    print("\nTo send alerts to these chat(s), add them to backend/.env:")
    print(f"ALERT_RECIPIENT_CHAT_IDS={','.join(str(c) for c in seen_chats)}")


if __name__ == "__main__":
    get_chat_ids()