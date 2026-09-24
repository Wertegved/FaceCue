import { useEffect, useMemo, useRef, useState } from 'react';
import { EMOTIONS } from './data/emotions';
import { analyzeImage, generateFeedback } from './services/api';
import ParticleBackground from './components/ParticleBackground';
import FaceCueLogo from './components/FaceCueLogo';
import CameraCapture from './components/CameraCapture';
import { getSessionProgress, saveEmotionProbabilities } from './utils/sessionProgress';

const emptyResult = {
  label: '',
  confidence: 0,
  all_probs: {},
};

const EMOTION_THEMES = {
  happy: { accent: '#ffb547', accentStrong: '#e78319', glow: 'rgba(255, 181, 71, 0.24)' },
  sad: { accent: '#38bdf8', accentStrong: '#1676b6', glow: 'rgba(56, 189, 248, 0.22)' },
  angry: { accent: '#ff6b6b', accentStrong: '#c84350', glow: 'rgba(255, 107, 107, 0.23)' },
  fear: { accent: '#9b8cff', accentStrong: '#6554c0', glow: 'rgba(155, 140, 255, 0.24)' },
  surprise: { accent: '#f472b6', accentStrong: '#d2448a', glow: 'rgba(244, 114, 182, 0.22)' },
  neutral: { accent: '#67d4d1', accentStrong: '#299794', glow: 'rgba(103, 212, 209, 0.2)' },
  disgust: { accent: '#67c587', accentStrong: '#318b55', glow: 'rgba(103, 197, 135, 0.22)' },
};

function getTheme(emotion) {
  return EMOTION_THEMES[emotion?.key] || EMOTION_THEMES.neutral;
}

function emotionKeyFromLabel(label) {
  const match = EMOTIONS.find((emotion) => emotion.name.toLowerCase() === label?.toLowerCase());
  return match?.key || 'neutral';
}

function getEmotionProbability(allProbs, emotion) {
  const entry = Object.entries(allProbs || {}).find(([label]) => {
    const normalizedLabel = label.toLowerCase();
    return normalizedLabel === emotion.key || normalizedLabel === emotion.name.toLowerCase();
  });
  const probability = Number(entry?.[1]);
  return Number.isFinite(probability) ? probability * 100 : null;
}

function getEmotionScores(allProbs) {
  return EMOTIONS.reduce((emotionScores, emotion) => {
    emotionScores[emotion.key] = getEmotionProbability(allProbs, emotion);
    return emotionScores;
  }, {});
}

const EMOJI_BURST_PARTICLES = [
  { left: '8%', top: '12%', size: '1.45rem', opacity: 0.42, delay: '-1.8s', duration: '8.8s', drift: '48px', fall: '108px', rotation: '-18deg', scale: 0.84 },
  { left: '31%', top: '4%', size: '1.7rem', opacity: 0.52, delay: '-5.1s', duration: '10.4s', drift: '34px', fall: '124px', rotation: '14deg', scale: 0.92 },
  { left: '68%', top: '9%', size: '1.35rem', opacity: 0.38, delay: '-3.4s', duration: '9.6s', drift: '-42px', fall: '116px', rotation: '22deg', scale: 0.78 },
  { left: '86%', top: '24%', size: '1.8rem', opacity: 0.48, delay: '-7.2s', duration: '11.2s', drift: '-30px', fall: '102px', rotation: '-12deg', scale: 0.88 },
  { left: '3%', top: '47%', size: '1.6rem', opacity: 0.46, delay: '-4.6s', duration: '9.2s', drift: '38px', fall: '92px', rotation: '18deg', scale: 0.86 },
  { left: '89%', top: '51%', size: '1.4rem', opacity: 0.36, delay: '-2.7s', duration: '10.8s', drift: '-52px', fall: '96px', rotation: '-20deg', scale: 0.8 },
  { left: '17%', top: '75%', size: '1.3rem', opacity: 0.34, delay: '-8.4s', duration: '12.4s', drift: '28px', fall: '76px', rotation: '12deg', scale: 0.76 },
  { left: '74%', top: '72%', size: '1.55rem', opacity: 0.4, delay: '-6.3s', duration: '11.8s', drift: '-36px', fall: '82px', rotation: '-16deg', scale: 0.84 },
];

function FaceCueVisual({ emotion, compact = false }) {
  const theme = getTheme(emotion);

  return (
    <div
      className={`face-visual ${emotion.key} ${compact ? 'compact' : ''}`}
      style={{ '--emotion-accent': theme.accent, '--emotion-strong': theme.accentStrong, '--emotion-glow': theme.glow }}
      aria-label={`${emotion.name} expression visual`}
      role="img"
    >
      <span className="visual-ring ring-one" />
      <span className="visual-ring ring-two" />
      <span className="visual-ring ring-three" />
      {!compact && (
        <span className="emoji-burst" aria-hidden="true">
          {EMOJI_BURST_PARTICLES.map((particle, index) => (
            <span
              key={index}
              className="burst-emoji"
              style={{
                '--burst-left': particle.left,
                '--burst-top': particle.top,
                '--burst-size': particle.size,
                '--burst-opacity': particle.opacity,
                '--burst-delay': particle.delay,
                '--burst-duration': particle.duration,
                '--burst-drift': particle.drift,
                '--burst-fall': particle.fall,
                '--burst-rotation': particle.rotation,
                '--burst-scale': particle.scale,
              }}
            >
              {emotion.emoji}
            </span>
          ))}
        </span>
      )}
      <span className="face-core">
        <span className="face-emoji" aria-hidden="true">{emotion.emoji}</span>
        <span className="face-particle particle-one" />
        <span className="face-particle particle-two" />
        <span className="face-particle particle-three" />
      </span>
      {!compact && <span className="visual-caption">{emotion.name}</span>}
    </div>
  );
}

function EmotionProgress({ sessionProgress, probabilitySnapshot, selectedEmotion }) {
  return (
    <section className="session-progress" aria-labelledby="session-progress-title">
      <div className="session-progress-header">
        <h3 id="session-progress-title">Session progress</h3>
        <span>All emotions</span>
      </div>
      <ul className="session-progress-list">
        {EMOTIONS.map((emotion) => {
          const storedEmotion = sessionProgress[emotion.key];
          const storedAttempts = Array.isArray(storedEmotion?.attempts) ? storedEmotion.attempts : [];
          const storedScore = Number(storedEmotion?.current ?? storedAttempts[storedAttempts.length - 1] ?? 0);
          const score = Number.isFinite(storedScore) ? storedScore : 0;
          const previousScore = probabilitySnapshot?.previous?.[emotion.key];
          const hasPreviousScore = Number.isFinite(previousScore);
          const delta = hasPreviousScore ? score - previousScore : null;
          const theme = getTheme(emotion);

          return (
            <li
              key={emotion.key}
              className={selectedEmotion.key === emotion.key ? 'session-progress-row selected' : 'session-progress-row'}
              style={{ '--progress-accent': theme.accent, '--progress-glow': theme.glow }}
            >
              <div className="session-progress-label">
                <span aria-hidden="true">{emotion.emoji}</span>
                <span>{emotion.name}</span>
              </div>
              <div
                className="session-progress-track"
                role="progressbar"
                aria-label={`${emotion.name} emotion score: ${score.toFixed(1)} percent`}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={score}
              >
                <span
                  className="session-progress-fill"
                  style={{ width: `${score}%`, '--progress-start': hasPreviousScore ? previousScore / 100 : 0 }}
                />
              </div>
              <div className="session-progress-value">
                <strong>{score.toFixed(1)}%</strong>
                {hasPreviousScore && (
                  <small className={delta < 0 ? 'negative-delta' : ''}>
                    {delta > 0 ? '+' : delta < 0 ? '-' : ''}{Math.abs(delta).toFixed(1)} pts
                  </small>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function App() {
  const [selectedEmotion, setSelectedEmotion] = useState(EMOTIONS[0]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(emptyResult);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('home');
  const [dragActive, setDragActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [probabilitySnapshot, setProbabilitySnapshot] = useState(null);
  const [sessionProgress, setSessionProgress] = useState(() => getSessionProgress());
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener?.('change', updateMotionPreference);

    return () => mediaQuery.removeEventListener?.('change', updateMotionPreference);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && previewOpen) {
        setPreviewOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = previewOpen ? 'hidden' : '';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, previewOpen]);

  useEffect(() => {
    if (reducedMotion || step !== 'home') {
      setPointerOffset({ x: 0, y: 0 });
      return;
    }

    const handlePointerMove = (event) => {
      const heroNode = document.querySelector('.hero-visual-wrap');
      if (!heroNode) return;

      const rect = heroNode.getBoundingClientRect();
      const offsetX = ((event.clientX - (rect.left + rect.width / 2)) / rect.width) * 10;
      const offsetY = ((event.clientY - (rect.top + rect.height / 2)) / rect.height) * 10;
      setPointerOffset({ x: Math.max(-8, Math.min(8, offsetX)), y: Math.max(-8, Math.min(8, offsetY)) });
    };

    const handlePointerLeave = () => setPointerOffset({ x: 0, y: 0 });

    const heroNode = document.querySelector('.hero-visual-wrap');
    heroNode?.addEventListener('pointermove', handlePointerMove);
    heroNode?.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      heroNode?.removeEventListener('pointermove', handlePointerMove);
      heroNode?.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [reducedMotion, step]);

  useEffect(() => {
    if (step !== 'practice') {
      setIsCameraOpen(false);
    }
  }, [step]);

  const probabilityRows = useMemo(() => {
    const scores = getEmotionScores(result.all_probs);
    return EMOTIONS
      .map((emotion) => ({ emotion, score: scores[emotion.key] }))
      .filter(({ score }) => score !== null)
      .sort((a, b) => b.score - a.score);
  }, [result]);

  const activeTheme = getTheme(selectedEmotion);
  const detectedEmotion = EMOTIONS.find((emotion) => emotion.key === emotionKeyFromLabel(result.label)) || selectedEmotion;

  function handleEmotionSelect(emotion) {
    setSelectedEmotion(emotion);
    setError('');
    if (step === 'result') {
      setStep('home');
    }
  }

  function assignImage(file) {
    if (!file) {
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(emptyResult);
    setProbabilitySnapshot(null);
    setFeedback('');
    setError('');
    setIsProcessing(false);
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    assignImage(file);
    event.target.value = '';
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragActive(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    assignImage(file);
  }

  function openCamera() {
    setError('');
    setIsCameraOpen(true);
  }

  function handleCameraCapture(file) {
    assignImage(file);
    setIsCameraOpen(false);
  }

  function handleCameraError(message) {
    setError(message);
    setIsCameraOpen(false);
  }

  async function handleSubmit() {
    if (!imageFile) {
      setError('Please upload a photo before analyzing your expression.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setFeedback('');

    try {
      const analysis = await analyzeImage(imageFile);
      const response = await generateFeedback(analysis, selectedEmotion.name);
      const scores = getEmotionScores(analysis.all_probs);
      const snapshot = saveEmotionProbabilities(scores);
      setResult(analysis);
      setProbabilitySnapshot(snapshot);
      setSessionProgress(getSessionProgress());
      setFeedback(response.message || '');
      setStep('result');
    } catch (err) {
      const message = err?.message || 'Something went wrong while analyzing the image. Please try again.';
      if (message.toLowerCase().includes('no face')) {
        setError('No face detected. Please try another photo with a clear view of your face.');
      } else {
        setError('Something went wrong while analyzing the image. Please try again.');
      }
      setStep('practice');
    } finally {
      setIsProcessing(false);
    }
  }

  function resetPractice() {
    setImageFile(null);
    setImagePreview('');
    setResult(emptyResult);
    setProbabilitySnapshot(null);
    setFeedback('');
    setError('');
    setIsProcessing(false);
    setStep('practice');
  }

  function chooseAnotherEmotion() {
    setImageFile(null);
    setImagePreview('');
    setResult(emptyResult);
    setProbabilitySnapshot(null);
    setFeedback('');
    setError('');
    setIsProcessing(false);
    setStep('home');
  }

  return (
    <div
      className={`app-shell app-${step}`}
      data-emotion={selectedEmotion.key}
      style={{ '--emotion-accent': activeTheme.accent, '--emotion-strong': activeTheme.accentStrong, '--emotion-glow': activeTheme.glow }}
    >
      <ParticleBackground />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <button type="button" className="brand-button" onClick={() => setStep('home')}>
          <FaceCueLogo />
          <span>FaceCue</span>
        </button>

        <div className="header-context">
          <span className="context-dot" />
          <span>{step === 'home' ? 'Expression lab' : `${selectedEmotion.name} practice`}</span>
        </div>

        {step !== 'home' && (
          <button type="button" className="secondary-button topbar-action" onClick={chooseAnotherEmotion}>
            Choose Another Emotion
          </button>
        )}
      </header>

      {step === 'home' && (
        <main className="page home-page">
          <section className="hero hero-grid">
            <div className="hero-copy-block">
              <p className="eyebrow">Emotion Practice Studio</p>
              <h1>
                Practice the expression.
                <span>Feel the difference.</span>
              </h1>
              <p className="hero-copy">
                Train your face to match the feeling you want to control, then let FaceCue read the result.
              </p>
              <div className="hero-actions">
                <button type="button" className="secondary-button hero-secondary" onClick={() => setPreviewOpen(true)}>
                  Preview {selectedEmotion.name}
                </button>
              </div>
            </div>

            <div
              className="hero-visual-wrap"
              style={{ '--pointer-x': `${pointerOffset.x}px`, '--pointer-y': `${pointerOffset.y}px` }}
            >
              <div className="micro-label label-one">Expression</div>
              <div className="micro-label label-two">Practice</div>
              <div className="micro-label label-three">Feedback</div>
              <div className="visual-shell">
                <FaceCueVisual emotion={selectedEmotion} />
              </div>
              <span className="orbit-tag orbit-top">Express</span>
              <span className="orbit-tag orbit-bottom">Interpret</span>
            </div>
          </section>

          <section className="emotion-panel" aria-label="Emotion choices">
            <div className="emotion-header">
              <p className="section-label">What do you want to practice?</p>
            </div>

            <div className="emotion-grid">
              {EMOTIONS.map((emotion) => {
                const theme = getTheme(emotion);
                const selected = selectedEmotion.key === emotion.key;

                return (
                  <button
                    key={emotion.key}
                    type="button"
                    className={`emotion-card ${emotion.key} ${selected ? 'selected' : ''}`}
                    style={{ '--card-accent': theme.accent, '--card-glow': theme.glow }}
                    onClick={() => {
                      handleEmotionSelect(emotion);
                      setPreviewOpen(false);
                    }}
                    aria-pressed={selected}
                  >
                    <span className="emotion-check" aria-hidden="true">
                      {selected ? '✓' : ''}
                    </span>
                    <span className="emotion-emoji" aria-hidden="true">
                      {emotion.emoji}
                    </span>
                    <span className="emotion-label">{emotion.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="selection-cta">
            <div className="selection-cta-copy">
              <p className="section-label">Ready to train</p>
              <strong>{selectedEmotion.name} mode</strong>
            </div>
            <button type="button" className="primary-button selection-button" onClick={() => setStep('practice')}>
              Practice {selectedEmotion.name} →
            </button>
          </div>

          <div className="workflow-strip" aria-label="How it works">
            <div className="workflow-step active">
              <span className="workflow-index">01</span>
              <span>Choose</span>
            </div>
            <span className="workflow-arrow">→</span>
            <div className="workflow-step">
              <span className="workflow-index">02</span>
              <span>Practice</span>
            </div>
            <span className="workflow-arrow">→</span>
            <div className="workflow-step">
              <span className="workflow-index">03</span>
              <span>Improve</span>
            </div>
          </div>
        </main>
      )}

      {previewOpen && (
        <div className="modal-backdrop" onClick={() => setPreviewOpen(false)}>
          <div
            className="preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="modal-close" onClick={() => setPreviewOpen(false)} aria-label="Close preview">
              Close
            </button>

            <div className="preview-modal-header">
              <p className="eyebrow">Preview</p>
              <h3 id="preview-title">{selectedEmotion.name}</h3>
            </div>

            <div className="preview-modal-content">
              <div className="preview-modal-visual preview-emotion-visual">
                <div className="preview-emotion-face">
                  <FaceCueVisual emotion={selectedEmotion} />
                </div>
                <span className="preview-emotion-name">{selectedEmotion.name}</span>
              </div>

              <div className="preview-copy-block">
                <h4>{selectedEmotion.previewTitle}</h4>
                <p>{selectedEmotion.summary}</p>

                <div className="preview-guide">
                  <span className="section-label">How to show it</span>
                  <ul>
                    {selectedEmotion.cues.map((cue) => (
                      <li key={cue}>{cue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'practice' && (
        <main className="page practice-page">
          <section className="practice-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow subtle">Practice</p>
                <h2>{selectedEmotion.name}</h2>
              </div>
              <div className="practice-badge" aria-label={`Selected emotion ${selectedEmotion.name}`}>
                <span>{selectedEmotion.emoji}</span>
              </div>
            </div>

            <div className="practice-intro">
              <FaceCueVisual emotion={selectedEmotion} compact />
              <div>
                <span className="section-label">Your cue</span>
                <p>Make your expression, then capture it.</p>
              </div>
            </div>

            <p className="panel-subtitle">Show your expression and submit it for analysis.</p>

            <div className="upload-box">
              <input
                id="photo-upload"
                ref={fileInputRef}
                className="upload-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                aria-label="Upload an image to analyze"
              />
              {isCameraOpen ? (
                <CameraCapture onCapture={handleCameraCapture} onCancel={() => setIsCameraOpen(false)} onError={handleCameraError} />
              ) : imagePreview ? (
                <div className="image-preview-wrap">
                  <img src={imagePreview} alt="Selected expression preview" className="image-preview" />
                  <div className="image-actions">
                    <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>
                      Replace Image
                    </button>
                    <button type="button" className="secondary-button" onClick={openCamera}>
                      Use Camera
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setError('');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`upload-dropzone image-source-dropzone ${dragActive ? 'drag-active' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <span className="upload-icon" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="upload-title">Add your expression</span>
                  <span className="upload-caption">Choose a saved photo from your device or take a new one with your camera.</span>
                  <div className="source-choice-group">
                    <button type="button" className="secondary-button source-choice-button" onClick={() => fileInputRef.current?.click()}>
                      Choose Image
                    </button>
                    <span className="source-choice-or">or</span>
                    <button type="button" className="secondary-button source-choice-button" onClick={openCamera}>
                      Use Camera
                    </button>
                  </div>
                  <span className="source-drop-hint">You can also drop an image here.</span>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="loading-state" aria-live="polite">
                <div className="analysis-visual">
                  <FaceCueVisual emotion={selectedEmotion} compact />
                </div>
                <div className="analysis-copy">
                  <strong>FaceCue is reading your expression...</strong>
                  <p>Scanning the face and comparing it to your target emotion.</p>
                </div>
              </div>
            )}

            {error && <p className="status-message error">{error}</p>}

            <button
              type="button"
              className="primary-button"
              disabled={!imageFile || isProcessing}
              onClick={handleSubmit}
            >
              {isProcessing ? 'Analyzing your expression...' : `Analyze ${selectedEmotion.name}`}
            </button>

            <EmotionProgress
              sessionProgress={sessionProgress}
              probabilitySnapshot={probabilitySnapshot}
              selectedEmotion={selectedEmotion}
            />
          </section>
        </main>
      )}

      {step === 'result' && (
        <main className="page result-page">
          <section className="result-panel">
            <div className="result-header">
              <div>
                <p className="eyebrow subtle">Your expression</p>
                <h2>{result.label || detectedEmotion.name}</h2>
              </div>
              <div className="confidence-pill">
                {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : '—'} confidence
              </div>
            </div>

            <div className="result-shell" style={{ '--result-accent': getTheme(detectedEmotion).accent, '--result-glow': getTheme(detectedEmotion).glow }}>
              <div className="result-card">
                <div className="result-summary">
                  <FaceCueVisual emotion={detectedEmotion} compact />
                  <div>
                    <p className="label-small">FaceCue interpreted your expression as</p>
                    <h3>{result.label || 'Unknown'}</h3>
                  </div>
                </div>

                <div className="meta-grid">
                  <div>
                    <span className="label-small">Target emotion</span>
                    <strong>{selectedEmotion.name}</strong>
                  </div>
                  <div>
                    <span className="label-small">Confidence</span>
                    <strong>{result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : '—'}</strong>
                  </div>
                </div>
              </div>

              <div className="breakdown-box">
                <h3>Probability breakdown</h3>
                <ul className="probability-list">
                  {probabilityRows.map(({ emotion, score }) => {
                    const previousScore = probabilitySnapshot?.previous?.[emotion.key];
                    const hasPreviousScore = Number.isFinite(previousScore);
                    const delta = hasPreviousScore ? score - previousScore : null;
                    const theme = getTheme(emotion);

                    return (
                      <li key={emotion.key} className={selectedEmotion.key === emotion.key ? 'selected-probability' : ''}>
                        <span>{emotion.name}</span>
                        <div
                          className="probability-bar-track"
                          role="progressbar"
                          aria-label={`${emotion.name} probability`}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-valuenow={score}
                        >
                          <span
                            className="probability-bar"
                            style={{
                              width: `${Math.max(score, 0)}%`,
                              '--bar-start': hasPreviousScore ? previousScore / 100 : 0,
                              '--result-accent': theme.accent,
                              '--result-glow': theme.glow,
                            }}
                          />
                        </div>
                        <div className="probability-value">
                          <strong>{score.toFixed(1)}%</strong>
                          {hasPreviousScore && (
                            <small className={delta < 0 ? 'negative-delta' : ''}>
                              {delta > 0 ? '+' : delta < 0 ? '-' : ''}{Math.abs(delta).toFixed(1)} pts
                            </small>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="feedback-box" style={{ '--feedback-accent': getTheme(detectedEmotion).accent }}>
              <div className="feedback-heading">
                <span className="feedback-icon">✦</span>
                <h3>Coaching note</h3>
              </div>
              <div className="feedback-content">
                {feedback ? <p>{feedback}</p> : <p>No coaching feedback was returned for this attempt.</p>}
              </div>
            </div>

            <div className="action-row">
              <button type="button" className="primary-button" onClick={resetPractice}>
                Try Again →
              </button>
              <button type="button" className="secondary-button" onClick={chooseAnotherEmotion}>
                Choose Another Emotion
              </button>
            </div>
          </section>
        </main>
      )}

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand-block">
            <div className="brand-button footer-brand" aria-label="FaceCue home">
              <FaceCueLogo />
              <span>FaceCue</span>
            </div>
            <p>Practice facial expressions, explore emotional cues, and learn from AI-generated feedback.</p>
          </div>

          <div className="footer-face-wrap" aria-label={`Selected emotion ${selectedEmotion.name}`}>
            <FaceCueVisual emotion={selectedEmotion} compact />
          </div>

          <div className="footer-links">
            <div>
              <span className="footer-label">How it works</span>
              <ol>
                <li>01 Choose</li>
                <li>02 Practice</li>
                <li>03 Improve</li>
              </ol>
            </div>
            <div>
              <span className="footer-label">Why FaceCue</span>
              <ul>
                <li>Pick an emotion.</li>
                <li>Practice at your own pace.</li>
                <li>See how your expression reads.</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
