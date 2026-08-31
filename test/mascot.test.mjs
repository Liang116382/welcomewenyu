import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mascotPath = new URL('../assets/minister-mascot.png', import.meta.url);

function readPng(imagePath) {
  const image = readFileSync(imagePath);
  return { image, width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
}

test('publishes a decorative fixed mascot with a local image', () => {
  assert.match(page, /<div class="floating-mascot" aria-hidden="true">/);
  assert.match(page, /<img src="assets\/minister-mascot\.png" alt="">/);
  assert.match(page, /\.floating-mascot\s*\{[^}]*position:\s*fixed;/);
  assert.match(page, /@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?\.floating-mascot img \{ animation: mascot-bob/);
  assert.ok(existsSync(mascotPath), 'the page must ship its mascot image locally');
});

test('ships a compact transparent mascot PNG', () => {
  assert.ok(existsSync(mascotPath), 'the mascot image must exist');
  const { image, width, height } = readPng(mascotPath);
  assert.equal(image[25], 6, 'the mascot PNG must preserve its alpha channel');
  assert.ok(width <= 400 && height <= 400, 'the mascot must be sized for its small on-page display');
});