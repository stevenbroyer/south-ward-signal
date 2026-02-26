"""
South Ward Signal — Shot Map Visualization.

Renders shot locations on a football pitch, sized by xG and colored
by outcome (goal / saved / blocked / off-target).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
from mplsoccer import VerticalPitch

from .style import (
    BRAND,
    NYRB_COLORS,
    OPPONENT_COLORS,
    DPI,
    apply_brand_style,
    add_watermark,
    add_title_block,
    add_footer,
    save_figure,
)


# ── Outcome-color mapping ───────────────────────────────────────────────────

OUTCOME_COLORS = {
    "Goal": BRAND["success"],
    "SavedShot": BRAND["info"],
    "BlockedShot": BRAND["warning"],
    "MissedShots": BRAND["gray"],
    "ShotOnPost": BRAND["gold"],
}

OUTCOME_LABELS = {
    "Goal": "Goal",
    "SavedShot": "Saved",
    "BlockedShot": "Blocked",
    "MissedShots": "Off Target",
    "ShotOnPost": "Hit Post",
}

# ── Minimum dot size and xG scaler ──────────────────────────────────────────

MIN_DOT = 40
XG_SCALE = 800


def generate_shot_map(
    match_data: dict[str, Any],
    output_dir: str | Path,
    team_filter: str | None = None,
) -> list[Path]:
    """Generate shot map(s) for a match.

    Args:
        match_data: Match dictionary with ``shots`` list. Each shot needs:
            x, y (0-100 coords), xg, result, team, player.
        output_dir: Directory to write PNG files into.
        team_filter: If set, only generate for this team.

    Returns:
        List of output file paths.
    """
    apply_brand_style()
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []

    shots = match_data.get("shots", [])
    if not shots:
        return outputs

    home = match_data.get("home_team", "Home")
    away = match_data.get("away_team", "Away")
    match_id = match_data.get("match_id", "unknown")
    home_score = match_data.get("home_score", 0)
    away_score = match_data.get("away_score", 0)
    home_xg = match_data.get("home_xg", 0.0)
    away_xg = match_data.get("away_xg", 0.0)

    teams_to_plot = []
    if team_filter:
        teams_to_plot.append(team_filter)
    else:
        teams_to_plot = [home, away]

    for team in teams_to_plot:
        team_shots = [s for s in shots if s.get("team") == team]
        if not team_shots:
            continue

        is_home = team == home
        colors = NYRB_COLORS if "Red Bull" in team or "NYRB" in team else OPPONENT_COLORS

        # ── Build figure ─────────────────────────────────────────────────
        pitch = VerticalPitch(
            pitch_type="opta",
            pitch_color=BRAND["bg"],
            line_color=BRAND["grid"],
            linewidth=1,
            half=True,
        )
        fig, ax = pitch.draw(figsize=(8, 6))
        fig.set_facecolor(BRAND["bg"])

        # ── Plot each shot ───────────────────────────────────────────────
        for shot in team_shots:
            x = shot.get("x", 50)
            y = shot.get("y", 50)
            xg = shot.get("xg", 0.05)
            result = shot.get("result", "MissedShots")
            player = shot.get("player", "")

            color = OUTCOME_COLORS.get(result, BRAND["gray"])
            size = max(MIN_DOT, xg * XG_SCALE)
            alpha = 0.85 if result == "Goal" else 0.6
            edge = BRAND["white"] if result == "Goal" else "none"
            edge_w = 1.5 if result == "Goal" else 0

            pitch.scatter(
                x,
                y,
                s=size,
                color=color,
                edgecolors=edge,
                linewidth=edge_w,
                alpha=alpha,
                zorder=3,
                ax=ax,
            )

            # Annotate goals with player name
            if result == "Goal":
                ax.annotate(
                    player.split()[-1] if player else "",
                    xy=(y, 100 - x),  # vertical pitch coords
                    fontsize=7,
                    color=BRAND["white"],
                    ha="center",
                    va="bottom",
                    fontweight="bold",
                    alpha=0.9,
                )

        # ── Title ────────────────────────────────────────────────────────
        title = f"{team} Shot Map"
        score_str = f"{home} {home_score}–{away_score} {away}"
        xg_str = f"xG: {home_xg:.2f} – {away_xg:.2f}"
        subtitle = f"{score_str}  |  {xg_str}"

        add_title_block(fig, title, subtitle, y_title=0.98, y_subtitle=0.94)

        # ── Legend ───────────────────────────────────────────────────────
        legend_handles = []
        for key, label in OUTCOME_LABELS.items():
            matching = [s for s in team_shots if s.get("result") == key]
            if matching:
                handle = plt.scatter(
                    [], [],
                    s=60,
                    color=OUTCOME_COLORS[key],
                    label=f"{label} ({len(matching)})",
                    edgecolors="none",
                )
                legend_handles.append(handle)

        if legend_handles:
            ax.legend(
                handles=legend_handles,
                loc="lower left",
                frameon=True,
                framealpha=0.8,
                facecolor=BRAND["card_bg"],
                edgecolor=BRAND["grid"],
                fontsize=8,
            )

        # ── Watermark & footer ───────────────────────────────────────────
        add_watermark(fig)
        add_footer(fig)

        # ── Save ─────────────────────────────────────────────────────────
        safe_team = team.replace(" ", "_").lower()
        filename = f"shot_map_{match_id}_{safe_team}.png"
        out_path = save_figure(fig, output_dir / filename)
        outputs.append(out_path)

    return outputs


def generate_from_file(data_path: str | Path, output_dir: str | Path) -> list[Path]:
    """Convenience wrapper that loads JSON from disk."""
    data = json.loads(Path(data_path).read_text(encoding="utf-8"))
    return generate_shot_map(data, output_dir)
