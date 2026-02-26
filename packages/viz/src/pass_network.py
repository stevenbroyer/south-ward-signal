"""
South Ward Signal — Pass Network Visualization.

Displays the starting XI with passing connections between players.
Node size reflects involvement, edge thickness reflects pass frequency.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
from mplsoccer import Pitch

from .style import (
    BRAND,
    NYRB_COLORS,
    apply_brand_style,
    add_watermark,
    add_title_block,
    add_footer,
    save_figure,
)

# ── Default formation positions (4-2-3-1) ───────────────────────────────────
# Opta coordinates: x 0-100 (length), y 0-100 (width)

FORMATION_POSITIONS: dict[str, tuple[float, float]] = {
    "GK": (5, 50),
    "LB": (25, 15),
    "LCB": (25, 37),
    "RCB": (25, 63),
    "RB": (25, 85),
    "LDM": (40, 37),
    "RDM": (40, 63),
    "CDM": (40, 50),
    "LW": (60, 15),
    "CAM": (60, 50),
    "AM": (60, 50),
    "RW": (60, 85),
    "LM": (55, 15),
    "CM": (50, 50),
    "RM": (55, 85),
    "ST": (78, 50),
    "CF": (78, 50),
    "LST": (78, 37),
    "RST": (78, 63),
    "LCM": (48, 35),
    "RCM": (48, 65),
}


def _get_position_xy(position: str) -> tuple[float, float]:
    """Map a position abbreviation to pitch coordinates."""
    pos = position.upper().strip()
    if pos in FORMATION_POSITIONS:
        return FORMATION_POSITIONS[pos]
    # Fuzzy fallback
    for key in FORMATION_POSITIONS:
        if key in pos or pos in key:
            return FORMATION_POSITIONS[key]
    return (50, 50)


def generate_pass_network(
    match_data: dict[str, Any],
    output_dir: str | Path,
    team: str | None = None,
) -> list[Path]:
    """Generate pass network visualization.

    Args:
        match_data: Match dict containing:
            - ``lineups.home`` / ``lineups.away``: list of player dicts with
              ``name``, ``position``, ``passes_completed`` (optional).
            - ``pass_pairs``: list of dicts with ``passer``, ``receiver``,
              ``count``, ``team``.
        output_dir: Directory to write PNGs.
        team: Filter to one team (uses home if not set).

    Returns:
        List of output file paths.
    """
    apply_brand_style()
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []

    home = match_data.get("home_team", "Home")
    away = match_data.get("away_team", "Away")
    match_id = match_data.get("match_id", "unknown")
    lineups = match_data.get("lineups", {})
    pass_pairs = match_data.get("pass_pairs", [])

    teams_to_plot = [team] if team else [home, away]

    for current_team in teams_to_plot:
        side = "home" if current_team == home else "away"
        roster = lineups.get(side, [])
        if not roster:
            continue

        # Starting XI only (first 11)
        starters = roster[:11]
        is_nyrb = "Red Bull" in current_team or "NYRB" in current_team

        # ── Map players to positions ─────────────────────────────────────
        player_positions: dict[str, tuple[float, float]] = {}
        player_passes: dict[str, int] = {}

        for p in starters:
            name = p.get("name", "Unknown")
            pos = p.get("position", "CM")
            player_positions[name] = _get_position_xy(pos)
            player_passes[name] = p.get("passes_completed", 30)

        # ── Filter pass pairs for this team ──────────────────────────────
        team_pairs = [
            pp for pp in pass_pairs
            if pp.get("team") == current_team
            and pp.get("passer") in player_positions
            and pp.get("receiver") in player_positions
        ]

        # ── Create pitch ─────────────────────────────────────────────────
        pitch = Pitch(
            pitch_type="opta",
            pitch_color=BRAND["bg"],
            line_color=BRAND["grid"],
            linewidth=1,
        )
        fig, ax = pitch.draw(figsize=(12, 8))
        fig.set_facecolor(BRAND["bg"])

        # ── Draw pass connections ────────────────────────────────────────
        if team_pairs:
            max_count = max(pp.get("count", 1) for pp in team_pairs)
            min_width = 0.5
            max_width = 6.0

            for pp in team_pairs:
                passer = pp["passer"]
                receiver = pp["receiver"]
                count = pp.get("count", 1)

                if passer not in player_positions or receiver not in player_positions:
                    continue

                x1, y1 = player_positions[passer]
                x2, y2 = player_positions[receiver]

                width = min_width + (count / max(max_count, 1)) * (max_width - min_width)
                alpha = 0.15 + (count / max(max_count, 1)) * 0.55

                node_color = NYRB_COLORS["primary"] if is_nyrb else BRAND["info"]

                pitch.lines(
                    x1, y1, x2, y2,
                    lw=width,
                    color=node_color,
                    alpha=alpha,
                    zorder=2,
                    ax=ax,
                )

        # ── Draw player nodes ────────────────────────────────────────────
        node_color = NYRB_COLORS["primary"] if is_nyrb else BRAND["info"]

        for name, (x, y) in player_positions.items():
            passes = player_passes.get(name, 30)
            # Scale node size by pass involvement
            size = 200 + (passes / max(max(player_passes.values(), default=1), 1)) * 600

            pitch.scatter(
                x, y,
                s=size,
                color=node_color,
                edgecolors=BRAND["white"],
                linewidth=1.5,
                alpha=0.9,
                zorder=4,
                ax=ax,
            )

            # Player last name
            short_name = name.split()[-1] if name else ""
            ax.annotate(
                short_name,
                xy=(x, y),
                fontsize=7,
                fontweight="bold",
                color=BRAND["white"],
                ha="center",
                va="center",
                zorder=5,
            )

        # ── Title ────────────────────────────────────────────────────────
        pair_count = len(team_pairs)
        total_passes = sum(pp.get("count", 0) for pp in team_pairs)
        subtitle_parts = [f"{current_team} Starting XI"]
        if total_passes:
            subtitle_parts.append(f"{total_passes} passes between starters")
        subtitle = "  |  ".join(subtitle_parts)

        add_title_block(fig, f"{current_team} Pass Network", subtitle)
        add_watermark(fig)
        add_footer(fig)

        safe = current_team.replace(" ", "_").lower()
        filename = f"pass_network_{match_id}_{safe}.png"
        out_path = save_figure(fig, output_dir / filename)
        outputs.append(out_path)

    return outputs


def generate_from_file(data_path: str | Path, output_dir: str | Path) -> list[Path]:
    """Convenience wrapper that loads JSON from disk."""
    data = json.loads(Path(data_path).read_text(encoding="utf-8"))
    return generate_pass_network(data, output_dir)
