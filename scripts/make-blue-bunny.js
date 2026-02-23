const sharp = require('sharp');
const path = require('path');

async function makeBlueBunny() {
  const inputPath = path.join(__dirname, '..', 'public', 'images', 'super-bunny-transparent.png');
  const outputPath = path.join(__dirname, '..', 'public', 'images', 'super-bunny-blue.png');

  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels; // 4 (RGBA)
  const pixels = Buffer.from(data); // copy

  for (let i = 0; i < pixels.length; i += ch) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    // Skip transparent pixels
    if (a < 10) continue;

    // Detect orange/warm colors (carrot body) — KEEP as-is
    // High R, medium-high G, low B
    if (r > 150 && g > 80 && b < 120 && r > b * 2) continue;
    // Also catch anti-aliased carrot edge pixels
    if (r > 180 && g > 100 && b < 100) continue;

    // Detect green (carrot leaves) — KEEP as-is
    if (g > 100 && g > r * 0.9 && g > b * 1.3 && b < 120) continue;
    // Darker greens
    if (g > 80 && g > r && b < g && r < 160) continue;

    // Everything else → convert to blue tones
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum > 230) {
      // White body areas → light blue
      pixels[i] = 190;     // R
      pixels[i + 1] = 215; // G
      pixels[i + 2] = 245; // B
    } else if (lum > 180) {
      // Light gray (anti-aliased edges near white) → lighter blue
      const t = (lum - 180) / 50; // 0..1
      pixels[i] = Math.round(100 + t * 90);      // R: 100-190
      pixels[i + 1] = Math.round(140 + t * 75);   // G: 140-215
      pixels[i + 2] = Math.round(210 + t * 35);   // B: 210-245
    } else if (lum > 80) {
      // Medium gray → medium blue
      const t = (lum - 80) / 100; // 0..1
      pixels[i] = Math.round(40 + t * 60);        // R: 40-100
      pixels[i + 1] = Math.round(70 + t * 70);    // G: 70-140
      pixels[i + 2] = Math.round(160 + t * 50);   // B: 160-210
    } else {
      // Dark (outlines, mask, cape, shadow) → dark blue
      const t = lum / 80; // 0..1
      pixels[i] = Math.round(10 + t * 30);        // R: 10-40
      pixels[i + 1] = Math.round(20 + t * 50);    // G: 20-70
      pixels[i + 2] = Math.round(80 + t * 80);    // B: 80-160
    }
  }

  await sharp(pixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    }
  })
    .png()
    .toFile(outputPath);

  console.log(`Blue bunny saved to ${outputPath} (${info.width}x${info.height})`);
}

makeBlueBunny().catch(console.error);
