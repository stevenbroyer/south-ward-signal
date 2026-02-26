"""
South Ward Signal — Brand styling configuration for all visualizations.

Provides consistent dark-theme, NYRB-branded styling across every chart,
map, and graphic the pipeline produces.
"""

from __future__ import annotations

import matplotlib as mpl
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.figure import Figure
from matplotlib.axes import Axes
from pathlib import Path
from typing import Any

# ── Brand Palette ────────────────────────────────────────────────────────────

BRAND = {
    "bg": "#0A0A0C",
    "card_bg": "#111114",
    "card_elevated": "#18181C",
    "red": "#ED1A3D",
    "red_glow": "rgba(237, 26, 61, 0.15)",
    "red_muted": "#C4162F",
    "accent": "#FF4D6A",
    "gold": "#D4A843",
    "white": "#F5F5F7",
    "gray": "#6E6E7A",
    "gray_light": "#A0A0AC",
    "gray_dark": "#2A2A32",
    "grid": "#2A2A32",
    "success": "#22C55E",
    "warning": "#F59E0B",
    "info": "#3B82F6",
}

# ── Team Colors ──────────────────────────────────────────────────────────────

NYRB_COLORS = {
    "primary": "#ED1A3D",
    "secondary": "#FFFFFF",
    "tertiary": "#121326",
}

OPPONENT_COLORS = {
    "primary": "#6E6E7A",
    "secondary": "#A0A0AC",
}

# ── Typography ───────────────────────────────────────────────────────────────

FONT_FAMILY = "sans-serif"
FONT_TITLE_SIZE = 18
FONT_SUBTITLE_SIZE = 12
FONT_LABEL_SIZE = 10
FONT_TICK_SIZE = 9
FONT_WATERMARK_SIZE = 8

# ── Output Dimensions ───────────────────────────────────────────────────────

SIZES = {
    "twitter": (1200, 675),
    "instagram": (1080, 1080),
    "stories": (1080, 1920),
    "default": (1200, 800),
    "wide": (1600, 900),
}

DPI = 150


def apply_brand_style() -> None:
    """Apply South Ward Signal brand style globally to matplotlib."""
    mpl.rcParams.update(
        {
            "figure.facecolor": BRAND["bg"],
            "axes.facecolor": BRAND["card_bg"],
            "axes.edgecolor": BRAND["grid"],
            "axes.labelcolor": BRAND["white"],
            "axes.titlecolor": BRAND["white"],
            "text.color": BRAND["white"],
            "xtick.color": BRAND["gray"],
            "ytick.color": BRAND["gray"],
            "grid.color": BRAND["grid"],
            "grid.alpha": 0.4,
            "grid.linewidth": 0.5,
            "figure.dpi": DPI,
            "savefig.dpi": DPI,
            "savefig.facecolor": BRAND["bg"],
            "savefig.edgecolor": "none",
            "savefig.bbox": "tight",
            "savefig.pad_inches": 0.3,
            "font.family": FONT_FAMILY,
            "font.size": FONT_LABEL_SIZE,
            "axes.titlesize": FONT_TITLE_SIZE,
            "axes.labelsize": FONT_LABEL_SIZE,
            "xtick.labelsize": FONT_TICK_SIZE,
            "ytick.labelsize": FONT_TICK_SIZE,
            "legend.fontsize": FONT_TICK_SIZE,
            "legend.facecolor": BRAND["card_bg"],
            "legend.edgecolor": BRAND["grid"],
            "legend.labelcolor": BRAND["white"],
        }
    )


def create_figure(
    width: int | None = None,
    height: int | None = None,
    size_key: str = "default",
    nrows: int = 1,
    ncols: int = 1,
) -> tuple[Figure, Any]:
    """Create a branded figure with the given dimensions.

    Args:
        width: Pixel width (overrides size_key).
        height: Pixel height (overrides size_key).
        size_key: Preset size name from SIZES dict.
        nrows: Number of subplot rows.
        ncols: Number of subplot columns.

    Returns:
        Tuple of (figure, axes).
    """
    apply_brand_style()

    if width and height:
        w_in, h_in = width / DPI, height / DPI
    else:
        px = SIZES.get(size_key, SIZES["default"])
        w_in, h_in = px[0] / DPI, px[1] / DPI

    fig, axes = plt.subplots(nrows, ncols, figsize=(w_in, h_in))
    fig.set_facecolor(BRAND["bg"])

    return fig, axes


def add_watermark(fig: Figure, text: str = "SOUTH WARD SIGNAL") -> None:
    """Add a subtle branded watermark in the bottom-right of the figure."""
    fig.text(
        0.97,
        0.02,
        text,
        fontsize=FONT_WATERMARK_SIZE,
        color=BRAND["gray"],
        alpha=0.5,
        ha="right",
        va="bottom",
        fontstyle="italic",
        fontweight="bold",
        transform=fig.transFigure,
    )


def add_title_block(
    fig: Figure,
    title: str,
    subtitle: str = "",
    x: float = 0.03,
    y_title: float = 0.96,
    y_subtitle: float = 0.93,
) -> None:
    """Add a branded title and subtitle to the figure."""
    fig.text(
        x,
        y_title,
        title,
        fontsize=FONT_TITLE_SIZE,
        fontweight="bold",
        color=BRAND["white"],
        transform=fig.transFigure,
    )
    if subtitle:
        fig.text(
            x,
            y_subtitle,
            subtitle,
            fontsize=FONT_SUBTITLE_SIZE,
            color=BRAND["gray"],
            transform=fig.transFigure,
        )


def add_footer(fig: Figure, source: str = "Data: ASA / API-Football / FBref") -> None:
    """Add a source attribution footer."""
    fig.text(
        0.03,
        0.02,
        source,
        fontsize=FONT_WATERMARK_SIZE,
        color=BRAND["gray"],
        alpha=0.6,
        ha="left",
        va="bottom",
        transform=fig.transFigure,
    )


def save_figure(fig: Figure, path: str | Path, close: bool = True) -> Path:
    """Save figure to disk with brand styling applied.

    Args:
        fig: The matplotlib figure.
        path: Output file path.
        close: Whether to close the figure after saving.

    Returns:
        The resolved output path.
    """
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, facecolor=fig.get_facecolor(), edgecolor="none")
    if close:
        plt.close(fig)
    return out


def brand_color_cycle() -> list[str]:
    """Return a color cycle suitable for multi-series charts."""
    return [
        BRAND["red"],
        BRAND["info"],
        BRAND["gold"],
        BRAND["success"],
        BRAND["accent"],
        BRAND["warning"],
        BRAND["gray_light"],
    ]
