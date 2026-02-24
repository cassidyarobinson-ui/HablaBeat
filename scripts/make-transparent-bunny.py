#!/usr/bin/env python3
"""
Remove the white background from super-bunny.gif, producing super-bunny-nobg.gif
with a true transparent background on every frame.
"""

from PIL import Image
import os

INPUT  = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'super-bunny.gif')
OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'super-bunny-nobg.gif')

# White threshold — pixels with R,G,B all above this value are considered background
WHITE_THRESH = 240
# Fringe tolerance — semi-white border pixels (anti-aliasing) get partially transparent
FRINGE_THRESH = 200

def remove_white(frame: Image.Image) -> Image.Image:
    """Convert a single GIF frame to RGBA and make white pixels transparent."""
    rgba = frame.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Pure / near-white → fully transparent
            if r > WHITE_THRESH and g > WHITE_THRESH and b > WHITE_THRESH:
                pixels[x, y] = (r, g, b, 0)
            # Anti-alias fringe → partially transparent
            elif r > FRINGE_THRESH and g > FRINGE_THRESH and b > FRINGE_THRESH:
                # Scale alpha: 0 at WHITE_THRESH, 255 at FRINGE_THRESH
                ratio = (r - FRINGE_THRESH) / (WHITE_THRESH - FRINGE_THRESH)
                new_a = int(a * (1.0 - ratio))
                pixels[x, y] = (r, g, b, new_a)
    return rgba

def process_gif():
    src = Image.open(INPUT)
    frames = []
    durations = []

    try:
        while True:
            dur = src.info.get('duration', 80)
            processed = remove_white(src.copy())
            frames.append(processed)
            durations.append(dur)
            src.seek(src.tell() + 1)
    except EOFError:
        pass

    print(f"Processed {len(frames)} frames")

    if not frames:
        raise ValueError("No frames found!")

    frames[0].save(
        OUTPUT,
        save_all=True,
        append_images=frames[1:],
        loop=0,
        duration=durations,
        disposal=2,   # clear to transparent between frames
        optimize=False,
    )
    print(f"Saved → {OUTPUT}")

if __name__ == '__main__':
    process_gif()
