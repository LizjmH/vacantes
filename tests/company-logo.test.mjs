import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  normalizeCompanyLogo,
  MAX_LOGO_BYTES,
} from "../src/lib/company-logo.ts";

test("accepts PNG, JPEG and WebP and stores a consistently readable PNG", async () => {
  for (const format of ["png", "jpeg", "webp"]) {
    const input = await sharp({
      create: {
        width: 40,
        height: 20,
        channels: 4,
        background: { r: 40, g: 80, b: 160, alpha: 0.5 },
      },
    })
      [format]()
      .toBuffer();
    const output = await normalizeCompanyLogo(input);
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.format, "png");
    assert.equal(metadata.width, 40);
    assert.equal(metadata.height, 20);
    if (format !== "jpeg") assert.equal(metadata.hasAlpha, true);
  }
});
test("large logos are resized proportionally without exceeding 1024 pixels", async () => {
  const input = await sharp({
    create: { width: 1800, height: 900, channels: 3, background: "#334455" },
  })
    .png()
    .toBuffer();
  const metadata = await sharp(await normalizeCompanyLogo(input)).metadata();
  assert.equal(metadata.width, 1024);
  assert.equal(metadata.height, 512);
});
test("rejects empty, oversized, disguised non-image and corrupt image uploads", async () => {
  for (const input of [
    new Uint8Array(),
    new Uint8Array(MAX_LOGO_BYTES + 1),
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    Buffer.from([255, 216, 255, 0, 0, 0]),
  ])
    await assert.rejects(normalizeCompanyLogo(input));
});
