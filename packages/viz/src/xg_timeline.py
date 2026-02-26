"""
South Ward Signal — xG Timeline (Accumulation Race Chart).

Plots minute-by-minute cumulative xG for both teams across a match,
showing momentum shifts and key moments.
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
    OPPONENT_COLORS,
    apply_brand_style,
    create_figure,
    add_watermark,
    add_title_block,
    add_footer,
    save_figure,
)


def _is_nyrb(team: str) -> bool:
    return "Red Bull" in team or "NYRB" in team or "RBNY" in team


def _cumulative_xg(shots: list[dict], team: str) -> tuple[list[int], list[float]]:
    """Return (minutes, cumulative_xg) arrays for a team's shots."""
    team_shots = sorted(
        [s for s in shots if s.get("team") == team],
        key=lambda s: s.get("minute", 0),
    )

    minutes = [0]
    cum_xg = [0.0]

    running = 0.0
    for shot in team_shots:
        minute = shot.get("minute", 0)
        xg = shot.get("xg", 0.0)
        running += xg
        minutes.append(minute)
        cum_xg.append(running)

    # Extend to 90+
    if minutes[-1] < 90:
        minutes.append(90)
        cum_xg.append(running)

    return minutes, cum_xg


def generate_xg_timeline(
    match_data: dict[str, Any],
    output_dir: str | Path,
) -> Path:
    """Generate an xG timeline race chart.

    Args:
        match_data: Match dictionary with ``shots`` list. Each shot needs:
            minute, xg, team, result, player.
        output_dir: Directory to write the PNG into.

    Returns:
        Output file path.
    """
    apply_brand_style()
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    shots = match_data.get("shots", [])
    home = match_data.get("home_team", "Home")
    away = match_data.get("away_team", "Away")
    match_id = match_data.get("match_id", "unknown")
    home_score = match_data.get("home_score", 0)
    away_score = match_data.get("away_score", 0)
    home_xg_total = match_data.get("home_xg", 0.0)
    away_xg_total = match_data.get("away_xg", 0.0)

    # ── Determine colors ─────────────────────────────────────────────────
    home_color = NYRB_COLORS["primary"] if _is_nyrb(home) else BRAND["info"]
    away_color = NYRB_COLORS["primary"] if _is_nyrb(away) else BRAND["gray_light"]
    if _is_nyrb(home):
        away_color = BRAND["gray_light"]
    elif _is_nyrb(away):
        home_color = BRAND["gray_light"]

    # ── Build cumulative xG series ───────────────────────────────────────
    h_min, h_xg = _cumulative_xg(shots, home)
    a_min, a_xg = _cumulative_xg(shots, away)

    # If no shots data, synthesize from totals
    if len(h_min) <= 2 and home_xg_total > 0:
        h_min = [0, 45, 90]
        h_xg = [0.0, home_xg_total * 0.45, home_xg_total]
    if len(a_min) <= 2 and away_xg_total > 0:
        a_min = [0, 45, 90]
        a_xg = [0.0, away_xg_total * 0.45, away_xg_total]

    # ── Create figure ────────────────────────────────────────────────────
    fig, ax = create_figure(1200, 675)

    # Plot lines
    ax.step(h_min, h_xg, where="post", color=home_color, linewidth=2.5, zorder=3)
    ax.step(a_min, a_xg, where="post", color=away_color, linewidth=2.5, zorder=3)

    # Fill area under
    ax.fill_between(h_min, h_xg, step="post", alpha=0.12, color=home_color, zorder=2)
    ax.fill_between(a_min, a_xg, step="post", alpha=0.12, color=away_color, zorder=2)

    # ── Goal markers ─────────────────────────────────────────────────────
    goals = [s for s in shots if s.get("result") == "Goal"]
    for goal in goals:
        minute = goal.get("minute", 0)
        team = goal.get("team", "")
        player = goal.get("player", "")

        # Find cumulative xG at that minute
        if team == home:
            idx = max(i for i, m in enumerate(h_min) if m <= minute)
            y_val = h_xg[idx]
            color = home_color
        else:
            idx = max(i for i, m in enumerate(a_min) if m <= minute)
            y_val = a_xg[idx]
            color = away_color

        ax.scatter(
            minute, y_val, s=120, color=color, edgecolors=BRAND["white"],
            linewidth=1.5, zorder=5,
        )
        label = f"{player.split()[-1]} {minute}'" if player else f"{minute}'"
        ax.annotate(
            label,
            xy=(minute, y_val),
            xytext=(0, 12),
            textcoords="offset points",
            fontsize=7,
            fontweight="bold",
            color=BRAND["white"],
            ha="center",
            va="bottom",
            alpha=0.9,
        )

    # ── Half-time line ───────────────────────────────────────────────────
    ax.axvline(x=45, color=BRAND["grid"], linewidth=1, linestyle="--", alpha=0.6)
    ax.text(
        45, ax.get_ylim()[1] * 0.95, "HT", fontsize=8,
        color=BRAND["gray"], ha="center", va="top",
    )

    # ── Axes ─────────────────────────────────────────────────────────────
    ax.set_xlim(0, 95)
    y_max = max(max(h_xg, default=1), max(a_xg, default=1)) * 1.25
    ax.set_ylim(0, max(y_max, 0.5))
    ax.set_xlabel("Minute", fontsize=10)
    ax.set_ylabel("Cumulative xG", fontsize=10)
    ax.set_xticks([0, 15, 30, 45, 60, 75, 90])
    ax.grid(axis="y", alpha=0.3)
    ax.grid(axis="x", alpha=0.15)

    # ── Legend ────────────────────────────────────────────────────────────
    home_patch = mpatches.Patch(
        color=home_color,
        label=f"{home} ({home_xg_total:.2f} xG)",
    )
    away_patch = mpatches.Patch(
        color=away_color,
        label=f"{away} ({away_xg_total:.2f} xG)",
    )
    ax.legend(
        handles=[home_patch, away_patch],
        loc="upper left",
        frameon=True,
        framealpha=0.8,
        facecolor=BRAND["card_bg"],
        edgecolor=BRAND["grid"],
        fontsize=9,
    )

    # ── Title ────────────────────────────────────────────────────────────
    title = "xG Timeline"
    subtitle = f"{home} {home_score}–{away_score} {away}"
    add_title_block(fig, title, subtitle)

    add_watermark(fig)
    add_footer(fig)

    filename = f"xg_timeline_{match_id}.png"
    return save_figure(fig, output_dir / filename)


def generate_from_file(data_path: str | Path, output_dir: str | Path) -> Path:
    """Convenience wrapper that loads JSON from disk."""
    data = json.loads(Path(data_path).read_text(encoding="utf-8"))
    return generate_xg_timeline(data, output_dir)
