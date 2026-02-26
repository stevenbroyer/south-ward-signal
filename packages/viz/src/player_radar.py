"""
South Ward Signal — Player Radar (Pizza) Chart.

Compares a player's stats against the positional average using a
radar/pizza chart with 6-8 metrics.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

from .style import (
    BRAND,
    NYRB_COLORS,
    apply_brand_style,
    add_watermark,
    add_title_block,
    add_footer,
    save_figure,
    DPI,
)

# ── Default metrics per position ─────────────────────────────────────────────

METRICS_BY_POSITION: dict[str, list[str]] = {
    "FW": [
        "Goals", "xG", "Assists", "xA",
        "Key Passes", "Shots/90", "Aerial Duels Won", "Dribbles",
    ],
    "MF": [
        "Goals + Assists", "xG + xA", "Key Passes", "Pass Completion",
        "Tackles Won", "Interceptions", "Progressive Passes", "Dribbles",
    ],
    "DF": [
        "Tackles Won", "Interceptions", "Aerial Duels Won", "Clearances",
        "Pass Completion", "Progressive Passes", "Blocks", "Goals Added",
    ],
    "GK": [
        "Save %", "xG Prevented", "Clean Sheets", "Distribution Accuracy",
        "High Claims", "Sweeper Actions", "Penalties Saved", "Pass Completion",
    ],
}

DEFAULT_METRICS = [
    "Goals", "xG", "Assists", "xA",
    "Key Passes", "Tackles Won", "Pass Completion", "Dribbles",
]


def _normalize(value: float, floor: float, ceiling: float) -> float:
    """Normalize a value to 0-100 percentile scale."""
    if ceiling == floor:
        return 50.0
    return max(0.0, min(100.0, ((value - floor) / (ceiling - floor)) * 100))


def generate_player_radar(
    player_data: dict[str, Any],
    avg_data: dict[str, Any],
    output_dir: str | Path,
    metrics: list[str] | None = None,
    position: str | None = None,
) -> Path:
    """Generate a pizza/radar chart comparing a player to the positional average.

    Args:
        player_data: Dict with keys matching metric names and a ``name`` field.
        avg_data: Dict with same metric keys representing positional averages.
            Each value can be a number (the average) or a dict with ``avg``,
            ``min``, ``max`` keys for normalization.
        output_dir: Directory to write PNG.
        metrics: Override metric list (6-8 items recommended).
        position: Player position to auto-select metrics.

    Returns:
        Output file path.
    """
    apply_brand_style()
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    player_name = player_data.get("name", "Player")
    player_team = player_data.get("team", "")

    # ── Select metrics ───────────────────────────────────────────────────
    if metrics is None:
        pos_key = (position or player_data.get("position", "MF"))[:2].upper()
        metrics = METRICS_BY_POSITION.get(pos_key, DEFAULT_METRICS)

    # Cap at 8 metrics
    metrics = metrics[:8]
    n = len(metrics)

    # ── Extract values ───────────────────────────────────────────────────
    player_values: list[float] = []
    avg_values: list[float] = []

    for metric in metrics:
        pval = player_data.get(metric, 0)
        aval = avg_data.get(metric, 0)

        if isinstance(aval, dict):
            avg_num = aval.get("avg", 0)
            p_norm = _normalize(pval, aval.get("min", 0), aval.get("max", avg_num * 2))
            a_norm = _normalize(avg_num, aval.get("min", 0), aval.get("max", avg_num * 2))
        else:
            # Use simple scaling: avg = 50th percentile
            ceiling = max(pval, aval, 0.01) * 1.5
            p_norm = _normalize(pval, 0, ceiling)
            a_norm = _normalize(aval, 0, ceiling)

        player_values.append(p_norm)
        avg_values.append(a_norm)

    # ── Build radar ──────────────────────────────────────────────────────
    angles = np.linspace(0, 2 * math.pi, n, endpoint=False).tolist()
    # Close the polygon
    player_values_c = player_values + [player_values[0]]
    avg_values_c = avg_values + [avg_values[0]]
    angles_c = angles + [angles[0]]

    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(projection="polar"))
    fig.set_facecolor(BRAND["bg"])
    ax.set_facecolor(BRAND["bg"])

    # ── Grid styling ─────────────────────────────────────────────────────
    ax.set_ylim(0, 100)
    ax.set_yticks([20, 40, 60, 80, 100])
    ax.set_yticklabels(["20", "40", "60", "80", "100"], fontsize=6, color=BRAND["gray"])
    ax.set_xticks(angles)
    ax.set_xticklabels(metrics, fontsize=8, color=BRAND["white"], fontweight="bold")

    ax.spines["polar"].set_color(BRAND["grid"])
    ax.grid(color=BRAND["grid"], alpha=0.3, linewidth=0.5)
    ax.tick_params(pad=12)

    # ── Plot average (filled, muted) ─────────────────────────────────────
    ax.fill(angles_c, avg_values_c, color=BRAND["gray"], alpha=0.15, zorder=1)
    ax.plot(angles_c, avg_values_c, color=BRAND["gray"], linewidth=1, alpha=0.5, zorder=2)

    # ── Plot player (pizza slices) ───────────────────────────────────────
    is_nyrb = "Red Bull" in player_team or "NYRB" in player_team
    player_color = NYRB_COLORS["primary"] if is_nyrb else BRAND["info"]

    # Draw individual slices (pizza style)
    for i in range(n):
        start_angle = angles[i]
        end_angle = angles[(i + 1) % n]

        # Create a wedge for each metric
        theta = np.linspace(start_angle, end_angle, 30)
        r_player = np.full_like(theta, player_values[i])

        # Alternate slice colors for visual distinction
        slice_color = player_color if i % 2 == 0 else BRAND["accent"]
        alpha = 0.6 if i % 2 == 0 else 0.45

        ax.fill_between(
            [start_angle, end_angle],
            [0, 0],
            [player_values[i], player_values[(i + 1) % n]],
            color=slice_color,
            alpha=alpha,
            zorder=3,
        )

    # Player outline
    ax.plot(
        angles_c, player_values_c,
        color=player_color, linewidth=2.5, zorder=4,
    )

    # Value dots
    ax.scatter(
        angles, player_values,
        s=50, color=player_color, edgecolors=BRAND["white"],
        linewidth=1, zorder=5,
    )

    # ── Annotate values ──────────────────────────────────────────────────
    for angle, val, metric in zip(angles, player_values, metrics):
        raw = player_data.get(metric, 0)
        if isinstance(raw, float):
            label = f"{raw:.1f}"
        else:
            label = str(raw)

        ax.annotate(
            label,
            xy=(angle, val),
            xytext=(0, 8),
            textcoords="offset points",
            fontsize=7,
            color=BRAND["white"],
            ha="center",
            va="bottom",
            fontweight="bold",
        )

    # ── Title ────────────────────────────────────────────────────────────
    pos = player_data.get("position", "")
    subtitle = f"{player_team}  |  {pos}" if player_team else pos
    add_title_block(fig, player_name, subtitle, y_title=0.97, y_subtitle=0.94)

    # ── Legend ────────────────────────────────────────────────────────────
    player_patch = mpatches.Patch(color=player_color, alpha=0.6, label=player_name)
    avg_patch = mpatches.Patch(color=BRAND["gray"], alpha=0.3, label="Positional Avg")
    fig.legend(
        handles=[player_patch, avg_patch],
        loc="lower center",
        ncol=2,
        frameon=True,
        facecolor=BRAND["card_bg"],
        edgecolor=BRAND["grid"],
        fontsize=9,
        bbox_to_anchor=(0.5, 0.02),
    )

    add_watermark(fig)
    add_footer(fig)

    safe_name = player_name.replace(" ", "_").lower()
    filename = f"player_radar_{safe_name}.png"
    return save_figure(fig, output_dir / filename)


def generate_from_file(
    player_path: str | Path,
    avg_path: str | Path,
    output_dir: str | Path,
) -> Path:
    """Load player + average data from JSON files."""
    player = json.loads(Path(player_path).read_text(encoding="utf-8"))
    avg = json.loads(Path(avg_path).read_text(encoding="utf-8"))
    return generate_player_radar(player, avg, output_dir)
