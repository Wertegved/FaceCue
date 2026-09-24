const STORAGE_KEY = 'facecue_session';

export function getSessionProgress() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveEmotionAttempt(emotionKey, score) {
  const progress = getSessionProgress();
  const previousAttempts = Array.isArray(progress[emotionKey]?.attempts)
    ? progress[emotionKey].attempts.filter((attempt) => Number.isFinite(attempt))
    : [];
  const previousScore = previousAttempts.length ? previousAttempts[previousAttempts.length - 1] : null;
  const attempts = [...previousAttempts, score];

  progress[emotionKey] = {
    attempts,
    best: Math.max(...attempts),
  };

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Session storage can be unavailable in restricted browser contexts.
  }

  if (previousScore === null) {
    return null;
  }

  return {
    previousScore,
    currentScore: score,
    delta: score - previousScore,
  };
}

export function saveEmotionProbabilities(scores) {
  const progress = getSessionProgress();
  const previous = {};
  const current = {};

  Object.entries(scores).forEach(([emotionKey, score]) => {
    if (!Number.isFinite(score)) {
      return;
    }

    const attempts = Array.isArray(progress[emotionKey]?.attempts)
      ? progress[emotionKey].attempts.filter((attempt) => Number.isFinite(attempt))
      : [];
    const previousScore = attempts.length ? attempts[attempts.length - 1] : null;

    previous[emotionKey] = previousScore;
    current[emotionKey] = score;
    progress[emotionKey] = {
      attempts: [...attempts, score],
      current: score,
      best: Math.max(...attempts, score),
    };
  });

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Session storage can be unavailable in restricted browser contexts.
  }

  return { previous, current };
}
