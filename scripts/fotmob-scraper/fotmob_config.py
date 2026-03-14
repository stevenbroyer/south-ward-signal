"""FotMob scraper configuration — constants and season definitions."""

import os
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "fotmob"
PROGRESS_FILE = DATA_DIR / "_progress.json"

# ── FotMob API ────────────────────────────────────────────────────────────────

FOTMOB_BASE = "https://www.fotmob.com/api"

# New York Red Bulls — FotMob team ID (shown in league fixture data)
NYRB_FOTMOB_ID = 6514

# MLS league ID on FotMob
MLS_LEAGUE_ID = 130

# ── Seasons to scrape ─────────────────────────────────────────────────────────
# FotMob season IDs differ from calendar years. These map calendar year → FotMob
# season page ID. We'll discover match IDs from the league season page.

SEASONS = list(range(2015, 2027))  # 2015–2026 inclusive

# ── Rate limiting ─────────────────────────────────────────────────────────────

REQUEST_DELAY_SECONDS = 4  # seconds between requests
MAX_RETRIES = 3
RETRY_BACKOFF = 10  # seconds base for exponential backoff

# ── Team name normalization ───────────────────────────────────────────────────
# Maps FotMob team names → canonical DB names used in Supabase

TEAM_NAME_MAP: dict[str, str] = {
    "New York Red Bulls": "New York Red Bulls",
    "NY Red Bulls": "New York Red Bulls",
    "NYRB": "New York Red Bulls",
    "Atlanta United": "Atlanta United FC",
    "Atlanta United FC": "Atlanta United FC",
    "Austin": "Austin FC",
    "Austin FC": "Austin FC",
    "Charlotte": "Charlotte FC",
    "Charlotte FC": "Charlotte FC",
    "Chicago Fire": "Chicago Fire FC",
    "Chicago Fire FC": "Chicago Fire FC",
    "FC Cincinnati": "FC Cincinnati",
    "Cincinnati": "FC Cincinnati",
    "Colorado Rapids": "Colorado Rapids",
    "Columbus Crew": "Columbus Crew",
    "D.C. United": "D.C. United",
    "DC United": "D.C. United",
    "FC Dallas": "FC Dallas",
    "Houston Dynamo": "Houston Dynamo FC",
    "Houston Dynamo FC": "Houston Dynamo FC",
    "Inter Miami": "Inter Miami CF",
    "Inter Miami CF": "Inter Miami CF",
    "LA Galaxy": "LA Galaxy",
    "Los Angeles FC": "Los Angeles FC",
    "LAFC": "Los Angeles FC",
    "Minnesota United": "Minnesota United FC",
    "Minnesota United FC": "Minnesota United FC",
    "CF Montréal": "CF Montréal",
    "CF Montreal": "CF Montréal",
    "Montreal Impact": "CF Montréal",
    "Nashville SC": "Nashville SC",
    "Nashville": "Nashville SC",
    "New England Revolution": "New England Revolution",
    "New England Rev.": "New England Revolution",
    "New York City FC": "New York City FC",
    "NYCFC": "New York City FC",
    "Orlando City": "Orlando City SC",
    "Orlando City SC": "Orlando City SC",
    "Philadelphia Union": "Philadelphia Union",
    "Portland Timbers": "Portland Timbers",
    "Real Salt Lake": "Real Salt Lake",
    "San Jose Earthquakes": "San Jose Earthquakes",
    "SJ Earthquakes": "San Jose Earthquakes",
    "Seattle Sounders": "Seattle Sounders FC",
    "Seattle Sounders FC": "Seattle Sounders FC",
    "Sporting Kansas City": "Sporting Kansas City",
    "Sporting KC": "Sporting Kansas City",
    "St. Louis City": "St. Louis City SC",
    "St. Louis City SC": "St. Louis City SC",
    "St. Louis CITY SC": "St. Louis City SC",
    "Toronto FC": "Toronto FC",
    "Vancouver Whitecaps": "Vancouver Whitecaps FC",
    "Vancouver Whitecaps FC": "Vancouver Whitecaps FC",
}


def normalize_team(name: str) -> str:
    """Normalize a FotMob team name to our canonical DB name."""
    return TEAM_NAME_MAP.get(name, name)
