from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


BASE_IMAGE = Path("/root/Projects/deepfield-transmissions/instagram/2026-03-06-tokyo-1.png")
OUT_DIR = Path("/root/Projects/deepfield-transmissions/research/overlay-variants")
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
BOLD_FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"


def rounded_border_mask(size, margin, radius, width):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    x1 = y1 = margin
    x2 = size[0] - margin
    y2 = size[1] - margin
    for offset in range(width):
        draw.rounded_rectangle(
            [x1 + offset, y1 + offset, x2 - offset, y2 - offset],
            radius=max(1, radius - offset // 2),
            outline=255,
            width=1,
        )
    return mask


def add_scan_lines(overlay, color, count, opacity):
    draw = ImageDraw.Draw(overlay)
    w, h = overlay.size
    positions = [int(h * frac) for frac in (0.22, 0.64, 0.81)[:count]]
    for y in positions:
        draw.rectangle([70, y, w - 70, y + 2], fill=(*color, opacity))


def add_edge_aberration(base, shift):
    r, g, b = base.split()
    r = r.transform(r.size, Image.AFFINE, (1, 0, shift, 0, 1, 0))
    b = b.transform(b.size, Image.AFFINE, (1, 0, -shift, 0, 1, 0))
    return Image.merge("RGB", (r, g, b))


def add_vignette(base, strength):
    w, h = base.size
    vignette = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(vignette)
    for i in range(12):
        inset = i * 24
        alpha = int(strength * (i + 1) / 12)
        draw.rounded_rectangle(
            [inset, inset, w - inset, h - inset],
            radius=max(10, 120 - i * 6),
            outline=alpha,
            width=40,
        )
    vignette = vignette.filter(ImageFilter.GaussianBlur(40))
    shade = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shade.putalpha(vignette)
    return Image.alpha_composite(base.convert("RGBA"), shade)


def telemetry_block(draw, font, bold_font, style, w, h):
    lines = [
        "LOC: 35.6764N, 139.6500E",
        "SIG: ▮▮▮▮▯",
        "FIELD LOG #047",
        "TX MODE: ACTIVE",
    ]
    if style["telemetry_position"] == "bottom":
        x, y = 92, h - 130
        draw.rounded_rectangle(
            [70, h - 165, w - 70, h - 58],
            radius=18,
            fill=(4, 18, 24, style["panel_alpha"]),
            outline=(*style["color"], style["line_alpha"]),
            width=2,
        )
        step = 32
        draw.text((x, y), " · ".join(lines), font=font, fill=(*style["color"], 218))
    else:
        box = [72, h - 250, 420, h - 72]
        draw.rounded_rectangle(
            box,
            radius=18,
            fill=(5, 18, 23, style["panel_alpha"]),
            outline=(*style["color"], style["line_alpha"]),
            width=2,
        )
        draw.text((94, h - 228), "OPTIC TELEMETRY", font=bold_font, fill=(*style["color"], 220))
        step = 34
        for idx, line in enumerate(lines):
            draw.text((94, h - 188 + idx * step), line, font=font, fill=(*style["color"], 205))


def draw_glyph(draw, style, w):
    cx, cy = w - 78, 80
    outer = [(cx, cy - 16), (cx + 16, cy), (cx, cy + 16), (cx - 16, cy)]
    inner = [(cx, cy - 8), (cx + 8, cy), (cx, cy + 8), (cx - 8, cy)]
    draw.polygon(outer, outline=(*style["color"], style["glyph_alpha"]), fill=(0, 0, 0, 0), width=2)
    draw.polygon(inner, outline=(*style["color"], min(255, style["glyph_alpha"] + 30)), fill=(0, 0, 0, 0), width=2)


def render_variant(name, style):
    base = Image.open(BASE_IMAGE).convert("RGB").resize((1024, 1024))
    if style["aberration"]:
        base = add_edge_aberration(base, style["aberration"])
    composed = add_vignette(base, style["vignette"])
    overlay = Image.new("RGBA", composed.size, (0, 0, 0, 0))
    w, h = composed.size
    mask = rounded_border_mask((w, h), style["margin"], style["radius"], style["line_width"])
    glow = Image.new("RGBA", (w, h), (*style["color"], 0))
    glow.putalpha(mask.filter(ImageFilter.GaussianBlur(style["glow_blur"])))
    overlay = Image.alpha_composite(overlay, glow)
    lines = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(lines).bitmap((0, 0), mask, fill=(*style["color"], style["line_alpha"]))
    overlay = Image.alpha_composite(overlay, lines)
    add_scan_lines(overlay, style["color"], style["scan_lines"], style["scan_alpha"])
    draw = ImageDraw.Draw(overlay)
    font = ImageFont.truetype(FONT_PATH, style["font_size"])
    bold_font = ImageFont.truetype(BOLD_FONT_PATH, style["bold_size"])
    telemetry_block(draw, font, bold_font, style, w, h)
    draw_glyph(draw, style, w)
    final = Image.alpha_composite(composed, overlay).convert("RGB")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{name}.png"
    final.save(out_path, quality=95)
    return out_path


STYLES = {
    "option-1-balanced": {
        "color": (105, 228, 232),
        "margin": 44,
        "radius": 34,
        "line_width": 3,
        "line_alpha": 188,
        "glow_blur": 10,
        "panel_alpha": 120,
        "glyph_alpha": 122,
        "scan_lines": 2,
        "scan_alpha": 42,
        "aberration": 1.2,
        "vignette": 82,
        "font_size": 23,
        "bold_size": 27,
        "telemetry_position": "bottom",
    },
    "option-2-cleaner": {
        "color": (97, 214, 206),
        "margin": 56,
        "radius": 26,
        "line_width": 2,
        "line_alpha": 154,
        "glow_blur": 7,
        "panel_alpha": 92,
        "glyph_alpha": 98,
        "scan_lines": 1,
        "scan_alpha": 28,
        "aberration": 0.7,
        "vignette": 58,
        "font_size": 21,
        "bold_size": 24,
        "telemetry_position": "left",
    },
    "option-3-cinematic": {
        "color": (76, 235, 246),
        "margin": 38,
        "radius": 40,
        "line_width": 3,
        "line_alpha": 205,
        "glow_blur": 13,
        "panel_alpha": 132,
        "glyph_alpha": 138,
        "scan_lines": 3,
        "scan_alpha": 54,
        "aberration": 1.7,
        "vignette": 108,
        "font_size": 22,
        "bold_size": 26,
        "telemetry_position": "bottom",
    },
}


def main():
    for name, style in STYLES.items():
        path = render_variant(name, style)
        print(path)


if __name__ == "__main__":
    main()
