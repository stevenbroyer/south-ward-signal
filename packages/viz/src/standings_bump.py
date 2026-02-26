"""
South Ward Signal — Standings Bump Chart.

Visualizes league position changes across match weeks as a
"bumpy chart" — each team's position plotted week-by-week with
connecting lines.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

from .style import (
    BRAND,
    NYRB_COLORS,
    apply_brand_style,
    create_figure,
    add_watermark,
    add_title_block,
    add_footer,
    save_figure,
)


# ── MLS Eastern Conference teams and default colors ──────────────────────────

TEAM_COLORS: dict[str, str] = {
    "New York Red Bulls": "#ED1A3D",
    "NYRB": "#ED1A3D",
    "Inter Miami": "#F7B5CD",
    "FC Cincinnati": "#F05323",
    "Columbus Crew": "#FEDD00",
    "Charlotte FC": "#1A85C8",
    "Orlando City": "#633492",
    "Nashville SC": "#ECE83A",
    "Philadelphia Union": "#071B2C",
    "Atlanta United": "#A29061",
    "New York City FC": "#6CACE4",
    "NYCFC": "#6CACE4",
    "CF Montreal": "#00529B",
    "Toronto FC": "#E31937",
    "D.C. United": "#000000",
    "Chicago Fire": "#141B4D",
    "New England Revolution": "#0A2240",
}


def _get_team_color(team: str) -> str:
    """Get color for a team, falling back to gray."""
    for key, color in TEAM_COLORS.items():
        if key.lower() in team.lower() or team.lower() in key.lower():
            return color
    return BRAND["gray"]


def _is_nyrb(team: str) -> bool:
    return any(k in team for k in ("Red Bull", "NYRB", "RBNY"))


def generate_standings_bump(
    standings_history: list[dict[str, Any]],
    output_dir: str | Path,
    conference: str = "Eastern",
    highlight_team: str = "New York Red Bulls",
) -> Path:
    """Generate a bump chart of league standings over match weeks.

    Args:
        standings_history: List of weekly snapshots, each containing:
            - ``week``: int match week number.
            - ``standings``: list of dicts with ``team`` and ``position``.
        output_dir: Directory to write PNG.
        conference: Conference label for the title.
        highlight_team: Team to visually emphasize.

    Returns:
        Output file path.
    """
    apply_brand_style()
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not standings_history:
        fig, ax = create_figure(1600, 900)
        add_title_block(fig, "Standings — No Data", "")
        add_watermark(fig)
        return save_figure(fig, output_dir / "standings_bump_empty.png")

    # ── Parse data ───────────────────────────────────────────────────────
    weeks = sorted(set(s["week"] for s in standings_history))
    all_teams: set[str] = set()
    team_positions: dict[str, dict[int, int]] = {}

    for snapshot in standings_history:
        week = snapshot["week"]
        for entry in snapshot.get("standings", []):
            team = entry["team"]
            pos = entry["position"]
            all_teams.add(team)
            if team not in team_positions:
                team_positions[team] = {}
            team_positions[team][week] = pos

    num_teams = len(all_teams)
    if num_teams == 0:
        fig, ax = create_figure(1600, 900)
        add_title_block(fig, "Standings — No Teams", "")
        add_watermark(fig)
        return save_figure(fig, output_dir / "standings_bump_empty.png")

    # ── Create figure ────────────────────────────────────────────────────
    fig_height = max(900, num_teams * 45)
    fig, ax = create_figure(1600, fig_height)

    # ── Plot each team ───────────────────────────────────────────────────
    for team in sorted(all_teams):
        positions = team_positions[team]
        team_weeks = sorted(positions.keys())
        team_pos = [positions[w] for w in team_weeks]

        is_highlight = highlight_team.lower() in team.lower() or _is_nyrb(team)
        color = _get_team_color(team)

        linewidth = 3.5 if is_highlight else 1.2
        alpha = 1.0 if is_highlight else 0.35
        zorder = 10 if is_highlight else 3
        marker_size = 80 if is_highlight else 25

        ax.plot(
            team_weeks, team_pos,
            color=color,
            linewidth=linewidth,
            alpha=alpha,
            zorder=zorder,
            solid_capstyle="round",
        )

        ax.scatter(
            team_weeks, team_pos,
            s=marker_size,
            color=color,
            edgecolors=BRAND["white"] if is_highlight else "none",
            linewidth=1 if is_highlight else 0,
            alpha=alpha,
            zorder=zorder + 1,
        )

        # Label at the end of the line
        if team_weeks:
            last_week = team_weeks[-1]
            last_pos = team_pos[-1]
            fontweight = "bold" if is_highlight else "normal"
            fontsize = 9 if is_highlight else 7

            # Abbreviate team name for label
            short = team.replace("New York ", "NY ").replace(" FC", "").replace(" SC", "")
            if len(short) > 15:
                short = short[:15]

            ax.text(
                last_week + 0.3,
                last_pos,
                short,
                fontsize=fontsize,
                fontweight=fontweight,
                color=color if is_highlight else BRAND["gray_light"],
                va="center",
                ha="left",
                alpha=min(alpha + 0.2, 1.0),
                zorder=zorder + 2,
            )

    # ── Axes ─────────────────────────────────────────────────────────────
    ax.set_xlim(min(weeks) - 0.5, max(weeks) + 3)
    ax.set_ylim(num_teams + 0.5, 0.5)  # Inverted: 1st place at top
    ax.set_xlabel("Match Week", fontsize=10, color=BRAND["gray"])
    ax.set_ylabel("Position", fontsize=10, color=BRAND["gray"])
    ax.set_xticks(weeks)
    ax.set_yticks(range(1, num_teams + 1))

    ax.grid(axis="x", alpha=0.15)
    ax.grid(axis="y", alpha=0.1)

    # Highlight zones
    # Playoff line (top 9 in MLS)
    playoff_line = min(9, num_teams)
    ax.axhline(
        y=playoff_line + 0.5,
        color=BRAND["success"],
        linewidth=1,
        linestyle="--",
        alpha=0.4,
    )
    ax.text(
        min(weeks) - 0.3,
        playoff_line + 0.5,
        "Playoff Line",
        fontsize=7,
        color=BRAND["success"],
        alpha=0.6,
        va="center",
        ha="right",
    )

    # ── Title ────────────────────────────────────────────────────────────
    week_range = f"Weeks {min(weeks)}–{max(weeks)}"
    year = "2026"
    title = f"MLS {conference} Conference Standings"
    subtitle = f"{year} Season  |  {week_range}"

    add_title_block(fig, title, subtitle)
    add_watermark(fig)
    add_footer(fig)

    filename = f"standings_bump_{conference.lower()}.png"
    return save_figure(fig, output_dir / filename)


def generate_from_file(data_path: str | Path, output_dir: str | Path) -> Path:
    """Convenience wrapper that loads JSON from disk."""
    data = json.loads(Path(data_path).read_text(encoding="utf-8"))
    history = data if isinstance(data, list) else data.get("history", [])
    conference = data.get("conference", "Eastern") if isinstance(data, dict) else "Eastern"
    return generate_standings_bump(history, output_dir, conference=conference)
