import { describe, it, expect } from 'vitest';
import {
  initializeChallenge,
  recordChallengeMilestone,
  getChallengeAnalytics,
  CHALLENGE_TEMPLATES,
  BADGE_TIERS,
} from '../gamifiedChallengesEngine';

describe('gamifiedChallengesEngine', () => {
  it('initializes the 52-week challenge with progressive milestones and $1,378 target', () => {
    const challenge = initializeChallenge('WEEKS_52');

    expect(challenge.templateId).toBe('WEEKS_52');
    expect(challenge.totalStepsCount).toBe(52);
    expect(challenge.totalTarget).toBe(1378);
    expect(challenge.milestones[0].targetAmount).toBe(1);
    expect(challenge.milestones[51].targetAmount).toBe(52);
    expect(challenge.currentSaved).toBe(0);
    expect(challenge.isCompleted).toBe(false);
  });

  it('records milestone completions, tracks consecutive streak and awards XP', () => {
    let challenge = initializeChallenge('NO_IMPULSE_30');

    // Complete day 1
    challenge = recordChallengeMilestone(challenge, 1);
    expect(challenge.completedStepsCount).toBe(1);
    expect(challenge.currentStreak).toBe(1);
    expect(challenge.currentSaved).toBe(10);
    expect(challenge.xpEarned).toBeGreaterThan(0);

    // Complete day 2
    challenge = recordChallengeMilestone(challenge, 2);
    expect(challenge.completedStepsCount).toBe(2);
    expect(challenge.currentStreak).toBe(2);
    expect(challenge.currentSaved).toBe(20);
  });

  it('evaluates badge tiers and unlocks Diamond on 100% completion', () => {
    let challenge = initializeChallenge('HOMEMADE_COFFEE_30');

    // Complete all 30 days
    for (let d = 1; d <= 30; d++) {
      challenge = recordChallengeMilestone(challenge, d);
    }

    const analytics = getChallengeAnalytics(challenge);
    expect(analytics.percentage).toBe(100);
    expect(analytics.isCompleted).toBe(true);
    expect(analytics.badgeKey).toBe(BADGE_TIERS.DIAMOND.key);
    expect(analytics.remainingToSave).toBe(0);
  });
});
