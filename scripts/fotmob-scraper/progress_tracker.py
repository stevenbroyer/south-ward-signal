"""Progress tracker — resume-safe tracking of scraped match IDs."""

import json
from pathlib import Path

from fotmob_config import PROGRESS_FILE


class ProgressTracker:
    """Tracks which matches have been successfully scraped for resume support."""

    def __init__(self, filepath: Path = PROGRESS_FILE):
        self.filepath = filepath
        self._data: dict = {"scraped_matches": [], "failed_matches": [], "seasons_discovered": {}}
        self._load()

    def _load(self):
        if self.filepath.exists():
            self._data = json.loads(self.filepath.read_text(encoding="utf-8"))

    def _save(self):
        self.filepath.parent.mkdir(parents=True, exist_ok=True)
        self.filepath.write_text(
            json.dumps(self._data, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    def is_scraped(self, match_id: int) -> bool:
        return match_id in self._data["scraped_matches"]

    def mark_scraped(self, match_id: int):
        if match_id not in self._data["scraped_matches"]:
            self._data["scraped_matches"].append(match_id)
            # Remove from failed if it was there
            if match_id in self._data["failed_matches"]:
                self._data["failed_matches"].remove(match_id)
            self._save()

    def mark_failed(self, match_id: int):
        if match_id not in self._data["failed_matches"]:
            self._data["failed_matches"].append(match_id)
            self._save()

    def set_season_matches(self, season: int, match_ids: list[int]):
        self._data["seasons_discovered"][str(season)] = match_ids
        self._save()

    def get_season_matches(self, season: int) -> list[int] | None:
        return self._data["seasons_discovered"].get(str(season))

    @property
    def total_scraped(self) -> int:
        return len(self._data["scraped_matches"])

    @property
    def total_failed(self) -> int:
        return len(self._data["failed_matches"])

    def summary(self) -> str:
        return (
            f"Scraped: {self.total_scraped} | "
            f"Failed: {self.total_failed} | "
            f"Seasons discovered: {len(self._data['seasons_discovered'])}"
        )
