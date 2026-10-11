# FaceCue

Practice the expression. Feel the difference.

![FaceCue website screenshot](https://raw.githubusercontent.com/Wertegved/FaceCue/auth/screenshot/Screenshot%202026-10-11%20170628.png)

FaceCue is an interactive facial-expression practice app. Choose an emotion, upload a saved photo or capture one with your device camera, and let the AI analyze how the expression is interpreted. FaceCue presents the predicted emotion and probability breakdown, then provides coaching feedback to help guide another attempt.

FaceCue is a practice and learning tool, not a clinical or diagnostic system.

## Overview

FaceCue helps users practice recognizing and producing facial expressions by combining image analysis, emotion prediction, and guided coaching. The app is designed for learning and experimentation, with an emphasis on feedback and repeated attempts rather than diagnosis.

## Features

- Seven target emotions: Happy, Sad, Angry, Fear, Surprise, Neutral, and Disgust.
- Photo or camera input: Select an image from your device or capture a photo live in the browser.
- AI emotion analysis: Detects a face, aligns it for inference, and returns an emotion prediction with a probability breakdown.
- Personalized practice feedback: Generates guidance based on the analysis and the emotion the user chose to practice.
- Session progress: Tracks emotion scores and compares repeated attempts during the current browser tab session.
- Expression previews: View a concise guide for each emotion before practicing.
- Responsive interface: A motion-rich, emotion-responsive UI with accessibility and reduced-motion considerations.

## How It Works

1. Choose an emotion to practice.
2. Preview the expression guide, if helpful.
3. Practice by choosing an existing image or taking a photo with the camera.
4. Analyze the image to receive the predicted emotion and probability scores.
5. Improve with coaching feedback and session progress comparisons on subsequent attempts.

## Tech Stack

### Frontend

- React
- Vite
- JavaScript and CSS
- Browser Camera API (getUserMedia)
- sessionStorage for session-only progress history

### Backend and AI

- Python and FastAPI
- DDAMFN++ emotion-classification model with PyTorch
- OpenCV for image processing
- MediaPipe Face Landmarker for facial landmarks
- Groq API (OpenAI-compatible client) for generated coaching feedback
- SQLAlchemy and PostgreSQL-compatible async database support for account features

## Getting Started

### Prerequisites

- Python and pip
- Node.js and npm
- PostgreSQL or another database URL supported by the configured backend
- The project's model assets, including ddamfn/weights/rafdb.pth and face_landmarker.task
- A Groq API key for coaching feedback

### 1. Clone the repository

```bash
git clone https://github.com/jayssSmm/FaceCue.git
cd FaceCue
```

### 2. Configure environment variables

Create a local `.env` file based on `.env.example`.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Configure the values needed for your setup. Common settings include:

```env
GROQ_API_KEY=your_groq_api_key
MASTER_PROMPT=your_coaching_system_prompt
DATABASE_URL=postgresql://user:password@localhost:5432/facecue
JWT_SECRET_KEY=use_a_long_random_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

`GOOGLE_CLIENT_ID` is needed only if Google sign-in is configured. Keep secrets in your local environment and deployment settings; never commit real credentials.

### 3. Install backend dependencies

```bash
python -m venv .venv
```

Activate the environment, then install requirements:

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

macOS/Linux:

```bash
source .venv/bin/activate
python -m pip install -r requirements.txt
```

### 4. Install frontend dependencies

```bash
npm install
```

### 5. Run the backend and frontend for local development

Start the API in one terminal:

```bash
uvicorn wsgi:app --reload --host 127.0.0.1 --port 8000
```

Set the frontend API base URL in a root `.env.local` file:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Then start Vite in another terminal:

```bash
npm run dev
```

Open the local URL printed by Vite, commonly `http://localhost:5173`.

### 6. Build the frontend

```bash
npm run build
```

The Vite configuration outputs the production frontend into templates, which is served by the FastAPI application. For a production-style local run, build the frontend first, then start the backend with Uvicorn.

## API Flow

The frontend uses the existing analysis and feedback endpoints:

- `POST /post/image` ? accepts an image using the multipart field `image` and returns the predicted emotion and emotion probabilities.
- `POST /response` ? accepts the analysis result and `target_emotion`, then returns coaching feedback.
- `GET /health` ? basic API health check.

Both uploaded images and camera captures enter the same image-analysis flow.

## Session Progress

FaceCue stores attempt history by emotion in the browser's `sessionStorage`. The progress bars use the model's returned probabilities, and repeated analyses can display the change in percentage points compared with the previous attempt for the same emotion. This history is session-scoped and is not a permanent user record.

## Notes

- Camera access requires a secure context, such as HTTPS or localhost, and the user's permission.
- Results depend on image quality, face visibility, and the model's predictions.
- FaceCue is intended for expression practice and educational use; its emotion predictions should not be treated as definitive judgments about a person's internal emotional state.