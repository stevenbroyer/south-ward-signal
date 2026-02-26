"""
South Ward Signal — Touch/Action Heatmap.

Overlays a kernel-density heatmap of player or team actions on the pitch.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap
from mplsoccer import VerticalPitch

from .style import (
    BRAND,
    NYRB_COLORS,
    apply_brand_style,
    add_watermark,
    add_title_block,
    add_footer,
    save_figure,
)


def _brand_cmap() -> LinearSegmentedColormap:
    """Create a custom colormap: transparent -> red glow -> bright red."""
    colors = [
        (0.0, (0.04, 0.04, 0.05, 0.0)),       # transparent bg
        (0.2, (0.93, 0.10, 0.24, 0.05)),       # faint red
        (0.5, (0.93, 0.10, 0.24, 0.30)),       # medium red
        (0.8, (0.93, 0.10, 0.24, 0.65)),       # strong red
        (1.0, (1.00, 0.30, 0.42, 0.90)),       # bright accent
    ]
    cmap = LinearSegmentedColormap.from_list("sws_heat", colors, N=256)
    return cmap


def generate_heatmap(
    action_data: dict[str, Any],
    output_dir: str | Path,
    player_name: str | None = None,
) -> Path:
    """Generate a touch/action heatmap.

    Args:
        action_data: Dict with:
            - ``actions``: list of dicts with ``x``, ``y`` (0-100 opta coords),
              optionally ``type`` (touch, pass, dribble, etc.).
            - ``team``: team name.
            - ``player`` (optional): player name if player-specific.
            - ``match_id``, ``home_team``, ``away_team``, scores...
        output_dir: Output directory.
        player_name: Override player name for filtering.

    Returns:
        Output file path.
    """
    apply_brand_style()
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    actions = action_data.get("actions", [])
    team = action_data.get("team", "Team")
    player = player_name or action_data.get("player", None)
    match_id = action_data.get("match_id", "unknown")

    # Filter to player if specified
    if player:
        actions = [a for a in actions if a.get("player", "") == player]

    if not actions:
        # Return empty figure rather than failing
        pitch = VerticalPitch(
            pitch_type="opta",
            pitch_color=BRAND["bg"],
            line_color=BRAND["grid"],
            linewidth=1,
        )
        fig, ax = pitch.draw(figsize=(8, 10))
        fig.set_facecolor(BRAND["bg"])
        add_title_block(fig, "Heatmap — No Data", "")
        add_watermark(fig)
        filename = f"heatmap_{match_id}_empty.png"
        return save_figure(fig, output_dir / filename)

    x_coords = np.array([a.get("x", 50) for a in actions], dtype=float)
    y_coords = np.array([a.get("y", 50) for a in actions], dtype=float)

    # ── Create pitch ─────────────────────────────────────────────────────
    pitch = VerticalPitch(
        pitch_type="opta",
        pitch_color=BRAND["bg"],
        line_color=BRAND["grid"],
        linewidth=1,
    )
    fig, ax = pitch.draw(figsize=(8, 10))
    fig.set_facecolor(BRAND["bg"])

    # ── KDE heatmap ──────────────────────────────────────────────────────
    cmap = _brand_cmap()

    bin_statistic = pitch.bin_statistic(
        x_coords, y_coords,
        statistic="count",
        bins=(25, 25),
        normalize=True,
    )
    bin_statistic["statistic"] = np.where(
        bin_statistic["statistic"] == 0,
        np.nan,
        bin_statistic["statistic"],
    )

    pitch.heatmap(
        bin_statistic,
        ax=ax,
        cmap=cmap,
        edgecolors="none",
        zorder=2,
    )

    # ── Scatter overlay (faint dots for individual actions) ──────────────
    pitch.scatter(
        x_coords, y_coords,
        s=8,
        color=BRAND["red"],
        alpha=0.15,
        zorder=3,
        ax=ax,
    )

    # ── Title ────────────────────────────────────────────────────────────
    entity = player if player else team
    n_actions = len(actions)
    action_types = set(a.get("type", "touch") for a in actions)
    type_str = ", ".join(sorted(action_types)[:3]).title()

    title = f"{entity} Heatmap"
    subtitle = f"{n_actions} actions  |  {type_str}"

    add_title_block(fig, title, subtitle, y_title=0.97, y_subtitle=0.94)
    add_watermark(fig)
    add_footer(fig)

    # ── Stats summary bar ────────────────────────────────────────────────
    # Average position marker
    avg_x = float(np.mean(x_coords))
    avg_y = float(np.mean(y_coords))
    pitch.scatter(
        avg_x, avg_y,
        s=200,
        marker="x",
        color=BRAND["white"],
        linewidth=2,
        alpha=0.8,
        zorder=5,
        ax=ax,
    )
    ax.annotate(
        "Avg",
        xy=(avg_y, 100 - avg_x),
        fontsize=7,
        color=BRAND["white"],
        ha="center",
        va="bottom",
        fontweight="bold",
        alpha=0.7,
    )

    # ── Save ─────────────────────────────────────────────────────────────
    safe_name = (player or team).replace(" ", "_").lower()
    filename = f"heatmap_{match_id}_{safe_name}.png"
    return save_figure(fig, output_dir / filename)


def generate_from_file(data_path: str | Path, output_dir: str | Path) -> Path:
    """Convenience wrapper that loads JSON from disk."""
    data = json.loads(Path(data_path).read_text(encoding="utf-8"))
    return generate_heatmap(data, output_dir)
