"""
South Ward Signal — CLI Entry Point for Visualization Pipeline.

Usage:
    python generate.py --type shot_map --data ./data/match.json --output ./output/
    python generate.py --type all --data ./data/match.json --output ./output/

Supported types:
    shot_map, xg_timeline, pass_network, player_radar,
    heatmap, standings_bump, score, stat_card, matchday, all
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from .shot_map import generate_shot_map
from .xg_timeline import generate_xg_timeline
from .pass_network import generate_pass_network
from .player_radar import generate_player_radar
from .heatmap import generate_heatmap
from .standings_bump import generate_standings_bump
from .social_graphics import (
    generate_score_graphic,
    generate_stat_card,
    generate_matchday_graphic,
)


VIZ_TYPES = [
    "shot_map",
    "xg_timeline",
    "pass_network",
    "player_radar",
    "heatmap",
    "standings_bump",
    "score",
    "stat_card",
    "matchday",
    "all",
]


def _load_json(path: str | Path) -> dict[str, Any]:
    """Load and parse a JSON data file."""
    p = Path(path)
    if not p.exists():
        print(f"[ERROR] Data file not found: {p}", file=sys.stderr)
        sys.exit(1)
    return json.loads(p.read_text(encoding="utf-8"))


def run_viz(viz_type: str, data: dict[str, Any], output_dir: Path) -> list[Path]:
    """Run a single visualization type and return output paths."""
    results: list[Path] = []

    if viz_type == "shot_map":
        paths = generate_shot_map(data, output_dir)
        results.extend(paths)

    elif viz_type == "xg_timeline":
        path = generate_xg_timeline(data, output_dir)
        results.append(path)

    elif viz_type == "pass_network":
        paths = generate_pass_network(data, output_dir)
        results.extend(paths)

    elif viz_type == "player_radar":
        player = data.get("player_data", data)
        avg = data.get("avg_data", {})
        path = generate_player_radar(player, avg, output_dir)
        results.append(path)

    elif viz_type == "heatmap":
        path = generate_heatmap(data, output_dir)
        results.append(path)

    elif viz_type == "standings_bump":
        history = data if isinstance(data, list) else data.get("history", [])
        conference = data.get("conference", "Eastern") if isinstance(data, dict) else "Eastern"
        path = generate_standings_bump(history, output_dir, conference=conference)
        results.append(path)

    elif viz_type == "score":
        paths = generate_score_graphic(data, output_dir)
        results.extend(paths)

    elif viz_type == "stat_card":
        paths = generate_stat_card(data, output_dir)
        results.extend(paths)

    elif viz_type == "matchday":
        paths = generate_matchday_graphic(data, output_dir)
        results.extend(paths)

    return results


def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="South Ward Signal — Visualization Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--type",
        required=True,
        choices=VIZ_TYPES,
        help="Visualization type to generate.",
    )
    parser.add_argument(
        "--data",
        required=True,
        help="Path to JSON data file.",
    )
    parser.add_argument(
        "--output",
        default="./output",
        help="Output directory (default: ./output).",
    )
    parser.add_argument(
        "--match-id",
        default=None,
        help="Optional match ID override (injected into data).",
    )

    args = parser.parse_args()
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    data = _load_json(args.data)

    if args.match_id:
        data["match_id"] = args.match_id

    if args.type == "all":
        # Run all match-related visualizations
        all_outputs: list[Path] = []
        match_types = ["shot_map", "xg_timeline", "pass_network", "heatmap", "score"]
        for vt in match_types:
            try:
                paths = run_viz(vt, data, output_dir)
                all_outputs.extend(paths)
                print(f"[OK] {vt}: {len(paths)} file(s)")
            except Exception as e:
                print(f"[WARN] {vt} skipped: {e}", file=sys.stderr)

        print(f"\nGenerated {len(all_outputs)} total files in {output_dir}")
    else:
        try:
            paths = run_viz(args.type, data, output_dir)
            for p in paths:
                print(f"[OK] {p}")
            print(f"\nGenerated {len(paths)} file(s) in {output_dir}")
        except Exception as e:
            print(f"[ERROR] {args.type} failed: {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
