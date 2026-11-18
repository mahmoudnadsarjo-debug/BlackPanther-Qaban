#!/usr/bin/env bash
# Re-create the per-frame JPEGs the renderer reads (assets/ai/clips/<name>/) from the source clips in assets/ai/video.
# The frames are not stored in git (117 MB, fully regenerable). Run from the project root.
set -euo pipefail
for f in assets/ai/video/*.mp4; do
  python3 tools/clip_extract.py "$(basename "$f" .mp4)" "$f"
done
