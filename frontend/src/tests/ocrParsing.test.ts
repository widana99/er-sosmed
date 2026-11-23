import { cleanOcrNumber, extractProfileFromText, extractPostFromText } from '../services/ocrService.js';

function runTests() {
  console.log('--- Starting OCR Parser Unit Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // Number Cleaners
  assert(cleanOcrNumber('14,2 rb') === 14200, '14,2 rb should be 14200');
  assert(cleanOcrNumber('25.4K') === 25400, '25.4K should be 25400');
  assert(cleanOcrNumber('1.5M') === 1500000, '1.5M should be 1500000');
  assert(cleanOcrNumber('1,250') === 1250, '1,250 should be 1250');
  assert(cleanOcrNumber('840') === 840, '840 should be 840');

  // Profile Text Extraction
  const sampleProfileText = `
    ujangfootstep
    @ujangfootstep
    16 posts
    12.4K followers
    540 following
    Creator Konten Edukasi
  `;
  const profile = extractProfileFromText(sampleProfileText);
  assert(profile.username === 'ujangfootstep', `Username should be ujangfootstep (Got: ${profile.username})`);
  assert(profile.followers === 12400, `Followers should be 12400 (Got: ${profile.followers})`);
  assert(profile.following === 540, `Following should be 540 (Got: ${profile.following})`);

  // Post Text Extraction
  const samplePostText = `
    1,450 likes
    85 comments
    24.5K views
    32 shares
    Peluncuran program baru di Surabaya
  `;
  const post = extractPostFromText(samplePostText);
  assert(post.likes === 1450, `Likes should be 1450 (Got: ${post.likes})`);
  assert(post.comments === 85, `Comments should be 85 (Got: ${post.comments})`);
  assert(post.views === 24500, `Views should be 24500 (Got: ${post.views})`);
  assert(post.shares === 32, `Shares should be 32 (Got: ${post.shares})`);

  console.log(`--- OCR Parser Tests: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0 && typeof (globalThis as any).process !== 'undefined') (globalThis as any).process.exit(1);
}

runTests();
