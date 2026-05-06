# 🎯 AI-Based Career Recommendation System

An intelligent full-stack web application that recommends personalized career paths based on user skills, interests, and academic background — powered by machine learning with scikit-learn.

---

## 🚀 Features

- 🤖 ML-powered career prediction using scikit-learn
- 📊 Skill gap analysis and career fit scoring
- 🌐 Full-stack architecture (Python backend + JavaScript frontend)
- 📋 Interactive questionnaire for user profiling
- 📈 Visual career match results with confidence scores

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | HTML, CSS, JavaScript             |
| Backend   | Python (Flask / FastAPI)          |
| ML Model  | scikit-learn                      |
| Data      | pandas, NumPy                     |
| API Comm  | REST (JSON)                       |

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- pip & npm

### 1. Clone the Repository

```bash
git clone https://github.com/Aryan1446/AI_BASED_CARRER_RECOMMENDATION_SYSTEM.git
cd ai-career-recommendation-system
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
 $env:MONGO_URL = "mongodb://localhost:27017"; $env:DB_NAME = "career_recommendation"; $env:ADMIN_USERNAME = "admin"; $env:ADMIN_PASSWORD = "Admin@12345"; & "D:\AI-based-Carrer-Recommendation-System-main\AI-based-Carrer-Recommendation-System-main\.venv\Scripts\python.exe" -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
```

> Backend runs at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start                       # Or open index.html directly in browser
```

> Frontend runs at `http://localhost:3000`

---

## 🧠 How It Works

1. **User Input** — The user fills in their skills, interests, education, and experience level via the web interface.
2. **API Call** — The frontend sends the data to the Python backend via a REST API.
3. **ML Prediction** — The scikit-learn model processes the input and predicts the top matching careers along with confidence scores.
4. **Results Display** — The frontend renders career recommendations with skill gap insights.

---

## 📡 API Endpoints

| Method | Endpoint          | Description                        |
|--------|-------------------|------------------------------------|
| POST   | `/api/recommend`  | Get career recommendations         |
| GET    | `/api/careers`    | List all supported career paths    |
| GET    | `/api/health`     | Health check                       |

### Sample Request

```json
POST /api/recommend
{
  "skills": ["Python", "Data Analysis", "Communication"],
  "interests": ["Technology", "Problem Solving"],
  "education": "Bachelor's in Computer Science",
  "experience_years": 1
}
```

### Sample Response

```json
{
  "recommendations": [
    { "career": "Data Scientist", "match_score": 92 },
    { "career": "Machine Learning Engineer", "match_score": 87 },
    { "career": "Business Analyst", "match_score": 74 }
  ]
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add: your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 👤 Author

ARYAN MISHRA
- GitHub: [@Aryan1446](https://github.com/Aryan1446)
