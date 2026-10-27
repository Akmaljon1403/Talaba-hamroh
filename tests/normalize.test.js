import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUzbekText,
  transliterateCyrillicToLatin,
  calculateSimilarity
} from '../src/bot/utils/text.js';

test('transliterateCyrillicToLatin correctly transliterates Uzbek Cyrillic', () => {
  assert.equal(transliterateCyrillicToLatin('Анатомия'), 'anatomiya');
  assert.equal(transliterateCyrillicToLatin('Фармакология'), 'farmakologiya');
  assert.equal(transliterateCyrillicToLatin('Ўзбекистон'), 'o\'zbekiston');
  assert.equal(transliterateCyrillicToLatin('Ғаниев'), 'g\'aniyev');
});

test('normalizeUzbekText normalizes apostrophes and handles case', () => {
  assert.equal(normalizeUzbekText('O‘zbek tili'), 'o\'zbek tili');
  assert.equal(normalizeUzbekText('O`zbek tili'), 'o\'zbek tili');
  assert.equal(normalizeUzbekText('G‘aybulla'), 'g\'aybulla');
  assert.equal(normalizeUzbekText('  Anatomiya   va   Gistologiya  '), 'anatomiya va gistologiya');
});

test('calculateSimilarity accurately identifies token matches', () => {
  assert.equal(calculateSimilarity('anatomiya', 'anatomiya'), 1.0);
  assert.ok(calculateSimilarity('Odam anatomiyasi', 'anatomiya') > 0.5);
  assert.equal(calculateSimilarity('pediatriya', 'jarrohlik'), 0.0);
});
