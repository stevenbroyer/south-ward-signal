"""FotMob fetcher — curl_cffi with Next.js data route bypass."""

import json
import re
import time
from pathlib import Path

from curl_cffi import requests as cffi_requests

from fotmob_config import (
    FOTMOB_BASE,
    MAX_RETRIES,
    MLS_LEAGUE_ID,
    REQUEST_DELAY_SECONDS,
    RETRY_BACKOFF,
)

_last_request_time = 0.0
_build_id: str | None = None


def _rate_limit():
    """Enforce minimum delay between requests."""
    global _last_request_time
    elapsed = time.time() - _last_request_time
    if elapsed < REQUEST_DELAY_SECONDS:
        time.sleep(REQUEST_DELAY_SECONDS - elapsed)
    _last_request_time = time.time()


def _fetch_with_retry(url: str) -> dict:
    """Fetch JSON with retry and exponential backoff."""
    for attempt in range(1, MAX_RETRIES + 1):
        _rate_limit()
        try:
            resp = cffi_requests.get(url, impersonate="chrome", timeout=30)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 403:
                print(f"  [403] Blocked on attempt {attempt}")
            else:
                print(f"  [HTTP {resp.status_code}] attempt {attempt}")
        except Exception as e:
            print(f"  [ERROR] attempt {attempt}: {e}")

        if attempt < MAX_RETRIES:
            backoff = RETRY_BACKOFF * (2 ** (attempt - 1))
            print(f"  Retrying in {backoff}s...")
            time.sleep(backoff)

    raise RuntimeError(f"Failed after {MAX_RETRIES} attempts: {url}")


def get_build_id() -> str:
    """Get the current Next.js build ID from FotMob homepage."""
    global _build_id
    if _build_id:
        return _build_id

    print("  [BUILD] Fetching FotMob build ID...")
    resp = cffi_requests.get("https://www.fotmob.com/", impersonate="chrome", timeout=30)
    match = re.search(r'"buildId":"([^"]+)"', resp.text)
    if not match:
        raise RuntimeError("Could not find buildId in FotMob homepage")
    _build_id = match.group(1)
    print(f"  [BUILD] Build ID: {_build_id}")
    return _build_id


def refresh_build_id() -> str:
    """Force refresh the build ID (needed after deploys)."""
    global _build_id
    _build_id = None
    return get_build_id()


def fetch_league_season(league_id: int, season: str) -> dict:
    """Fetch league data for a season — includes all match IDs."""
    url = f"{FOTMOB_BASE}/data/leagues?id={league_id}&season={season}"
    return _fetch_with_retry(url)


def fetch_match_details(page_url: str) -> dict:
    """
    Fetch full match details via Next.js _next/data route.
    page_url should be like: /matches/team-vs-team/slug#matchId
    Returns pageProps dict with general, content, header, etc.
    """
    build_id = get_build_id()

    # Parse: /matches/{slug}/{hash}#{matchId}
    clean_url = page_url.split("#")[0]
    parts = clean_url.split("/matches/")[-1].split("/")
    slug = parts[0] if len(parts) > 0 else ""
    hash_part = parts[1] if len(parts) > 1 else ""

    url = (
        f"https://www.fotmob.com/_next/data/{build_id}/matches/{slug}/{hash_part}.json"
        f"?matchUrl={slug}&matchUrl={hash_part}"
    )

    for attempt in range(1, MAX_RETRIES + 1):
        _rate_limit()
        try:
            resp = cffi_requests.get(url, impersonate="chrome", timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("pageProps", data)
            elif resp.status_code == 404:
                # Build ID may have changed (deploy happened)
                if attempt == 1:
                    print("  [404] Build ID may be stale, refreshing...")
                    build_id = refresh_build_id()
                    url = (
                        f"https://www.fotmob.com/_next/data/{build_id}/matches/{slug}/{hash_part}.json"
                        f"?matchUrl={slug}&matchUrl={hash_part}"
                    )
                    continue
                print(f"  [404] Match page not found: {page_url}")
                return {}
            elif resp.status_code == 403:
                print(f"  [403] Blocked on attempt {attempt}")
            else:
                print(f"  [HTTP {resp.status_code}] attempt {attempt}")
        except Exception as e:
            print(f"  [ERROR] attempt {attempt}: {e}")

        if attempt < MAX_RETRIES:
            backoff = RETRY_BACKOFF * (2 ** (attempt - 1))
            print(f"  Retrying in {backoff}s...")
            time.sleep(backoff)

    raise RuntimeError(f"Failed after {MAX_RETRIES} attempts: {page_url}")


def fetch_match_basic(match_id: int) -> dict:
    """Fetch basic match data (scores, status)."""
    url = f"{FOTMOB_BASE}/data/match?id={match_id}"
    return _fetch_with_retry(url)


def save_json(data: dict, filepath: Path):
    """Save JSON data to disk."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    filepath.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def load_json(filepath: Path) -> dict | None:
    """Load JSON data from disk, or None if not found."""
    if filepath.exists():
        return json.loads(filepath.read_text(encoding="utf-8"))
    return None
