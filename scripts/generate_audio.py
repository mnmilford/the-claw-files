#!/usr/bin/env python3
"""
Simple audio generator for Deepfield Transmissions
- Usage: python3 generate_audio.py <manifest_slug>
- Reads: ./research/<slug>.md and ./manifest.json for metadata
- Writes: ./audio/<slug>.mp3

Notes: uses ElevenLabs TTS via ELEVENLABS_API_KEY in env and ffmpeg (installed).
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional

import requests

REPO_ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = REPO_ROOT / "audio"
VOICE_ID = "cHOrs9LmiwE0zjLu3gsQ"  # Lil Mike v4 (serious)
ELEVEN_KEY_ENV = "ELEVENLABS_API_KEY"


def load_manifest():
    p = REPO_ROOT / "manifest.json"
    return json.loads(p.read_text(encoding="utf-8"))


def find_entry(manifest, slug):
    for e in manifest.get("entries", []):
        if e.get("slug") == slug:
            return e
    return None


def read_markdown_body(slug: str) -> str:
    p = REPO_ROOT / "research" / f"{slug}.md"
    if not p.exists():
        raise FileNotFoundError(p)
    text = p.read_text(encoding="utf-8")
    # strip IG tokens and any frontmatter-like separators
    text = re.sub(r"\[\[ig:(https?:\/\/[^\]]+)\]\]", "", text)
    return text.strip()


def eleven_tts(voice_id: str, text: str, out_path: Path, api_key: str):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {"text": text}
    with requests.post(url, headers=headers, json=payload, stream=True, timeout=120) as r:
        r.raise_for_status()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "wb") as fh:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    fh.write(chunk)


def ffmpeg_run(args, check=True):
    cmd = ["ffmpeg", "-y"] + args
    print("ffmpeg", " ".join(args))
    return subprocess.run(cmd, check=check)


def make_background(duration: float, out_path: Path):
    # simple low-frequency sine hum as atmosphere
    # ffmpeg -f lavfi -i "sine=frequency=80:duration=12" -af "volume=0.03" out.wav
    ffmpeg_run(["-f", "lavfi", "-i", f"sine=frequency=80:duration={duration}", "-af", "volume=0.03", str(out_path)])


def mix_voice_and_bgm(voice_path: Path, bg_path: Path, out_path: Path):
    # Mix background low volume under voice
    # ffmpeg -i voice -i bg -filter_complex "[1:a]volume=0.05[a1];[0:a][a1]amix=inputs=2:duration=shortest" -c:a libmp3lame -b:a 128k out
    ffmpeg_run([
        "-i",
        str(voice_path),
        "-i",
        str(bg_path),
        "-filter_complex",
        "[1:a]volume=0.05[a1];[0:a][a1]amix=inputs=2:duration=shortest",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "128k",
        str(out_path),
    ])


def concat_mp3s(mp3_list: list[Path], out_path: Path):
    # Use concat filter
    inputs = []
    for p in mp3_list:
        inputs += ["-i", str(p)]
    n = len(mp3_list)
    filter_spec = ""
    for i in range(n):
        filter_spec += f"[{i}:0]"
    filter_spec += f"concat=n={n}:v=0:a=1[out]"
    cmd = ["-y"] + inputs + ["-filter_complex", filter_spec, "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "128k", str(out_path)]
    subprocess.run(["ffmpeg"] + cmd, check=True)


def build_reading_text(entry: dict, md_body: str) -> str:
    # Use manifest metadata for date/title/summary
    date = entry.get("date", "")
    title = entry.get("title", "")
    summary = entry.get("summary", "")
    # Pull first ~800 characters of body (strip markdown)
    plain = re.sub(r"[#*`>\-\[\]!()"]", "", md_body)
    plain = re.sub(r"\n{2,}", "\n\n", plain).strip()
    preview = plain[:4000]
    reading = f"{date}. {title}. {summary}.\n\n{preview}"
    return reading


def generate_audio_for_slug(slug: str, api_key: str) -> Optional[Path]:
    manifest = load_manifest()
    entry = find_entry(manifest, slug)
    if not entry:
        print(f"Manifest entry not found for {slug}")
        return None

    md_body = read_markdown_body(slug)

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix=f"audiogen-{slug}-"))

    try:
        intro_text = f"Signal acquired. Filing from {entry.get('location', {}).get('city', '')}, {entry.get('location', {}).get('country', '')}. This is Deepfield Transmissions. Playing dispatch." 
        intro_voice = tmp / "intro_voice.mp3"
        print("Generating intro TTS...")
        eleven_tts(VOICE_ID, intro_text, intro_voice, api_key)

        # background hum 12s
        bg = tmp / "bg.wav"
        print("Generating background hum...")
        make_background(12, bg)

        final_intro = tmp / "final_intro.mp3"
        print("Mixing intro + bg...")
        mix_voice_and_bgm(intro_voice, bg, final_intro)

        # full reading
        reading_text = build_reading_text(entry, md_body)
        reading_voice = tmp / "reading_voice.mp3"
        print("Generating reading TTS (this may take a while)...")
        eleven_tts(VOICE_ID, reading_text, reading_voice, api_key)

        # concat intro + reading
        out_final = AUDIO_DIR / f"{slug}.mp3"
        print("Concatenating final audio...")
        concat_mp3s([final_intro, reading_voice], out_final)

        print(f"Wrote: {out_final}")
        return out_final
    finally:
        try:
            shutil.rmtree(tmp)
        except Exception:
            pass


def main(argv):
    if len(argv) < 2:
        print("Usage: generate_audio.py <manifest_slug>")
        return 2
    slug = argv[1]
    api_key = os.environ.get(ELEVEN_KEY_ENV)
    if not api_key:
        print(f"Environment variable {ELEVEN_KEY_ENV} not set", file=sys.stderr)
        return 3
    try:
        out = generate_audio_for_slug(slug, api_key)
        if out:
            return 0
        return 1
    except Exception as exc:
        print(f"Error generating audio: {exc}", file=sys.stderr)
        return 4


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
