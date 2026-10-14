# FaceCue

Practice the expression. Feel the difference.

FaceCue is an interactive facial-expression practice app that helps users learn, compare, and improve their expressions using AI-powered emotion analysis and personalized feedback.

<p align="center">
  <img src="./screenshot/Tech-Stack.png" alt="FaceCue tech stack" width="820" />
</p>

## Overview

FaceCue helps users practice recognizing and producing facial expressions by combining image analysis, emotion prediction, and guided coaching. The app is designed for learning and experimentation, with an emphasis on feedback and repeated attempts rather than diagnosis.

## Why FaceCue?

Many people want to understand how expressions are interpreted, but most tools only tell them the result without actionable guidance. FaceCue bridges that gap by pairing prediction with coaching feedback, making it easier to compare the target expression with the observed one.

## Key Features

- 7 target emotions: Happy, Sad, Angry, Fear, Surprise, Neutral, and Disgust
- Image upload or live camera capture
- Face detection and landmark-based alignment
- Emotion prediction with probability breakdowns
- Personalized coaching feedback based on the selected target emotion
- Session-based progress tracking for repeated attempts
- Responsive UI with motion-aware interactions

## How It Works

1. Select the emotion you want to practice.
2. View a quick expression guide if helpful.
3. Upload a photo or capture one with the camera.
4. FaceCue analyzes the image and predicts the most likely emotion.
5. Review the probability distribution and coaching feedback.
6. Try again and compare your session progress over time.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Browser Camera API
- sessionStorage for temporary session tracking

### Backend
- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL-compatible async database support
- JWT + bcrypt-based authentication flow

### AI and Vision
- PyTorch
- TorchVision
- OpenCV
- MediaPipe Face Landmarker
- scikit-image
- NumPy
- DDAMFN++ emotion classification model

### AI Feedback
- Groq API
- OpenAI-compatible client patterns
- HTTP-based integration for coaching responses

## Screenshots

<div align="center">
  <img src="./screenshot/Tech-Stack.png" alt="FaceCue tech stack diagram" width="430" />
  <img src="./screenshot/Screenshot%202026-10-11%20170628.png" alt="FaceCue application preview" width="430" />
</div>

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js and npm
- A Groq API key
- Optional: PostgreSQL connection URL for backend auth/database features

### 1) Clone the repo

```bash
git clone https://github.com/Wertegved/FaceCue.git
cd FaceCue
```

### 2) Set up environment variables

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Then add values like:

```env
GROQ_API_KEY=your_groq_api_key
MASTER_PROMPT=your_coaching_system_prompt
DATABASE_URL=postgresql://user:password@localhost:5432/facecue
JWT_SECRET_KEY=your_secure_random_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

### 3) Install backend dependencies

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### 4) Install frontend dependencies

```bash
npm install
```

### 5) Run the app

Start the API:

```bash
uvicorn wsgi:app --reload --host 127.0.0.1 --port 8000
```

Set the frontend API base URL in a root `.env.local` file:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Then start Vite:

```bash
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

### 6) Production build

```bash
npm run build
```

## API Overview

The backend exposes endpoints for:

- `POST /post/image` – upload an image and receive emotion predictions
- `POST /response` – send analysis output and target emotion for coaching feedback
- `GET /health` – health check endpoint

## Notes

- Camera access requires a secure context such as localhost or HTTPS.
- Prediction quality depends on lighting, face visibility, and image clarity.
- Results should be treated as educational guidance rather than definitive judgments about a person's internal state.

## License

This project is licensed under the [MIT License](./LICENSE).

