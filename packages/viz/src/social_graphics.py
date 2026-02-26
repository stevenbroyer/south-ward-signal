"""
South Ward Signal — Social Media Graphics.

Generates branded templates for social distribution:
- Score graphic (post-match)
- Stat card (highlight a single stat)
- Matchday graphic (pre-match)

Output sizes:
  Twitter:    1200 x 675
  Instagram:  1080 x 1080
  Stories:    1080 x 1920
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont
import numpy as np

from .style import BRAND, SIZES, NYRB_COLORS


# ── Font helpers ─────────────────────────────────────────────────────────────

def _get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Get a font, falling back to Pillow default if system fonts unavailable."""
    font_names = [
        "arial.ttf",
        "Arial.ttf",
        "DejaVuSans.ttf",
        "Helvetica.ttf",
        "LiberationSans-Regular.ttf",
    ]
    if bold:
        font_names = [
            "arialbd.ttf",
            "Arial Bold.ttf",
            "DejaVuSans-Bold.ttf",
            "Helvetica-Bold.ttf",
            "LiberationSans-Bold.ttf",
        ] + font_names

    for name in font_names:
        try:
            return ImageFont.truetype(name, size)
        except (IOError, OSError):
            continue

    return ImageFont.load_default()


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    h = hex_color.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _hex_to_rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    """Convert hex color to RGBA tuple."""
    r, g, b = _hex_to_rgb(hex_color)
    return (r, g, b, alpha)


def _draw_rounded_rect(
    draw: ImageDraw.ImageDraw,
    bbox: tuple[int, int, int, int],
    radius: int,
    fill: tuple[int, ...],
) -> None:
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = bbox
    draw.rounded_rectangle(bbox, radius=radius, fill=fill)


def _add_watermark(draw: ImageDraw.ImageDraw, width: int, height: int) -> None:
    """Add South Ward Signal watermark."""
    font = _get_font(14)
    text = "SOUTH WARD SIGNAL"
    color = _hex_to_rgba(BRAND["gray"], 100)
    draw.text((width - 20, height - 20), text, fill=color, font=font, anchor="rb")


def _add_gradient_overlay(img: Image.Image, intensity: float = 0.7) -> Image.Image:
    """Add a dark gradient overlay from bottom to top."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    w, h = img.size

    for y in range(h):
        progress = y / h
        alpha = int(intensity * 255 * progress)
        draw.line([(0, y), (w, y)], fill=(10, 10, 12, alpha))

    return Image.alpha_composite(img.convert("RGBA"), overlay)


# ── Score Graphic ────────────────────────────────────────────────────────────

def generate_score_graphic(
    match_data: dict[str, Any],
    output_dir: str | Path,
    sizes: list[str] | None = None,
) -> list[Path]:
    """Generate post-match score graphic.

    Args:
        match_data: Match dict with home_team, away_team, scores, goals, etc.
        output_dir: Output directory.
        sizes: List of size keys ('twitter', 'instagram', 'stories').

    Returns:
        List of output file paths.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []

    if sizes is None:
        sizes = ["twitter", "instagram", "stories"]

    home = match_data.get("home_team", "Home")
    away = match_data.get("away_team", "Away")
    home_score = match_data.get("home_score", 0)
    away_score = match_data.get("away_score", 0)
    home_xg = match_data.get("home_xg", 0.0)
    away_xg = match_data.get("away_xg", 0.0)
    match_id = match_data.get("match_id", "unknown")
    date_str = match_data.get("date", "")
    goals = match_data.get("goals", [])

    for size_key in sizes:
        w, h = SIZES.get(size_key, SIZES["default"])
        bg = _hex_to_rgb(BRAND["bg"])
        img = Image.new("RGB", (w, h), bg)
        draw = ImageDraw.Draw(img)

        # ── Background accent ────────────────────────────────────────────
        # Red glow at top
        for y in range(min(200, h // 3)):
            alpha = int(40 * (1 - y / 200))
            r, g, b = _hex_to_rgb(BRAND["red"])
            blended = (
                min(255, bg[0] + (r * alpha) // 255),
                min(255, bg[1] + (g * alpha) // 255),
                min(255, bg[2] + (b * alpha) // 255),
            )
            draw.line([(0, y), (w, y)], fill=blended)

        # ── Card background ──────────────────────────────────────────────
        card_margin = int(w * 0.06)
        card_top = int(h * 0.15)
        card_bottom = int(h * 0.85)
        _draw_rounded_rect(
            draw,
            (card_margin, card_top, w - card_margin, card_bottom),
            radius=16,
            fill=_hex_to_rgba(BRAND["card_bg"], 220),
        )

        # ── "FULL TIME" header ───────────────────────────────────────────
        header_font = _get_font(int(w * 0.025), bold=True)
        header_color = _hex_to_rgb(BRAND["red"])
        draw.text(
            (w // 2, card_top + int(h * 0.04)),
            "FULL TIME",
            fill=header_color,
            font=header_font,
            anchor="mt",
        )

        # ── Score ────────────────────────────────────────────────────────
        score_font = _get_font(int(w * 0.12), bold=True)
        score_y = int(h * 0.38)
        score_text = f"{home_score} — {away_score}"
        draw.text(
            (w // 2, score_y),
            score_text,
            fill=_hex_to_rgb(BRAND["white"]),
            font=score_font,
            anchor="mm",
        )

        # ── Team names ───────────────────────────────────────────────────
        team_font = _get_font(int(w * 0.035), bold=True)
        team_y = score_y - int(h * 0.1)
        draw.text(
            (w * 0.25, team_y),
            home.upper(),
            fill=_hex_to_rgb(BRAND["white"]),
            font=team_font,
            anchor="mm",
        )
        draw.text(
            (w * 0.75, team_y),
            away.upper(),
            fill=_hex_to_rgb(BRAND["white"]),
            font=team_font,
            anchor="mm",
        )

        # ── xG bar ──────────────────────────────────────────────────────
        xg_font = _get_font(int(w * 0.022))
        xg_y = score_y + int(h * 0.08)
        xg_text = f"xG: {home_xg:.2f} — {away_xg:.2f}"
        draw.text(
            (w // 2, xg_y),
            xg_text,
            fill=_hex_to_rgb(BRAND["gray"]),
            font=xg_font,
            anchor="mm",
        )

        # ── Goal scorers ────────────────────────────────────────────────
        scorer_font = _get_font(int(w * 0.02))
        scorer_y = xg_y + int(h * 0.06)
        line_height = int(h * 0.035)

        home_goals = [g for g in goals if g.get("team") == home]
        away_goals = [g for g in goals if g.get("team") == away]

        for i, goal in enumerate(home_goals[:4]):
            player = goal.get("player", "")
            minute = goal.get("minute", "")
            label = f"{player} {minute}'"
            draw.text(
                (w * 0.25, scorer_y + i * line_height),
                label,
                fill=_hex_to_rgb(BRAND["gray_light"]),
                font=scorer_font,
                anchor="mm",
            )

        for i, goal in enumerate(away_goals[:4]):
            player = goal.get("player", "")
            minute = goal.get("minute", "")
            label = f"{player} {minute}'"
            draw.text(
                (w * 0.75, scorer_y + i * line_height),
                label,
                fill=_hex_to_rgb(BRAND["gray_light"]),
                font=scorer_font,
                anchor="mm",
            )

        # ── Date / competition ───────────────────────────────────────────
        footer_font = _get_font(int(w * 0.018))
        draw.text(
            (w // 2, card_bottom - int(h * 0.03)),
            f"MLS 2026  |  {date_str}",
            fill=_hex_to_rgb(BRAND["gray"]),
            font=footer_font,
            anchor="mm",
        )

        # ── Watermark ───────────────────────────────────────────────────
        _add_watermark(draw, w, h)

        # ── Save ─────────────────────────────────────────────────────────
        filename = f"score_{match_id}_{size_key}.png"
        out_path = output_dir / filename
        img.save(out_path, "PNG", quality=95)
        outputs.append(out_path)

    return outputs


# ── Stat Card ────────────────────────────────────────────────────────────────

def generate_stat_card(
    stat_data: dict[str, Any],
    output_dir: str | Path,
    sizes: list[str] | None = None,
) -> list[Path]:
    """Generate a stat highlight card.

    Args:
        stat_data: Dict with:
            - ``stat_name``: e.g. "xG per 90"
            - ``stat_value``: e.g. "0.78"
            - ``player``: player name
            - ``context``: e.g. "3rd in MLS"
            - ``team``: team name
        output_dir: Output directory.
        sizes: Size keys.

    Returns:
        List of output paths.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []

    if sizes is None:
        sizes = ["twitter", "instagram"]

    stat_name = stat_data.get("stat_name", "Stat")
    stat_value = str(stat_data.get("stat_value", "—"))
    player = stat_data.get("player", "")
    context = stat_data.get("context", "")
    team = stat_data.get("team", "")

    for size_key in sizes:
        w, h = SIZES.get(size_key, SIZES["default"])
        bg = _hex_to_rgb(BRAND["bg"])
        img = Image.new("RGB", (w, h), bg)
        draw = ImageDraw.Draw(img)

        # ── Red accent bar at top ────────────────────────────────────────
        bar_height = 6
        draw.rectangle(
            [(0, 0), (w, bar_height)],
            fill=_hex_to_rgb(BRAND["red"]),
        )

        # ── Stat label ──────────────────────────────────────────────────
        label_font = _get_font(int(w * 0.03), bold=True)
        draw.text(
            (w // 2, h * 0.2),
            stat_name.upper(),
            fill=_hex_to_rgb(BRAND["red"]),
            font=label_font,
            anchor="mm",
        )

        # ── Big stat number ─────────────────────────────────────────────
        value_font = _get_font(int(w * 0.18), bold=True)
        draw.text(
            (w // 2, h * 0.45),
            stat_value,
            fill=_hex_to_rgb(BRAND["white"]),
            font=value_font,
            anchor="mm",
        )

        # ── Player name ─────────────────────────────────────────────────
        if player:
            player_font = _get_font(int(w * 0.04), bold=True)
            draw.text(
                (w // 2, h * 0.62),
                player,
                fill=_hex_to_rgb(BRAND["white"]),
                font=player_font,
                anchor="mm",
            )

        # ── Team ─────────────────────────────────────────────────────────
        if team:
            team_font = _get_font(int(w * 0.025))
            draw.text(
                (w // 2, h * 0.69),
                team,
                fill=_hex_to_rgb(BRAND["gray"]),
                font=team_font,
                anchor="mm",
            )

        # ── Context ──────────────────────────────────────────────────────
        if context:
            ctx_font = _get_font(int(w * 0.022))
            draw.text(
                (w // 2, h * 0.8),
                context,
                fill=_hex_to_rgb(BRAND["gray_light"]),
                font=ctx_font,
                anchor="mm",
            )

        _add_watermark(draw, w, h)

        safe_stat = stat_name.replace(" ", "_").lower()[:20]
        filename = f"stat_card_{safe_stat}_{size_key}.png"
        out_path = output_dir / filename
        img.save(out_path, "PNG", quality=95)
        outputs.append(out_path)

    return outputs


# ── Matchday Graphic ─────────────────────────────────────────────────────────

def generate_matchday_graphic(
    fixture_data: dict[str, Any],
    output_dir: str | Path,
    sizes: list[str] | None = None,
) -> list[Path]:
    """Generate a pre-match matchday graphic.

    Args:
        fixture_data: Dict with:
            - ``home_team``, ``away_team``
            - ``date``, ``time`` (display strings)
            - ``venue``
            - ``competition``
            - ``home_form``, ``away_form`` (e.g. "WWDLW")
        output_dir: Output directory.
        sizes: Size keys.

    Returns:
        List of output paths.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []

    if sizes is None:
        sizes = ["twitter", "instagram", "stories"]

    home = fixture_data.get("home_team", "Home")
    away = fixture_data.get("away_team", "Away")
    date = fixture_data.get("date", "")
    time = fixture_data.get("time", "")
    venue = fixture_data.get("venue", "")
    competition = fixture_data.get("competition", "MLS")
    home_form = fixture_data.get("home_form", "")
    away_form = fixture_data.get("away_form", "")

    for size_key in sizes:
        w, h = SIZES.get(size_key, SIZES["default"])
        bg = _hex_to_rgb(BRAND["bg"])
        img = Image.new("RGB", (w, h), bg)
        draw = ImageDraw.Draw(img)

        # ── Diagonal red accent ──────────────────────────────────────────
        accent = _hex_to_rgba(BRAND["red"], 30)
        for i in range(0, w + h, 3):
            draw.line([(i, 0), (0, i)], fill=accent, width=1)

        # ── "MATCHDAY" header ────────────────────────────────────────────
        header_font = _get_font(int(w * 0.035), bold=True)
        draw.text(
            (w // 2, h * 0.1),
            "MATCHDAY",
            fill=_hex_to_rgb(BRAND["red"]),
            font=header_font,
            anchor="mm",
        )

        # ── VS block ────────────────────────────────────────────────────
        team_font = _get_font(int(w * 0.055), bold=True)
        vs_font = _get_font(int(w * 0.03))

        center_y = h * 0.4
        draw.text(
            (w // 2, center_y - int(h * 0.08)),
            home.upper(),
            fill=_hex_to_rgb(BRAND["white"]),
            font=team_font,
            anchor="mm",
        )
        draw.text(
            (w // 2, center_y),
            "VS",
            fill=_hex_to_rgb(BRAND["red"]),
            font=vs_font,
            anchor="mm",
        )
        draw.text(
            (w // 2, center_y + int(h * 0.08)),
            away.upper(),
            fill=_hex_to_rgb(BRAND["white"]),
            font=team_font,
            anchor="mm",
        )

        # ── Date / time / venue ──────────────────────────────────────────
        info_font = _get_font(int(w * 0.025))
        info_y = h * 0.62
        info_parts = [p for p in [date, time, venue] if p]
        info_text = "  |  ".join(info_parts)
        draw.text(
            (w // 2, info_y),
            info_text,
            fill=_hex_to_rgb(BRAND["gray"]),
            font=info_font,
            anchor="mm",
        )

        # ── Form guide ──────────────────────────────────────────────────
        if home_form or away_form:
            form_font = _get_font(int(w * 0.02))
            form_y = h * 0.72

            form_colors = {
                "W": _hex_to_rgb(BRAND["success"]),
                "D": _hex_to_rgb(BRAND["warning"]),
                "L": _hex_to_rgb(BRAND["red"]),
            }

            # Draw form dots for home team
            if home_form:
                draw.text(
                    (w * 0.15, form_y - int(h * 0.03)),
                    "FORM",
                    fill=_hex_to_rgb(BRAND["gray"]),
                    font=_get_font(int(w * 0.015)),
                    anchor="mm",
                )
                for i, ch in enumerate(home_form[-5:]):
                    dot_x = int(w * 0.08 + i * w * 0.035)
                    color = form_colors.get(ch.upper(), _hex_to_rgb(BRAND["gray"]))
                    draw.ellipse(
                        [(dot_x - 8, int(form_y) - 8), (dot_x + 8, int(form_y) + 8)],
                        fill=color,
                    )
                    draw.text(
                        (dot_x, int(form_y)),
                        ch.upper(),
                        fill=_hex_to_rgb(BRAND["white"]),
                        font=_get_font(int(w * 0.012), bold=True),
                        anchor="mm",
                    )

            if away_form:
                draw.text(
                    (w * 0.85, form_y - int(h * 0.03)),
                    "FORM",
                    fill=_hex_to_rgb(BRAND["gray"]),
                    font=_get_font(int(w * 0.015)),
                    anchor="mm",
                )
                for i, ch in enumerate(away_form[-5:]):
                    dot_x = int(w * 0.73 + i * w * 0.035)
                    color = form_colors.get(ch.upper(), _hex_to_rgb(BRAND["gray"]))
                    draw.ellipse(
                        [(dot_x - 8, int(form_y) - 8), (dot_x + 8, int(form_y) + 8)],
                        fill=color,
                    )
                    draw.text(
                        (dot_x, int(form_y)),
                        ch.upper(),
                        fill=_hex_to_rgb(BRAND["white"]),
                        font=_get_font(int(w * 0.012), bold=True),
                        anchor="mm",
                    )

        # ── Competition badge ────────────────────────────────────────────
        comp_font = _get_font(int(w * 0.02))
        draw.text(
            (w // 2, h * 0.9),
            competition.upper(),
            fill=_hex_to_rgb(BRAND["gray"]),
            font=comp_font,
            anchor="mm",
        )

        _add_watermark(draw, w, h)

        filename = f"matchday_{home.replace(' ', '_').lower()}_vs_{away.replace(' ', '_').lower()}_{size_key}.png"
        out_path = output_dir / filename
        img.save(out_path, "PNG", quality=95)
        outputs.append(out_path)

    return outputs


def generate_from_file(
    data_path: str | Path,
    graphic_type: str,
    output_dir: str | Path,
) -> list[Path]:
    """Load data from JSON and generate the specified graphic type."""
    data = json.loads(Path(data_path).read_text(encoding="utf-8"))

    generators = {
        "score": generate_score_graphic,
        "stat_card": generate_stat_card,
        "matchday": generate_matchday_graphic,
    }

    gen = generators.get(graphic_type)
    if gen is None:
        raise ValueError(f"Unknown graphic type: {graphic_type}. Choose from: {list(generators.keys())}")

    return gen(data, output_dir)
