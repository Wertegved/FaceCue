const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function analyzeImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  return request('/post/image', {
    method: 'POST',
    body: formData,
  });
}

export async function generateFeedback(analysis, targetEmotion) {
  return request('/response', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      analysis,
      target_emotion: targetEmotion,
    }),
  });
}
