const sharp = require('sharp');
const path = require('path');

// Heart shape test function - returns true if point is inside heart outline
function isInHeart(px, py, cx, cy, size) {
  // Normalize to [-1, 1] range centered on heart
  const x = (px - cx) / size;
  const y = -(py - cy) / size + 0.2; // flip Y, shift up slightly

  // Heart implicit equation: (x^2 + y^2 - 1)^3 < x^2 * y^3
  const val = Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y;
  return val;
}

async function makeBlueBunnyGif() {
  const inputPath = path.join(__dirname, '..', 'public', 'images', 'super-bunny.gif');
  const outputPath = path.join(__dirname, '..', 'public', 'images', 'super-bunny-blue.gif');

  const meta = await sharp(inputPath, { animated: true }).metadata();
  const numFrames = meta.pages;
  const frameWidth = meta.width;
  const frameHeight = meta.height / numFrames;

  console.log(`Processing ${numFrames} frames, each ${frameWidth}x${Math.round(frameHeight)}`);

  const processedFrames = [];

  for (let f = 0; f < numFrames; f++) {
    const { data, info } = await sharp(inputPath, { page: f, pages: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const ch = info.channels;
    const pixels = Buffer.from(data);
    const w = info.width;
    const h = info.height;

    // === STEP 1: Erase the S completely ===
    // The S/shield is centered around x=345, y=510
    // Use a generous elliptical region and erase ALL dark pixels within it
    const sCenterX = 345;
    const sCenterY = 505;
    const sRadiusX = 95;
    const sRadiusY = 105;

    for (let y = sCenterY - sRadiusY - 10; y < sCenterY + sRadiusY + 10 && y < h; y++) {
      for (let x = sCenterX - sRadiusX - 10; x < sCenterX + sRadiusX + 10 && x < w; x++) {
        if (x < 0 || y < 0) continue;
        const idx = (y * w + x) * ch;
        const a = ch >= 4 ? pixels[idx + 3] : 255;
        if (a < 10) continue;

        const dx = (x - sCenterX) / sRadiusX;
        const dy = (y - sCenterY) / sRadiusY;
        const dist = dx * dx + dy * dy;

        if (dist < 1.0) {
          const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Erase anything that's not pure white (the S, shield outline, anti-aliased edges)
          if (lum < 240) {
            pixels[idx] = 254;
            pixels[idx + 1] = 254;
            pixels[idx + 2] = 254;
          }
        }
      }
    }

    // === STEP 2: Draw a clean black heart ===
    const heartCx = sCenterX;
    const heartCy = sCenterY - 5;
    const heartSize = 42;

    for (let y = heartCy - heartSize * 2; y < heartCy + heartSize * 2 && y < h; y++) {
      for (let x = heartCx - heartSize * 2; x < heartCx + heartSize * 2 && x < w; x++) {
        if (x < 0 || y < 0) continue;
        const idx = (y * w + x) * ch;
        const a = ch >= 4 ? pixels[idx + 3] : 255;
        if (a < 10) continue;

        const val = isInHeart(x, y, heartCx, heartCy, heartSize);

        // Filled heart with smooth edge
        if (val < 0) {
          // Inside the heart - make it dark/black
          pixels[idx] = 10;
          pixels[idx + 1] = 15;
          pixels[idx + 2] = 30;
          if (ch >= 4) pixels[idx + 3] = 255;
        } else if (val < 0.08) {
          // Anti-aliased edge
          const edge = val / 0.08; // 0 to 1
          const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
          pixels[idx] = Math.round(10 + edge * (r - 10));
          pixels[idx + 1] = Math.round(15 + edge * (g - 15));
          pixels[idx + 2] = Math.round(30 + edge * (b - 30));
        }
      }
    }

    // === STEP 3: Tint everything blue (except carrot and heart) ===
    for (let i = 0; i < pixels.length; i += ch) {
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      const a = ch >= 4 ? pixels[i + 3] : 255;
      if (a < 10) continue;

      // Keep carrot orange
      if (r > 150 && g > 80 && b < 120 && r > b * 2) continue;
      if (r > 180 && g > 100 && b < 100) continue;

      // Keep carrot leaves green
      if (g > 100 && g > r * 0.9 && g > b * 1.3 && b < 120) continue;
      if (g > 80 && g > r && b < g && r < 160) continue;

      // Keep heart black (very dark pixels we just drew)
      if (r <= 10 && g <= 15 && b <= 30) continue;

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum > 230) {
        pixels[i] = 190; pixels[i + 1] = 215; pixels[i + 2] = 245;
      } else if (lum > 180) {
        const t = (lum - 180) / 50;
        pixels[i] = Math.round(100 + t * 90);
        pixels[i + 1] = Math.round(140 + t * 75);
        pixels[i + 2] = Math.round(210 + t * 35);
      } else if (lum > 80) {
        const t = (lum - 80) / 100;
        pixels[i] = Math.round(40 + t * 60);
        pixels[i + 1] = Math.round(70 + t * 70);
        pixels[i + 2] = Math.round(160 + t * 50);
      } else {
        const t = lum / 80;
        pixels[i] = Math.round(10 + t * 30);
        pixels[i + 1] = Math.round(20 + t * 50);
        pixels[i + 2] = Math.round(80 + t * 80);
      }
    }

    const framePng = await sharp(pixels, {
      raw: { width: w, height: h, channels: ch }
    }).png().toBuffer();

    processedFrames.push(framePng);
    process.stdout.write(`Frame ${f + 1}/${numFrames}\r`);
  }

  console.log('\nAssembling animated GIF...');

  // Build tall image by compositing all frames vertically
  const totalHeight = Math.round(frameHeight * numFrames);

  const tallImage = await sharp({
    create: {
      width: frameWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }
  })
    .composite(
      processedFrames.map((buf, i) => ({
        input: buf,
        top: Math.round(i * frameHeight),
        left: 0,
      }))
    )
    .raw()
    .toBuffer();

  await sharp(tallImage, {
    raw: { width: frameWidth, height: totalHeight, channels: 4 }
  })
    .gif({ delay: meta.delay || Array(numFrames).fill(100), loop: 0 })
    .toFile(outputPath);

  console.log(`Animated GIF saved: ${outputPath}`);

  // Also save frame 0 as PNG
  const pngPath = path.join(__dirname, '..', 'public', 'images', 'super-bunny-blue.png');
  await sharp(processedFrames[0]).toFile(pngPath);
  console.log(`Static PNG saved: ${pngPath}`);
}

makeBlueBunnyGif().catch(console.error);
