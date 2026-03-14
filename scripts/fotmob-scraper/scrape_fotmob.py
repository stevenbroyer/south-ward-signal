"""
South Ward Signal — FotMob Historical Scraper

Scrapes all NYRB matches from FotMob (2015–2026) and saves raw JSON
to data/fotmob/ for later ingestion by the TypeScript seeder.

Uses curl_cffi + Next.js _next/data route to bypass Cloudflare Turnstile.

Strategy:
  1. For each season, fetch the MLS league page to discover match IDs + pageUrls
  2. Filter to NYRB matches (home or away)
  3. For each match, fetch full match details via _next/data route
  4. Save raw JSON per match to data/fotmob/{season}/{matchId}.json
  5. Track progress for safe resume

Usage:
  cd scripts/fotmob-scraper
  pip install -r requirements.txt
  python scrape_fotmob.py
  python scrape_fotmob.py --season 2024
  python scrape_fotmob.py --match /matches/team-vs-team/slug#12345
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from fotmob_config import (
    DATA_DIR,
    MLS_LEAGUE_ID,
    NYRB_FOTMOB_ID,
    SEASONS,
)
from fotmob_fetcher import (
    fetch_league_season,
    fetch_match_details,
    get_build_id,
    load_json,
    save_json,
)
from progress_tracker import ProgressTracker


def discover_season_matches(season: int, tracker: ProgressTracker) -> list[dict]:
    """
    Discover all NYRB matches for a season.
    Returns list of dicts with keys: id, pageUrl, home, away, status.
    """
    cached = tracker.get_season_matches(season)
    if cached:
        print(f"  [CACHE] Season {season}: {len(cached)} matches from cache")
        # Cache stores match IDs; we need pageUrls too, so re-fetch if needed
        # But for resume we still know which IDs are done

    print(f"  [FETCH] Discovering matches for season {season}...")

    try:
        league_data = fetch_league_season(MLS_LEAGUE_ID, str(season))
    except RuntimeError as e:
        print(f"  [WARN] Could not fetch league page for {season}: {e}")
        return []

    all_matches = league_data.get("fixtures", {}).get("allMatches", [])
    if not all_matches:
        print(f"  [WARN] No matches found in league data for {season}")
        return []

    # Filter to NYRB matches
    nyrb_matches: list[dict] = []
    for m in all_matches:
        home = m.get("home", {})
        away = m.get("away", {})
        home_name = home.get("name", "")
        away_name = away.get("name", "")
        home_id = str(home.get("id", ""))
        away_id = str(away.get("id", ""))

        is_nyrb = (
            home_id == str(NYRB_FOTMOB_ID)
            or away_id == str(NYRB_FOTMOB_ID)
            or "Red Bull" in home_name
            or "Red Bull" in away_name
            # Also match by the team ID we found (6514)
            or home_id == "6514"
            or away_id == "6514"
        )

        if is_nyrb and m.get("status", {}).get("finished"):
            nyrb_matches.append(m)

    # Cache match IDs for resume
    match_ids = [int(m["id"]) for m in nyrb_matches if m.get("id")]
    tracker.set_season_matches(season, match_ids)

    print(f"  [LEAGUE] Season {season}: {len(nyrb_matches)} finished NYRB matches")
    return nyrb_matches


def scrape_match(match_info: dict, season: int, tracker: ProgressTracker) -> bool:
    """
    Scrape a single match and save to disk.
    Returns True if successful.
    """
    match_id = int(match_info["id"])
    page_url = match_info.get("pageUrl", "")

    # Skip if already scraped
    if tracker.is_scraped(match_id):
        return True

    # Check if JSON already on disk
    filepath = DATA_DIR / str(season) / f"{match_id}.json"
    if filepath.exists():
        tracker.mark_scraped(match_id)
        return True

    if not page_url:
        print(f"    [SKIP] {match_id}: no pageUrl")
        tracker.mark_failed(match_id)
        return False

    try:
        detail = fetch_match_details(page_url)

        if not detail or not detail.get("general", {}).get("matchId"):
            print(f"    [SKIP] {match_id}: empty response")
            tracker.mark_failed(match_id)
            return False

        save_json(detail, filepath)
        tracker.mark_scraped(match_id)

        gen = detail.get("general", {})
        home = gen.get("homeTeam", {}).get("name", "?")
        away = gen.get("awayTeam", {}).get("name", "?")
        content = detail.get("content", {})
        has_lineup = bool(content.get("lineup", {}).get("homeTeam"))
        has_shots = len(content.get("shotmap", {}).get("shots", []))
        has_momentum = bool(content.get("momentum"))
        has_stats = bool(content.get("stats"))

        print(
            f"    [OK] {match_id}: {home} vs {away} | "
            f"lineup={'Y' if has_lineup else 'N'} "
            f"shots={has_shots} "
            f"momentum={'Y' if has_momentum else 'N'} "
            f"stats={'Y' if has_stats else 'N'}"
        )
        return True

    except RuntimeError as e:
        print(f"    [FAIL] {match_id}: {e}")
        tracker.mark_failed(match_id)
        return False


def scrape_season(season: int, tracker: ProgressTracker):
    """Scrape all NYRB matches for a season."""
    print(f"\n{'='*60}")
    print(f"  SEASON {season}")
    print(f"{'='*60}")

    matches = discover_season_matches(season, tracker)
    if not matches:
        print(f"  No finished NYRB matches for season {season}")
        return

    remaining = [m for m in matches if not tracker.is_scraped(int(m["id"]))]
    print(f"  {len(remaining)} of {len(matches)} matches remaining\n")

    success = 0
    fail = 0
    for i, m in enumerate(remaining, 1):
        mid = m["id"]
        home = m.get("home", {}).get("shortName", "?")
        away = m.get("away", {}).get("shortName", "?")
        print(f"  [{i}/{len(remaining)}] {mid} ({home} vs {away})...")
        ok = scrape_match(m, season, tracker)
        if ok:
            success += 1
        else:
            fail += 1

    print(f"\n  Season {season} done: {success} scraped, {fail} failed")


def main():
    parser = argparse.ArgumentParser(description="Scrape FotMob NYRB match data")
    parser.add_argument("--season", type=int, help="Scrape a single season")
    parser.add_argument("--match", type=str, help="Scrape a single match by pageUrl")
    args = parser.parse_args()

    print("=" * 60)
    print("  South Ward Signal — FotMob Historical Scraper")
    print("  (curl_cffi + Next.js _next/data bypass)")
    print("=" * 60)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tracker = ProgressTracker()
    print(f"\n  Progress: {tracker.summary()}")

    # Pre-fetch build ID
    try:
        get_build_id()
    except RuntimeError as e:
        print(f"\n  [FATAL] Could not get build ID: {e}")
        sys.exit(1)

    if args.match:
        print(f"\n  Fetching single match: {args.match}")
        detail = fetch_match_details(args.match)
        if detail:
            mid = detail.get("general", {}).get("matchId", "unknown")
            date = detail.get("general", {}).get("matchTimeUTCDate", "")
            year = date[:4] if date else "0"
            filepath = DATA_DIR / year / f"{mid}.json"
            save_json(detail, filepath)
            print(f"  Saved to {filepath}")
        else:
            print(f"  Failed to fetch match")
    elif args.season:
        scrape_season(args.season, tracker)
    else:
        for season in SEASONS:
            scrape_season(season, tracker)

    print(f"\n{'='*60}")
    print(f"  FINAL: {tracker.summary()}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
