#!/usr/bin/env bash
# Installs and enables the "Guake Follow Cursor" GNOME Shell extension.
#
# Usage:
#   ./install.sh
#
# What it does:
#   1. Copies metadata.json and extension.js into the per-user extensions
#      directory GNOME Shell scans for extensions.
#   2. Makes sure user extensions are not globally disabled
#      (org.gnome.shell disable-user-extensions).
#   3. Enables the extension via `gnome-extensions enable`.
#
# Notes:
#   - On Wayland, GNOME Shell only rescans the extensions directory on
#     login. If this is the FIRST time this UUID is installed, you must
#     log out and log back in before `enable` will succeed.
#   - Re-running this script after editing extension.js is safe; use
#     `gnome-extensions disable/enable <uuid>` (or logout/login) to pick
#     up code changes.

set -euo pipefail

UUID="guake-follow-cursor@[placeholder].local"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

echo "==> Installing extension files to $DEST_DIR"
mkdir -p "$DEST_DIR"
cp "$SRC_DIR/metadata.json" "$DEST_DIR/metadata.json"
cp "$SRC_DIR/extension.js" "$DEST_DIR/extension.js"

echo "==> Ensuring user extensions are enabled globally"
gsettings set org.gnome.shell disable-user-extensions false

if ! command -v gnome-extensions >/dev/null 2>&1; then
    echo "ERROR: gnome-extensions CLI not found. Install gnome-shell-extension-prefs / gnome-shell." >&2
    exit 1
fi

echo "==> Attempting to enable $UUID"
if gnome-extensions enable "$UUID" 2>/dev/null; then
    echo "==> Enabled successfully."
    gnome-extensions info "$UUID"
else
    echo
    echo "GNOME Shell does not see the extension yet."
    echo "This is expected on Wayland the FIRST time a new extension UUID is added:"
    echo "the shell only scans its extensions directory at login."
    echo
    echo "  1. Log out."
    echo "  2. Log back in."
    echo "  3. Run: gnome-extensions enable $UUID"
    exit 1
fi
