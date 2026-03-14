"""
South Ward Signal — FBref Historical Scraper

Scrapes NYRB match reports from FBref (2018–2025) and saves parsed JSON
to data/fbref/{season}/{match_id}.json for later ingestion by the TS seeder.

Uses Playwright (visible browser) to bypass Cloudflare. You solve the CAPTCHA
once at launch; the session persists for all subsequent page loads.

Strategy:
  1. Launch visible Chrome, navigate to FBref, wait for CF challenge
  2. For each season, fetch the NYRB schedule page to discover match report URLs
  3. For each match, fetch the report page and extract player stats + shots tables
  4. Save parsed JSON per match to data/fbref/{season}/{match_id}.json
  5. Track progress for safe resume

Rate limiting: 6 seconds between page loads (FBref enforces ~10 req/min).

Usage:
  cd scripts/fbref-scraper
  pip install -r requirements.txt
  python -m playwright install chromium
  python scrape_fbref.py
  python scrape_fbref.py --season 2024
  python scrape_fbref.py --dry-run
"""

import argparse
import json
import re
import sys
import time
from pathlib import Path

from bs4 import BeautifulSoup, Comment
from playwright.sync_api import sync_playwright, Page

# ── Config ────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "fbref"
PROGRESS_FILE = DATA_DIR / "_progress.json"

# NYRB FBref squad ID (consistent across all seasons)
NYRB_SQUAD_ID = "69a0fb10"
NYRB_SQUAD_NAME = "New-York-Red-Bulls"

# MLS competition ID on FBref
MLS_COMP_ID = "22"

# Seasons to scrape (FBref has MLS data from 2018 onward)
SEASONS = list(range(2018, 2026))

# Rate limiting
REQUEST_DELAY = 6  # seconds between page loads
MAX_RETRIES = 3
RETRY_BACKOFF = 15  # seconds base for exponential backoff

BASE_URL = "https://fbref.com"


# ── Team name normalization ───────────────────────────────────────────────────

TEAM_NAME_MAP = {
    "New York Red Bulls": "New York Red Bulls",
    "NY Red Bulls": "New York Red Bulls",
    "Atlanta United": "Atlanta United FC",
    "Atlanta United FC": "Atlanta United FC",
    "Austin FC": "Austin FC",
    "Charlotte FC": "Charlotte FC",
    "Chicago Fire": "Chicago Fire FC",
    "Chicago Fire FC": "Chicago Fire FC",
    "FC Cincinnati": "FC Cincinnati",
    "Cincinnati": "FC Cincinnati",
    "Colorado Rapids": "Colorado Rapids",
    "Columbus Crew": "Columbus Crew",
    "Columbus Crew SC": "Columbus Crew",
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
    "Chivas USA": "Chivas USA",
}


def normalize_team(name: str) -> str:
    return TEAM_NAME_MAP.get(name, name)


# ── Playwright browser helpers ────────────────────────────────────────────────

_last_request_time = 0.0


def rate_limit():
    global _last_request_time
    now = time.time()
    elapsed = now - _last_request_time
    if elapsed < REQUEST_DELAY:
        time.sleep(REQUEST_DELAY - elapsed)
    _last_request_time = time.time()


def wait_for_cf(page: Page, timeout: int = 120):
    """Wait for Cloudflare challenge to resolve. User may need to click CAPTCHA."""
    start = time.time()
    while time.time() - start < timeout:
        title = page.title()
        if "Just a moment" not in title:
            return True
        time.sleep(2)
    return False


def fetch_page_pw(page: Page, url: str) -> BeautifulSoup:
    """Navigate to URL with rate limiting, CF handling, and retries."""
    for attempt in range(MAX_RETRIES):
        rate_limit()
        try:
            page.goto(url, timeout=45000)
        except Exception:
            pass  # timeout is ok, we check content below

        # Wait for CF if needed
        if "Just a moment" in page.title():
            print(f"    [CF] Cloudflare challenge — solve in the browser window...")
            if not wait_for_cf(page, timeout=120):
                if attempt < MAX_RETRIES - 1:
                    print(f"    [RETRY] CF timeout, attempt {attempt + 2}/{MAX_RETRIES}")
                    continue
                raise RuntimeError("Cloudflare challenge not solved within timeout")

        # Check for 429 rate limit page
        content = page.content()
        if "429" in page.title() or "Too Many Requests" in content[:500]:
            wait = RETRY_BACKOFF * (2**attempt)
            print(f"    [429] Rate limited, waiting {wait}s...")
            time.sleep(wait)
            continue

        # Check we got real content (has data-stat attributes = FBref page)
        if 'data-stat' in content or 'FBref' in content:
            return BeautifulSoup(content, "lxml")

        # Might be a soft error or redirect
        if attempt < MAX_RETRIES - 1:
            wait = RETRY_BACKOFF * (2**attempt)
            print(f"    [RETRY] No FBref content, waiting {wait}s...")
            time.sleep(wait)
        else:
            # Return what we have and let the caller handle it
            return BeautifulSoup(content, "lxml")

    raise RuntimeError(f"Failed to fetch {url}")


# ── Progress tracker ──────────────────────────────────────────────────────────


class ProgressTracker:
    def __init__(self):
        self.data = {"scraped": [], "failed": [], "seasons": {}}
        if PROGRESS_FILE.exists():
            self.data = json.loads(PROGRESS_FILE.read_text("utf-8"))

    def save(self):
        PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
        PROGRESS_FILE.write_text(json.dumps(self.data, indent=2), "utf-8")

    def is_scraped(self, match_id: str) -> bool:
        return match_id in self.data["scraped"]

    def mark_scraped(self, match_id: str):
        if match_id not in self.data["scraped"]:
            self.data["scraped"].append(match_id)
            self.save()

    def mark_failed(self, match_id: str):
        if match_id not in self.data["failed"]:
            self.data["failed"].append(match_id)
            self.save()

    def set_season_urls(self, season: int, urls: list):
        self.data["seasons"][str(season)] = urls
        self.save()

    def get_season_urls(self, season: int) -> list | None:
        return self.data["seasons"].get(str(season))

    def summary(self) -> str:
        return f"{len(self.data['scraped'])} scraped, {len(self.data['failed'])} failed"


# ── Discover match URLs from schedule page ────────────────────────────────────


def discover_season_matches(
    season: int, tracker: ProgressTracker, page: Page
) -> list[dict]:
    """
    Fetch the NYRB schedule/matchlogs page and extract match report URLs.
    Returns list of dicts: {match_id, url, date, home_team, away_team, score}.
    """
    cached = tracker.get_season_urls(season)
    if cached:
        print(f"  [CACHE] Season {season}: {len(cached)} matches from cache")
        return cached

    url = f"{BASE_URL}/en/squads/{NYRB_SQUAD_ID}/{season}/matchlogs/c{MLS_COMP_ID}/schedule/{NYRB_SQUAD_NAME}-Scores-and-Fixtures-Major-League-Soccer"
    print(f"  [FETCH] Schedule page for {season}...")

    try:
        soup = fetch_page_pw(page, url)
    except RuntimeError as e:
        print(f"  [WARN] Could not fetch schedule for {season}: {e}")
        return []

    # The schedule table has id="matchlogs_for"
    table = soup.find("table", id="matchlogs_for")
    if not table:
        # Try without the slug suffix
        alt_url = f"{BASE_URL}/en/squads/{NYRB_SQUAD_ID}/{season}/matchlogs/c{MLS_COMP_ID}/schedule/"
        print(f"  [RETRY] Trying shorter URL...")
        try:
            soup = fetch_page_pw(page, alt_url)
        except RuntimeError as e:
            print(f"  [WARN] Could not fetch alt schedule for {season}: {e}")
            return []
        table = soup.find("table", id="matchlogs_for")
        if not table:
            print(f"  [WARN] No schedule table found for {season}")
            return []

    tbody = table.find("tbody")
    if not tbody:
        print(f"  [WARN] No table body found for {season}")
        return []

    matches = []
    for row in tbody.find_all("tr"):
        if row.get("class") and "spacer" in row.get("class", []):
            continue
        if row.find("th", {"scope": "col"}):
            continue

        date_cell = row.find("th", {"data-stat": "date"})
        if not date_cell:
            continue
        date_str = date_cell.get_text(strip=True)
        if not date_str or not re.match(r"\d{4}-\d{2}-\d{2}", date_str):
            continue

        venue_cell = row.find("td", {"data-stat": "venue"})
        venue = venue_cell.get_text(strip=True) if venue_cell else ""

        opp_cell = row.find("td", {"data-stat": "opponent"})
        opponent = opp_cell.get_text(strip=True) if opp_cell else ""

        result_cell = row.find("td", {"data-stat": "result"})
        result = result_cell.get_text(strip=True) if result_cell else ""

        gf_cell = row.find("td", {"data-stat": "goals_for"})
        ga_cell = row.find("td", {"data-stat": "goals_against"})
        gf = gf_cell.get_text(strip=True) if gf_cell else ""
        ga = ga_cell.get_text(strip=True) if ga_cell else ""

        report_cell = row.find("td", {"data-stat": "match_report"})
        if not report_cell:
            continue
        report_link = report_cell.find("a")
        if not report_link or "Match Report" not in report_link.get_text():
            continue
        report_url = report_link.get("href", "")
        if not report_url:
            continue

        match_id_match = re.search(r"/matches/([a-f0-9]+)/", report_url)
        if not match_id_match:
            continue
        match_id = match_id_match.group(1)

        if venue == "Home":
            home_team = "New York Red Bulls"
            away_team = normalize_team(opponent)
        else:
            home_team = normalize_team(opponent)
            away_team = "New York Red Bulls"

        home_score = None
        away_score = None
        if gf and ga:
            try:
                nyrb_goals = int(gf)
                opp_goals = int(ga)
                if venue == "Home":
                    home_score = nyrb_goals
                    away_score = opp_goals
                else:
                    home_score = opp_goals
                    away_score = nyrb_goals
            except ValueError:
                pass

        matches.append(
            {
                "match_id": match_id,
                "url": report_url,
                "date": date_str,
                "home_team": home_team,
                "away_team": away_team,
                "home_score": home_score,
                "away_score": away_score,
                "result": result,
            }
        )

    tracker.set_season_urls(season, matches)
    print(f"  [SCHEDULE] Season {season}: {len(matches)} matches with reports")
    return matches


# ── Parse match report page ───────────────────────────────────────────────────


def safe_float(val: str) -> float | None:
    if not val or val.strip() == "":
        return None
    try:
        return float(val)
    except ValueError:
        return None


def safe_int(val: str) -> int | None:
    if not val or val.strip() == "":
        return None
    try:
        return int(val)
    except ValueError:
        return None


def find_commented_tables(soup: BeautifulSoup) -> dict[str, BeautifulSoup]:
    """
    FBref wraps most stat tables in HTML comments for lazy loading.
    Extract them and return a dict of table_id -> parsed table soup.
    """
    tables = {}

    for table in soup.find_all("table"):
        tid = table.get("id", "")
        if tid:
            tables[tid] = table

    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        if "<table" in comment:
            comment_soup = BeautifulSoup(comment, "lxml")
            for table in comment_soup.find_all("table"):
                tid = table.get("id", "")
                if tid:
                    tables[tid] = table

    return tables


def extract_team_ids(soup: BeautifulSoup) -> tuple[str, str, str, str]:
    """
    Extract home and away team FBref IDs and names from the scorebox.
    Returns: (home_id, home_name, away_id, away_name)
    """
    scorebox = soup.find("div", class_="scorebox")
    if not scorebox:
        return ("", "", "", "")

    teams = scorebox.find_all("div", recursive=False)
    if len(teams) < 2:
        return ("", "", "", "")

    home_name = ""
    away_name = ""
    home_id = ""
    away_id = ""

    home_link = teams[0].find("a", href=re.compile(r"/squads/"))
    if home_link:
        home_name = home_link.get_text(strip=True)
        id_match = re.search(r"/squads/([a-f0-9]+)/", home_link["href"])
        if id_match:
            home_id = id_match.group(1)

    away_link = teams[1].find("a", href=re.compile(r"/squads/"))
    if away_link:
        away_name = away_link.get_text(strip=True)
        id_match = re.search(r"/squads/([a-f0-9]+)/", away_link["href"])
        if id_match:
            away_id = id_match.group(1)

    return (home_id, home_name, away_id, away_name)


def extract_team_xg(soup: BeautifulSoup) -> tuple[float | None, float | None]:
    scorebox = soup.find("div", class_="scorebox")
    if not scorebox:
        return (None, None)

    xg_divs = scorebox.find_all("div", class_="score_xg")

    home_xg = None
    away_xg = None

    if len(xg_divs) >= 2:
        home_xg = safe_float(xg_divs[0].get_text(strip=True))
        away_xg = safe_float(xg_divs[1].get_text(strip=True))

    return (home_xg, away_xg)


def extract_score(soup: BeautifulSoup) -> tuple[int | None, int | None]:
    scorebox = soup.find("div", class_="scorebox")
    if not scorebox:
        return (None, None)

    scores = scorebox.find_all("div", class_="score")
    if len(scores) >= 2:
        return (
            safe_int(scores[0].get_text(strip=True)),
            safe_int(scores[1].get_text(strip=True)),
        )
    return (None, None)


def parse_player_table(table, team_name: str, is_home: bool) -> list[dict]:
    if not table:
        return []

    tbody = table.find("tbody")
    if not tbody:
        return []

    players = []
    for row in tbody.find_all("tr"):
        if row.get("class") and (
            "spacer" in row.get("class", []) or "thead" in row.get("class", [])
        ):
            continue

        th = row.find("th", {"data-stat": "player"})
        if not th:
            continue
        player_link = th.find("a")
        player_name = (
            player_link.get_text(strip=True) if player_link else th.get_text(strip=True)
        )
        if not player_name or player_name.lower() in ("", "player"):
            continue

        stats = {"name": player_name, "team": team_name, "is_home": is_home}
        for cell in row.find_all("td"):
            stat_name = cell.get("data-stat", "")
            val = cell.get_text(strip=True)
            if stat_name and val:
                stats[stat_name] = val

        if player_link:
            href = player_link.get("href", "")
            pid_match = re.search(r"/players/([a-f0-9]+)/", href)
            if pid_match:
                stats["fbref_player_id"] = pid_match.group(1)

        players.append(stats)

    return players


def merge_player_stats(all_tables_data: list[list[dict]]) -> dict[str, dict]:
    merged: dict[str, dict] = {}

    for table_data in all_tables_data:
        for player in table_data:
            name = player["name"]
            if name not in merged:
                merged[name] = {
                    "name": name,
                    "team": player.get("team", ""),
                    "is_home": player.get("is_home", False),
                }
            for key, val in player.items():
                if key in ("name", "team", "is_home"):
                    continue
                if key not in merged[name] or not merged[name][key]:
                    merged[name][key] = val

    return merged


def build_player_record(raw: dict) -> dict:
    minutes = safe_int(raw.get("minutes", "0")) or 0

    goals = safe_int(raw.get("goals", "0")) or 0
    assists = safe_int(raw.get("assists", "0")) or 0
    shots_total = safe_int(raw.get("shots", raw.get("shots_total", "0"))) or 0
    sot = safe_int(raw.get("shots_on_target", "0")) or 0
    xg = safe_float(raw.get("xg", ""))
    xa = safe_float(raw.get("xg_assist", raw.get("xa", "")))

    passes_completed = safe_int(raw.get("passes_completed", "0")) or 0
    passes_attempted = safe_int(raw.get("passes", "0")) or 0
    pass_pct = safe_float(raw.get("passes_pct", ""))
    if pass_pct is None and passes_attempted > 0 and passes_completed > 0:
        pass_pct = round((passes_completed / passes_attempted) * 100, 1)

    # FBref summary table uses "tackles_won" not "tackles"
    tackles = safe_int(raw.get("tackles_won", raw.get("tackles", "0"))) or 0
    interceptions = safe_int(raw.get("interceptions", "0")) or 0
    blocks = safe_int(raw.get("blocks", "0")) or 0
    clearances = safe_int(raw.get("clearances", "0")) or 0

    touches = safe_int(raw.get("touches", "0")) or 0
    dribbles_succeeded = (
        safe_int(raw.get("take_ons_won", raw.get("dribbles_completed", "0"))) or 0
    )
    dribbles_attempted = (
        safe_int(raw.get("take_ons", raw.get("dribbles", "0"))) or 0
    )

    fouls = safe_int(raw.get("fouls", "0")) or 0
    yellows = safe_int(raw.get("cards_yellow", "0")) or 0
    reds = safe_int(raw.get("cards_red", "0")) or 0
    aerials_won = safe_int(raw.get("aerials_won", "0")) or 0
    aerials_lost = safe_int(raw.get("aerials_lost", "0")) or 0
    aerials_total = aerials_won + aerials_lost

    key_passes = (
        safe_int(raw.get("assisted_shots", raw.get("key_passes", "0"))) or 0
    )
    saves = safe_int(raw.get("gk_saves", raw.get("saves", "0"))) or 0

    # Crosses available from summary table
    crosses = safe_int(raw.get("crosses", "0")) or 0

    position = raw.get("position", "")
    shirt_number = safe_int(raw.get("shirtnumber", ""))

    return {
        "name": raw["name"],
        "team": normalize_team(raw.get("team", "")),
        "is_home": raw.get("is_home", False),
        "position": position or None,
        "shirt_number": shirt_number,
        "minutes": minutes,
        "goals": goals,
        "assists": assists,
        "shots": shots_total,
        "shots_on_target": sot,
        "xg": xg,
        "xa": xa,
        "passes": passes_attempted if passes_attempted > 0 else passes_completed,
        "pass_accuracy": pass_pct,
        "tackles": tackles,
        "interceptions": interceptions,
        "blocks": blocks,
        "clearances": clearances,
        "touches": touches,
        "dribbles_attempted": dribbles_attempted,
        "dribbles_succeeded": dribbles_succeeded,
        "fouls": fouls,
        "yellows": yellows,
        "reds": reds,
        "aerials_won": aerials_won,
        "aerials_total": aerials_total,
        "key_passes": key_passes,
        "saves": saves,
        "crosses": crosses,
        "fbref_player_id": raw.get("fbref_player_id", None),
    }


def determine_starters(players: list[dict], table, team_name: str) -> list[dict]:
    """
    Mark players as starters or subs based on position in the summary table.
    FBref lists starters first, then a spacer row, then subs.
    """
    if not table:
        return players

    tbody = table.find("tbody")
    if not tbody:
        return players

    starter_names = set()
    found_spacer = False

    for row in tbody.find_all("tr"):
        classes = row.get("class", [])
        if "spacer" in classes or "thead" in classes:
            found_spacer = True
            continue

        th = row.find("th", {"data-stat": "player"})
        if not th:
            continue
        player_link = th.find("a")
        name = (
            player_link.get_text(strip=True) if player_link else th.get_text(strip=True)
        )

        if not found_spacer and name:
            starter_names.add(name)

    for p in players:
        if normalize_team(p.get("team", "")) == normalize_team(team_name):
            p["is_starter"] = p["name"] in starter_names

    return players


def extract_shots_table(tables: dict) -> list[dict]:
    shots_table = tables.get("shots_all")
    if not shots_table:
        return []

    tbody = shots_table.find("tbody")
    if not tbody:
        return []

    shots = []
    for row in tbody.find_all("tr"):
        classes = row.get("class", [])
        if "spacer" in classes or "thead" in classes:
            continue

        th = row.find("th")
        if th and "spacer" in (th.get("class") or []):
            continue

        minute_cell = row.find("th", {"data-stat": "minute"})
        minute = safe_int(minute_cell.get_text(strip=True)) if minute_cell else None

        player_cell = row.find("td", {"data-stat": "player"})
        player_name = ""
        if player_cell:
            link = player_cell.find("a")
            player_name = (
                link.get_text(strip=True) if link else player_cell.get_text(strip=True)
            )

        team_cell = row.find("td", {"data-stat": "team"})
        team_name = ""
        if team_cell:
            link = team_cell.find("a")
            team_name = (
                link.get_text(strip=True) if link else team_cell.get_text(strip=True)
            )

        xg_cell = row.find("td", {"data-stat": "xg_shot"})
        xg = safe_float(xg_cell.get_text(strip=True)) if xg_cell else None

        outcome_cell = row.find("td", {"data-stat": "outcome"})
        outcome_raw = outcome_cell.get_text(strip=True) if outcome_cell else ""

        distance_cell = row.find("td", {"data-stat": "distance"})
        distance = safe_int(distance_cell.get_text(strip=True)) if distance_cell else None

        body_part_cell = row.find("td", {"data-stat": "body_part"})
        body_part = body_part_cell.get_text(strip=True) if body_part_cell else None

        outcome = "off_target"
        ol = outcome_raw.lower()
        if ol in ("goal",):
            outcome = "goal"
        elif ol in ("saved", "saved to post"):
            outcome = "saved"
        elif ol in ("blocked",):
            outcome = "blocked"

        if player_name:
            shots.append(
                {
                    "minute": minute,
                    "player": player_name,
                    "team": normalize_team(team_name),
                    "xg": xg,
                    "outcome": outcome,
                    "distance": distance,
                    "body_part": body_part,
                }
            )

    return shots


def parse_match_report(page: Page, url: str, match_info: dict) -> dict | None:
    """Fetch and parse a single FBref match report page."""
    full_url = f"{BASE_URL}{url}" if url.startswith("/") else url

    try:
        soup = fetch_page_pw(page, full_url)
    except RuntimeError as e:
        print(f"    [FAIL] {e}")
        return None

    home_id, home_name, away_id, away_name = extract_team_ids(soup)

    if not home_name:
        home_name = match_info.get("home_team", "Unknown")
    if not away_name:
        away_name = match_info.get("away_team", "Unknown")

    home_score, away_score = extract_score(soup)
    home_xg, away_xg = extract_team_xg(soup)

    if home_score is None:
        home_score = match_info.get("home_score")
    if away_score is None:
        away_score = match_info.get("away_score")

    tables = find_commented_tables(soup)

    stat_types = [
        "summary",
        "passing",
        "passing_types",
        "defense",
        "possession",
        "misc",
        "keeper",
    ]

    home_players_by_table = []
    away_players_by_table = []

    for stat_type in stat_types:
        home_table = tables.get(f"stats_{home_id}_{stat_type}")
        away_table = tables.get(f"stats_{away_id}_{stat_type}")

        if home_table:
            home_players_by_table.append(
                parse_player_table(home_table, normalize_team(home_name), True)
            )
        if away_table:
            away_players_by_table.append(
                parse_player_table(away_table, normalize_team(away_name), False)
            )

    home_merged = merge_player_stats(home_players_by_table)
    away_merged = merge_player_stats(away_players_by_table)

    all_players = []
    for raw in home_merged.values():
        all_players.append(build_player_record(raw))
    for raw in away_merged.values():
        all_players.append(build_player_record(raw))

    home_summary = tables.get(f"stats_{home_id}_summary")
    away_summary = tables.get(f"stats_{away_id}_summary")
    all_players = determine_starters(all_players, home_summary, home_name)
    all_players = determine_starters(all_players, away_summary, away_name)

    shots = extract_shots_table(tables)

    return {
        "match_id": match_info["match_id"],
        "date": match_info["date"],
        "home_team": normalize_team(home_name),
        "away_team": normalize_team(away_name),
        "home_score": home_score,
        "away_score": away_score,
        "home_xg": home_xg,
        "away_xg": away_xg,
        "players": all_players,
        "shots": shots,
        "data_source": "fbref",
    }


# ── Main ──────────────────────────────────────────────────────────────────────


def scrape_season(
    season: int, tracker: ProgressTracker, page: Page, dry_run: bool = False
):
    print(f"\n{'='*60}")
    print(f"  SEASON {season}")
    print(f"{'='*60}")

    matches = discover_season_matches(season, tracker, page)
    if not matches:
        print(f"  No matches found for season {season}")
        return

    remaining = [m for m in matches if not tracker.is_scraped(m["match_id"])]
    print(f"  {len(remaining)} of {len(matches)} matches remaining\n")

    success = 0
    fail = 0
    for i, match_info in enumerate(remaining, 1):
        mid = match_info["match_id"]
        home = match_info.get("home_team", "?")
        away = match_info.get("away_team", "?")
        date = match_info.get("date", "")
        print(f"  [{i}/{len(remaining)}] {date} {home} vs {away} ({mid})...")

        filepath = DATA_DIR / str(season) / f"{mid}.json"
        if filepath.exists():
            tracker.mark_scraped(mid)
            print(f"    [SKIP] Already on disk")
            success += 1
            continue

        if dry_run:
            print(f"    [DRY RUN] Would scrape {match_info['url']}")
            continue

        result = parse_match_report(page, match_info["url"], match_info)
        if result and len(result.get("players", [])) > 0:
            filepath.parent.mkdir(parents=True, exist_ok=True)
            filepath.write_text(
                json.dumps(result, indent=2, ensure_ascii=False), "utf-8"
            )
            tracker.mark_scraped(mid)

            n_players = len(result.get("players", []))
            n_shots = len(result.get("shots", []))
            print(f"    [OK] {n_players} players, {n_shots} shots")
            success += 1
        else:
            tracker.mark_failed(mid)
            n_p = len(result.get("players", [])) if result else 0
            print(f"    [FAIL] No player data extracted (got {n_p} players)")
            fail += 1

    print(f"\n  Season {season} done: {success} scraped, {fail} failed")


def main():
    parser = argparse.ArgumentParser(description="Scrape FBref NYRB match data")
    parser.add_argument("--season", type=int, help="Scrape a single season")
    parser.add_argument("--dry-run", action="store_true", help="Preview without scraping")
    args = parser.parse_args()

    print("=" * 60)
    print("  South Ward Signal — FBref Historical Scraper")
    print("  (Playwright browser + BeautifulSoup, 6s rate limit)")
    print("=" * 60)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tracker = ProgressTracker()
    print(f"\n  Progress: {tracker.summary()}")

    print("\n  Launching browser (system Chrome with persistent profile)...")
    print("  >> When the Cloudflare challenge appears, solve it in the browser window.")
    print("  >> The scraper will continue automatically once you pass the challenge.\n")

    # Use persistent profile so CF cookies survive across runs
    profile_dir = DATA_DIR / "_browser_profile"
    profile_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            str(profile_dir),
            headless=False,
            channel="chrome",  # Use system Chrome
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = context.pages[0] if context.pages else context.new_page()

        # Initial navigation to trigger CF challenge once
        print("  [INIT] Navigating to FBref to trigger Cloudflare challenge...")
        try:
            page.goto(f"{BASE_URL}/en/comps/22/Major-League-Soccer-Stats", timeout=45000)
        except Exception:
            pass

        if "Just a moment" in page.title():
            print("  [CF] Please solve the Cloudflare challenge in the browser window...")
            print("  [CF] You have 5 minutes. Click the checkbox if one appears.")
            if not wait_for_cf(page, timeout=300):
                print("  [FATAL] Cloudflare challenge not solved. Exiting.")
                context.close()
                sys.exit(1)

        print("  [OK] Cloudflare challenge passed! Starting scrape...\n")

        if args.season:
            if args.season < 2018 or args.season > 2025:
                print(
                    f"  [ERROR] FBref only has MLS data from 2018 onward. Got: {args.season}"
                )
                browser.close()
                sys.exit(1)
            scrape_season(args.season, tracker, page, dry_run=args.dry_run)
        else:
            for season in SEASONS:
                scrape_season(season, tracker, page, dry_run=args.dry_run)

        print(f"\n{'='*60}")
        print(f"  FINAL: {tracker.summary()}")
        print(f"{'='*60}")

        context.close()


if __name__ == "__main__":
    main()
