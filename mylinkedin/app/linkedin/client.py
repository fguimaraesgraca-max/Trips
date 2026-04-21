import os
import requests
from pathlib import Path


LINKEDIN_API_BASE = "https://api.linkedin.com/v2"


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }


def get_user_urn(token: str) -> str:
    """Returns the LinkedIn URN of the authenticated user."""
    resp = requests.get(f"{LINKEDIN_API_BASE}/userinfo", headers=_headers(token))
    resp.raise_for_status()
    data = resp.json()
    return data.get("sub")  # OpenID sub is the person URN id


def upload_image(token: str, owner_urn: str, image_path: str) -> str:
    """Registers and uploads an image to LinkedIn. Returns the asset URN."""
    # Step 1: Register upload
    register_payload = {
        "registerUploadRequest": {
            "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
            "owner": f"urn:li:person:{owner_urn}",
            "serviceRelationships": [
                {
                    "relationshipType": "OWNER",
                    "identifier": "urn:li:userGeneratedContent",
                }
            ],
        }
    }
    resp = requests.post(
        f"{LINKEDIN_API_BASE}/assets?action=registerUpload",
        json=register_payload,
        headers=_headers(token),
    )
    resp.raise_for_status()
    reg_data = resp.json()
    upload_url = reg_data["value"]["uploadMechanism"][
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ]["uploadUrl"]
    asset = reg_data["value"]["asset"]

    # Step 2: Upload binary
    with open(image_path, "rb") as f:
        img_data = f.read()
    upload_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/octet-stream",
    }
    put_resp = requests.put(upload_url, data=img_data, headers=upload_headers)
    put_resp.raise_for_status()

    return asset


def post_to_linkedin(
    token: str,
    text: str,
    image_paths: list[str] | None = None,
) -> dict:
    """Posts text (+ optional images) to the authenticated user's LinkedIn feed."""
    owner_urn = get_user_urn(token)
    person_urn = f"urn:li:person:{owner_urn}"

    media = []
    if image_paths:
        for path in image_paths:
            if Path(path).exists():
                asset = upload_image(token, owner_urn, path)
                media.append(
                    {
                        "status": "READY",
                        "description": {"text": ""},
                        "media": asset,
                        "title": {"text": ""},
                    }
                )

    if media:
        share_content = {
            "shareCommentary": {"text": text},
            "shareMediaCategory": "IMAGE",
            "media": media,
        }
    else:
        share_content = {
            "shareCommentary": {"text": text},
            "shareMediaCategory": "NONE",
        }

    payload = {
        "author": person_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": share_content
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        },
    }

    resp = requests.post(
        f"{LINKEDIN_API_BASE}/ugcPosts",
        json=payload,
        headers=_headers(token),
    )
    resp.raise_for_status()
    return resp.json()
