import { StatisticsService } from '../services/StatisticsService.js';
import { AnalyticsEngine } from '../services/AnalyticsEngine.js';

function runTests() {
  console.log('--- Starting StatisticsService Unit Tests ---');
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

  // 1. Median Tests
  const oddArray = [2.5, 1.2, 5.0, 8.4, 3.1]; // Sorted: 1.2, 2.5, 3.1, 5.0, 8.4 -> Median: 3.1
  assert(StatisticsService.calculateMedian(oddArray) === 3.1, 'Median of odd length array should be 3.1');

  const evenArray = [10, 2, 4, 8]; // Sorted: 2, 4, 8, 10 -> Median: (4 + 8) / 2 = 6.0
  assert(StatisticsService.calculateMedian(evenArray) === 6.0, 'Median of even length array should be 6.0');

  const singleElement = [4.75];
  assert(StatisticsService.calculateMedian(singleElement) === 4.75, 'Median of single element should be 4.75');

  // 2. Min / Max & Spread
  const minMaxRes = StatisticsService.calculateMinMax([1.5, 4.0, 9.2, 0.8, 6.1]);
  assert(minMaxRes.min === 0.8, 'Min should be 0.8');
  assert(minMaxRes.max === 9.2, 'Max should be 9.2');
  assert(minMaxRes.spread === 8.4, 'Spread should be 8.4');

  // 3. Quartiles
  const quartileData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const quartiles = StatisticsService.calculateQuartiles(quartileData);
  assert(quartiles.median === 5.5, 'Median should be 5.5');
  assert(quartiles.q1 > 0 && quartiles.q3 > quartiles.q1, 'Q1 and Q3 should be properly bounded');
  assert(quartiles.iqr === Number((quartiles.q3 - quartiles.q1).toFixed(2)), 'IQR should equal Q3 - Q1');

  // 4. Consistency Score
  // Low variance array -> High consistency score
  const consistentData = [3.0, 3.1, 3.2, 2.9, 3.0];
  const highConsistency = StatisticsService.calculateConsistency(consistentData);
  assert(highConsistency >= 80, `Consistent data should yield score >= 80 (Got: ${highConsistency})`);

  // High variance array (viral outlier + flat posts) -> Low consistency score
  const erraticData = [1.0, 1.1, 0.9, 45.0, 1.2];
  const lowConsistency = StatisticsService.calculateConsistency(erraticData);
  assert(lowConsistency < 50, `Erratic outlier data should yield score < 50 (Got: ${lowConsistency})`);

  // 5. Distribution Tiering
  const erSamples = [0.8, 1.5, 2.4, 3.5, 4.8, 5.5, 6.2, 9.8, 14.5];
  const dist = StatisticsService.calculateDistribution(erSamples);
  assert(dist.lowCount === 2, 'Low count (<2%) should be 2');
  assert(dist.moderateCount === 3, 'Moderate count (2-5%) should be 3');
  assert(dist.highCount === 2, 'High count (5-8%) should be 2');
  assert(dist.viralCount === 2, 'Viral count (>8%) should be 2');

  // 6. Comment-to-Like Ratio & Bot Risk
  const naturalEngagement = StatisticsService.evaluateInteractionQuality(10000, 250); // 2.5% comments
  assert(naturalEngagement.ratio === 2.5, 'Ratio should be 2.5%');
  assert(naturalEngagement.botRisk === 'LOW', '2.5% comments should have LOW bot risk');

  const suspiciousEngagement = StatisticsService.evaluateInteractionQuality(100000, 40); // 0.04% comments
  assert(suspiciousEngagement.ratio === 0.04, 'Ratio should be 0.04%');
  assert(suspiciousEngagement.botRisk === 'HIGH', 'Very low comments with high likes should have HIGH bot risk');

  // 7. Full AnalyticsEngine.calculateComprehensiveAnalytics Test
  const compResult = AnalyticsEngine.calculateComprehensiveAnalytics({
    platform: 'INSTAGRAM',
    username: 'test_creator',
    followers: 10000,
    posts: [
      { likes: 300, comments: 20 },
      { likes: 500, comments: 50 },
      { likes: 250, comments: 10 },
      { likes: 3500, comments: 200 }, // Outlier viral post
    ],
  });

  assert(compResult.sampleSize === 4, 'Sample size should be 4');
  assert(compResult.averageER > compResult.medianER, 'Average ER should be higher than Median ER due to outlier');
  assert(compResult.minER === 2.6, `Min ER should be 2.6% (Got: ${compResult.minER}%)`);
  assert(compResult.maxER === 37.0, `Max ER should be 37.0% (Got: ${compResult.maxER}%)`);
  assert(compResult.postsRanked[0].tier === 'VIRAL', 'Top post should be marked VIRAL');
  assert(compResult.rateCardValuation.minIdr > 0, 'Rate card should be computed');

  console.log(`--- Unit Tests Finished: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) process.exit(1);
}

runTests();
