#!/bin/bash
# Packages the Aedifex freeware downloads into web2/downloads and rewrites downloads/config.js,
# downloads/SHA256SUMS and downloads/LICENSE-FREEWARE.txt. The zips are committed in the site
# repo and served next to the page (as on the Motus site), not from GitHub Releases.
#
#   bash web2/package.sh                    build both platforms and package them
#   SKIP_WIN=1 bash web2/package.sh         macOS only (an existing Windows zip of this version stays listed)
#   SKIP_MAC=1 bash web2/package.sh         Windows only (likewise for macOS)
#   SKIP_BUILD=1 bash web2/package.sh       package the binaries already in target/ without running cargo
#   AEDIFEX_DIR=/path/to/aedifex            the source tree (default: ../aedifex next to web2)
#   EXAMPLES="a.aedifex b.aedifex"          extra example models (default: the three below, if they load)
#
# macOS: universal Aedifex.app (lipo of x86_64-apple-darwin and aarch64-apple-darwin), ad-hoc signed,
# not notarised. Windows: x86_64-pc-windows-gnu cross-built with MinGW, GUI subsystem, icon from
# app/build.rs. The text files in the zips come from downloads/bundle/.
set -euo pipefail
WEB="$(cd "$(dirname "$0")" && pwd)"
SRC="${AEDIFEX_DIR:-$(cd "$WEB/../aedifex" && pwd)}"
OUT="$WEB/downloads"; BUNDLE="$OUT/bundle"
REL="$SRC/target/release"; ARM="$SRC/target/aarch64-apple-darwin/release"; WIN="$SRC/target/x86_64-pc-windows-gnu/release"
VER=$(grep -m1 '^version' "$SRC/app/Cargo.toml" | cut -d'"' -f2)
DATE=$(date +%Y-%m-%d)
BIM="$(cd "$SRC/.." && pwd)"
EXAMPLES="${EXAMPLES:-$BIM/thai_house_5/thai_house_5.aedifex $BIM/office_rebar.aedifex $BIM/tower7.aedifex}"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

# ---- build
if [ -z "${SKIP_BUILD:-}" ]; then
  if [ -z "${SKIP_MAC:-}" ]; then
    rustup target list --installed | grep -q aarch64-apple-darwin || rustup target add aarch64-apple-darwin
    (cd "$SRC" && cargo build --release -p aedifex && cargo build --release -p aedifex --target aarch64-apple-darwin)
  fi
  if [ -z "${SKIP_WIN:-}" ]; then
    rustup target list --installed | grep -q x86_64-pc-windows-gnu || rustup target add x86_64-pc-windows-gnu
    # -mwindows: GUI subsystem, so no console window opens beside the app
    (cd "$SRC" && CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc \
      CARGO_TARGET_X86_64_PC_WINDOWS_GNU_RUSTFLAGS="-C link-arg=-mwindows" \
      cargo build --release -p aedifex --target x86_64-pc-windows-gnu)
  fi
fi

# ---- examples: the built-in sample house written through the MCP server, plus models that still load
HOST="$REL/aedifex"; [ -x "$HOST" ] || HOST="$ARM/aedifex"
EX="$TMP/examples"; mkdir -p "$EX"
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"package","version":"1"}}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"new_project","arguments":{"name":"Sample house","sample":true}}}' \
  | "$HOST" --mcp --autosave "$EX/sample_house.aedifex" >/dev/null
[ -s "$EX/sample_house.aedifex" ] || { echo "sample house was not written" >&2; exit 1; }
for f in $EXAMPLES; do
  if [ -f "$f" ] && "$HOST" export-ifc "$f" "$TMP/check.ifc" 2>/dev/null; then cp "$f" "$EX/"; else echo "skipping example $f (missing or does not load)" >&2; fi
done

common() { # $1 = destination folder
  mkdir -p "$1"; cp -R "$EX" "$1/"
  sed "s/@VERSION@/$VER/" "$BUNDLE/README.txt" > "$1/README.txt"
  cp "$BUNDLE/LICENSE-FREEWARE.txt" "$BUNDLE/THIRD-PARTY-NOTICES.txt" "$BUNDLE/LICENSE-APACHE-2.0.txt" "$1/"
}
mb() { awk -v b="$1" 'BEGIN{ printf "%.1f MB", b/1048576 }'; }
entries=()
add() { # key file meta
  local f="$OUT/$2" sha bytes
  sha=$(shasum -a 256 "$f" | cut -d' ' -f1); bytes=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")
  [ "$bytes" -gt $((95*1048576)) ] && echo "WARNING: $2 is $(mb "$bytes"), over 95 MB: GitHub refuses files over 100 MB, use GitHub Releases" >&2
  entries+=("    $1: { url: \"downloads/$2\", size: \"$(mb "$bytes")\", meta: \"$3\", sha256: \"$sha\" }")
}

# ---- macOS
MAC_ZIP="Aedifex-$VER-macos-universal.zip"
if [ -z "${SKIP_MAC:-}" ]; then
  [ -x "$REL/aedifex" ] && [ -x "$ARM/aedifex" ] || { echo "need both $REL/aedifex and $ARM/aedifex" >&2; exit 1; }
  D="$TMP/Aedifex-$VER-macos"; APP="$D/Aedifex.app"
  mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
  lipo -create "$REL/aedifex" "$ARM/aedifex" -output "$APP/Contents/MacOS/aedifex"
  strip -x "$APP/Contents/MacOS/aedifex"   # local symbols only; before signing
  cp "$SRC/app/assets/Aedifex.icns" "$APP/Contents/Resources/Aedifex.icns"
  cat > "$APP/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Aedifex</string>
  <key>CFBundleDisplayName</key><string>Aedifex</string>
  <key>CFBundleIdentifier</key><string>org.aedifex.app</string>
  <key>CFBundleVersion</key><string>$VER</string>
  <key>CFBundleShortVersionString</key><string>$VER</string>
  <key>CFBundleExecutable</key><string>aedifex</string>
  <key>CFBundleIconFile</key><string>Aedifex</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSHumanReadableCopyright</key><string>Copyright (c) 2026 Sompote Youwai. Freeware.</string>
  <key>CFBundleDocumentTypes</key><array>
    <dict><key>CFBundleTypeName</key><string>Aedifex project</string>
      <key>CFBundleTypeExtensions</key><array><string>aedifex</string></array>
      <key>CFBundleTypeIconFile</key><string>Aedifex</string>
      <key>CFBundleTypeRole</key><string>Editor</string><key>LSHandlerRank</key><string>Owner</string></dict>
    <dict><key>CFBundleTypeName</key><string>Revit project</string>
      <key>CFBundleTypeExtensions</key><array><string>rvt</string></array>
      <key>CFBundleTypeRole</key><string>Viewer</string><key>LSHandlerRank</key><string>Alternate</string></dict>
  </array>
</dict></plist>
EOF
  xattr -cr "$APP"; codesign --force --deep -s - "$APP"
  common "$D"
  rm -f "$OUT"/Aedifex-*-macos-*.zip
  (cd "$TMP" && ditto -c -k --norsrc --keepParent "Aedifex-$VER-macos" "$OUT/$MAC_ZIP")
fi
[ -f "$OUT/$MAC_ZIP" ] && add mac "$MAC_ZIP" "Universal (Apple silicon + Intel) · macOS 11+"

# ---- Windows
WIN_ZIP="Aedifex-$VER-windows-x86_64.zip"
if [ -z "${SKIP_WIN:-}" ]; then
  [ -f "$WIN/aedifex.exe" ] || { echo "need $WIN/aedifex.exe" >&2; exit 1; }
  D="$TMP/Aedifex-$VER-windows"; mkdir -p "$D"; cp "$WIN/aedifex.exe" "$D/"; x86_64-w64-mingw32-strip "$D/aedifex.exe"; common "$D"
  rm -f "$OUT"/Aedifex-*-windows-*.zip
  (cd "$TMP" && zip -qrX "$OUT/$WIN_ZIP" "Aedifex-$VER-windows")
fi
[ -f "$OUT/$WIN_ZIP" ] && add win "$WIN_ZIP" "x86_64 · Windows 10+"

# ---- listing, checksums, licence for the page
cp "$BUNDLE/LICENSE-FREEWARE.txt" "$OUT/LICENSE-FREEWARE.txt"
(cd "$OUT" && ls Aedifex-*.zip >/dev/null 2>&1 && shasum -a 256 Aedifex-*.zip > SHA256SUMS || : > SHA256SUMS)
{
  echo "// Written by web2/package.sh. A platform left out shows \"Coming soon\"."
  echo "window.AEDIFEX_DOWNLOADS = {"
  echo "  version: \"$VER\","
  echo "  date: \"$DATE\","
  echo "  files: {"
  ( IFS=$'\n'; echo "${entries[*]-}" | sed '$!s/$/,/' )
  echo "  },"
  echo "};"
} > "$OUT/config.js"
cat "$OUT/config.js"; cat "$OUT/SHA256SUMS"
