#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# South Ward Signal — Visualization Generator
#
# Usage:
#   bash scripts/generate-vizzes.sh --type shot_map --data ./data/match.json
#   bash scripts/generate-vizzes.sh --type all --data ./data/match.json --output ./output
#   bash scripts/generate-vizzes.sh --match-id 12345 --data ./data/match.json
# ──────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VIZ_DIR="$PROJECT_ROOT/packages/viz"
DEFAULT_OUTPUT="$PROJECT_ROOT/output/vizzes"

VIZ_TYPE="all"
DATA_FILE=""
OUTPUT_DIR="$DEFAULT_OUTPUT"
MATCH_ID=""

# ── Parse arguments ──────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --type)     VIZ_TYPE="$2"; shift 2 ;;
    --data)     DATA_FILE="$2"; shift 2 ;;
    --output)   OUTPUT_DIR="$2"; shift 2 ;;
    --match-id) MATCH_ID="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: generate-vizzes.sh --type <type> --data <path> [--output <dir>] [--match-id <id>]"
      echo ""
      echo "Types: shot_map, xg_timeline, pass_network, player_radar,"
      echo "       heatmap, standings_bump, score, stat_card, matchday, all"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$DATA_FILE" ]]; then
  echo "[ERROR] --data is required" >&2
  exit 1
fi

if [[ ! -f "$DATA_FILE" ]]; then
  echo "[ERROR] Data file not found: $DATA_FILE" >&2
  exit 1
fi

# ── Ensure output directory exists ───────────────────────────
mkdir -p "$OUTPUT_DIR"

# ── Set up Python environment ────────────────────────────────
echo "═══ South Ward Signal — Viz Generator ═══"
echo ""
echo "Type:   $VIZ_TYPE"
echo "Data:   $DATA_FILE"
echo "Output: $OUTPUT_DIR"
echo ""

cd "$VIZ_DIR"

# Create venv if it doesn't exist
if [[ ! -d ".venv" ]]; then
  echo "[SETUP] Creating Python virtual environment..."
  python3 -m venv .venv
fi

# Activate venv
if [[ -f ".venv/bin/activate" ]]; then
  source .venv/bin/activate
elif [[ -f ".venv/Scripts/activate" ]]; then
  source .venv/Scripts/activate
fi

# Install dependencies if needed
if ! python -c "import mplsoccer" 2>/dev/null; then
  echo "[SETUP] Installing Python dependencies..."
  pip install -q -r requirements.txt
fi

# ── Run the pipeline ─────────────────────────────────────────
CMD="python -m src.generate --type $VIZ_TYPE --data \"$DATA_FILE\" --output \"$OUTPUT_DIR\""

if [[ -n "$MATCH_ID" ]]; then
  CMD="$CMD --match-id $MATCH_ID"
fi

echo "[RUN] $CMD"
echo ""

eval "$CMD"

EXIT_CODE=$?

if [[ $EXIT_CODE -eq 0 ]]; then
  FILE_COUNT=$(find "$OUTPUT_DIR" -name "*.png" -newer "$DATA_FILE" 2>/dev/null | wc -l)
  echo ""
  echo "═══ Done. $FILE_COUNT file(s) in $OUTPUT_DIR ═══"
else
  echo ""
  echo "[ERROR] Pipeline exited with code $EXIT_CODE" >&2
fi

exit $EXIT_CODE
