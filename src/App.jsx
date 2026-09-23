import { useEffect, useMemo, useRef, useState } from 'react';
import { EMOTIONS } from './data/emotions';
import { analyzeImage, generateFeedback } from './services/api';

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
      <span className="face-core">
        <span className="face-eye left" />
        <span className="face-eye right" />
        <span className="face-brow brow-left" />
        <span className="face-brow brow-right" />
        <span className="face-mouth" />
        <span className="face-particle particle-one" />
        <span className="face-particle particle-two" />
        <span className="face-particle particle-three" />
      </span>
      {!compact && <span className="visual-caption">{emotion.name}</span>}
    </div>
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

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

  const probabilityRows = useMemo(() => {
    return Object.entries(result.all_probs || {}).sort((a, b) => b[1] - a[1]);
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
    setError('');
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
      setResult(analysis);
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
    setFeedback('');
    setError('');
    setIsProcessing(false);
    setStep('practice');
  }

  function chooseAnotherEmotion() {
    setImageFile(null);
    setImagePreview('');
    setResult(emptyResult);
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
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <button type="button" className="brand-button" onClick={() => setStep('home')}>
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
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

            <div className="hero-visual-wrap">
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
              <div className="preview-modal-visual">
                <FaceCueVisual emotion={selectedEmotion} />
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
              {imagePreview ? (
                <div className="image-preview-wrap">
                  <img src={imagePreview} alt="Selected expression preview" className="image-preview" />
                  <div className="image-actions">
                    <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>
                      Replace Image
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
                <label
                  className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
                  htmlFor="photo-upload"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    id="photo-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    aria-label="Upload an image to analyze"
                  />
                  <span className="upload-icon" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="upload-title">Drop your expression here</span>
                  <span className="upload-caption">or choose an image from your device.</span>
                  <span className="upload-action">Choose image</span>
                </label>
              )}
            </div>

            {isProcessing && (
              <div className="loading-state" aria-live="polite">
                <div className="loading-face" aria-hidden="true">
                  <span />
                  <span />
                  <i />
                </div>
                <div>
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
                  {probabilityRows.map(([emotion, probability]) => (
                    <li key={emotion}>
                      <span>{emotion}</span>
                      <div className="probability-bar-track" aria-hidden="true">
                        <span className="probability-bar" style={{ width: `${Math.max(probability * 100, 4)}%` }} />
                      </div>
                      <strong>{(probability * 100).toFixed(1)}%</strong>
                    </li>
                  ))}
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
              <span className="brand-mark" aria-hidden="true">
                <span />
                <span />
              </span>
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
