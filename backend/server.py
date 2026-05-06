from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Header
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import json
import pickle
import io

# ML imports
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

# PDF generation
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL','mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'default_secret_key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Admin credentials
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Admin@12345')

# Create the main app
app = FastAPI(title="CareerAI API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================
# PYDANTIC MODELS
# ===================

class UserCreate(BaseModel):
    username: str
    full_name: str
    age: int
    profession: str
    phone: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    age: int
    profession: str
    phone: str
    email: str
    created_at: str
    role: str = "user"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class AssessmentInput(BaseModel):
    technical_skills: List[str]
    soft_skills: List[str]
    interests: List[str]
    logical_ability: int = Field(ge=1, le=10)
    creativity_level: int = Field(ge=1, le=10)
    communication: int = Field(ge=1, le=10)
    leadership: int = Field(ge=1, le=10)
    problem_solving: int = Field(ge=1, le=10)
    teamwork: int = Field(ge=1, le=10)
    work_preference: str = "hybrid"
    industry_interest: Optional[str] = None

class CareerRecommendation(BaseModel):
    career: str
    confidence: float
    match_percentage: float
    skill_gaps: List[str]
    suggestions: List[str]

class PredictionResponse(BaseModel):
    id: str
    user_id: str
    recommendations: List[CareerRecommendation]
    ai_explanation: str
    timestamp: str

class ModelInfo(BaseModel):
    version: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    trained_at: str
    sample_count: int

class AdminStats(BaseModel):
    total_users: int
    total_predictions: int
    model_version: str
    model_accuracy: float

# ===================
# AUTH HELPERS
# ===================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, username: str, role: str = "user") -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(token: str) -> dict:
    try:
        # Remove Bearer prefix if present
        if token.startswith("Bearer "):
            token = token[7:]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===================
# ML MODEL MANAGEMENT
# ===================

MODEL_DIR = ROOT_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

# Sample career dataset
SAMPLE_CAREERS = [
    "Software Engineer", "Data Scientist", "Product Manager", 
    "UX Designer", "DevOps Engineer", "Business Analyst",
    "Machine Learning Engineer", "Full Stack Developer", 
    "Cloud Architect", "Cybersecurity Analyst", "Project Manager",
    "Technical Writer", "QA Engineer", "Mobile Developer"
]

# Career descriptions for explanations
CAREER_DESCRIPTIONS = {
    "Software Engineer": {
        "description": "Designs, develops, and maintains software applications and systems",
        "key_skills": ["programming", "problem-solving", "logical thinking"],
        "growth": "High demand with excellent career progression opportunities"
    },
    "Data Scientist": {
        "description": "Analyzes complex data to help organizations make better decisions",
        "key_skills": ["statistics", "machine learning", "data analysis"],
        "growth": "One of the fastest-growing fields with high salary potential"
    },
    "Product Manager": {
        "description": "Guides product development from conception to launch",
        "key_skills": ["communication", "leadership", "strategic thinking"],
        "growth": "Critical role in tech companies with path to executive positions"
    },
    "UX Designer": {
        "description": "Creates user-friendly interfaces and experiences for digital products",
        "key_skills": ["creativity", "user empathy", "visual design"],
        "growth": "Growing demand as companies prioritize user experience"
    },
    "DevOps Engineer": {
        "description": "Bridges development and operations to improve deployment efficiency",
        "key_skills": ["automation", "cloud infrastructure", "problem-solving"],
        "growth": "Essential role with increasing adoption of cloud technologies"
    },
    "Business Analyst": {
        "description": "Analyzes business processes and recommends improvements",
        "key_skills": ["analytical thinking", "communication", "documentation"],
        "growth": "Versatile role applicable across industries"
    },
    "Machine Learning Engineer": {
        "description": "Builds and deploys machine learning models at scale",
        "key_skills": ["programming", "mathematics", "ML algorithms"],
        "growth": "Rapidly expanding field with AI adoption"
    },
    "Full Stack Developer": {
        "description": "Works on both frontend and backend of web applications",
        "key_skills": ["web technologies", "databases", "problem-solving"],
        "growth": "Highly versatile with strong job market demand"
    },
    "Cloud Architect": {
        "description": "Designs and oversees cloud computing strategies",
        "key_skills": ["cloud platforms", "system design", "security"],
        "growth": "Premium role as cloud adoption accelerates"
    },
    "Cybersecurity Analyst": {
        "description": "Protects organizations from cyber threats and attacks",
        "key_skills": ["security protocols", "analytical thinking", "attention to detail"],
        "growth": "Critical role with shortage of qualified professionals"
    },
    "Project Manager": {
        "description": "Plans, executes, and closes projects successfully",
        "key_skills": ["leadership", "organization", "communication"],
        "growth": "Universal need across all industries"
    },
    "Technical Writer": {
        "description": "Creates documentation and guides for technical products",
        "key_skills": ["writing", "technical understanding", "clarity"],
        "growth": "Steady demand in tech and engineering sectors"
    },
    "QA Engineer": {
        "description": "Ensures software quality through testing and automation",
        "key_skills": ["attention to detail", "testing methodologies", "automation"],
        "growth": "Essential role in software development lifecycle"
    },
    "Mobile Developer": {
        "description": "Builds applications for mobile devices",
        "key_skills": ["mobile frameworks", "UI/UX sense", "programming"],
        "growth": "Strong demand with mobile-first world"
    }
}

def generate_sample_dataset(n_samples: int = 500) -> pd.DataFrame:
    """Generate a sample dataset for training"""
    np.random.seed(42)
    data = []
    
    for _ in range(n_samples):
        # Random scores for abilities
        logical = np.random.randint(1, 11)
        creativity = np.random.randint(1, 11)
        communication = np.random.randint(1, 11)
        leadership = np.random.randint(1, 11)
        problem_solving = np.random.randint(1, 11)
        teamwork = np.random.randint(1, 11)
        
        # Technical skill count
        tech_skills = np.random.randint(0, 6)
        soft_skills = np.random.randint(0, 4)
        
        # Determine career based on profile
        if logical > 7 and problem_solving > 7 and tech_skills > 3:
            if creativity > 6:
                career = np.random.choice(["Data Scientist", "Machine Learning Engineer"])
            else:
                career = np.random.choice(["Software Engineer", "DevOps Engineer", "Cloud Architect"])
        elif creativity > 7 and communication > 6:
            career = np.random.choice(["UX Designer", "Product Manager", "Technical Writer"])
        elif leadership > 7 and communication > 7:
            career = np.random.choice(["Project Manager", "Business Analyst", "Product Manager"])
        elif problem_solving > 6 and tech_skills > 2:
            career = np.random.choice(["Full Stack Developer", "QA Engineer", "Cybersecurity Analyst", "Mobile Developer"])
        else:
            career = np.random.choice(SAMPLE_CAREERS)
        
        data.append({
            "logical_ability": logical,
            "creativity_level": creativity,
            "communication": communication,
            "leadership": leadership,
            "problem_solving": problem_solving,
            "teamwork": teamwork,
            "tech_skill_count": tech_skills,
            "soft_skill_count": soft_skills,
            "career": career
        })
    
    return pd.DataFrame(data)

class CareerModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_columns = [
            "logical_ability", "creativity_level", "communication",
            "leadership", "problem_solving", "teamwork",
            "tech_skill_count", "soft_skill_count"
        ]
        self.version = "v1"
        self.metrics = {}
        self.trained = False
        self.feature_importance = {}
    
    def train(self, df: pd.DataFrame) -> dict:
        """Train the Random Forest model"""
        X = df[self.feature_columns].values
        y = self.label_encoder.fit_transform(df['career'])
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            random_state=42
        )
        self.model.fit(X_train_scaled, y_train)
        
        # Store feature importance
        self.feature_importance = dict(zip(self.feature_columns, self.model.feature_importances_))
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X_train_scaled, y_train, cv=5)
        
        self.metrics = {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred, average='weighted', zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, average='weighted', zero_division=0)),
            "f1_score": float(f1_score(y_test, y_pred, average='weighted', zero_division=0)),
            "cv_mean": float(cv_scores.mean()),
            "cv_std": float(cv_scores.std())
        }
        self.trained = True
        
        return self.metrics
    
    def predict(self, assessment: AssessmentInput) -> List[CareerRecommendation]:
        """Generate career recommendations"""
        if not self.trained:
            raise ValueError("Model not trained")
        
        features = np.array([[
            assessment.logical_ability,
            assessment.creativity_level,
            assessment.communication,
            assessment.leadership,
            assessment.problem_solving,
            assessment.teamwork,
            len(assessment.technical_skills),
            len(assessment.soft_skills)
        ]])
        
        features_scaled = self.scaler.transform(features)
        
        # Get probabilities for top 3
        probabilities = self.model.predict_proba(features_scaled)[0]
        top_indices = np.argsort(probabilities)[-3:][::-1]
        
        recommendations = []
        for idx in top_indices:
            career = self.label_encoder.inverse_transform([idx])[0]
            confidence = float(probabilities[idx])
            
            # Generate skill gaps and suggestions based on career
            skill_gaps, suggestions = self._generate_skill_analysis(career, assessment)
            
            recommendations.append(CareerRecommendation(
                career=career,
                confidence=round(confidence, 3),
                match_percentage=round(confidence * 100, 1),
                skill_gaps=skill_gaps,
                suggestions=suggestions
            ))
        
        return recommendations
    
    def _generate_skill_analysis(self, career: str, assessment: AssessmentInput) -> tuple:
        """Generate skill gaps and suggestions for a career"""
        career_requirements = {
            "Software Engineer": {"skills": ["python", "javascript", "docker"], "abilities": {"logical_ability": 7, "problem_solving": 7}},
            "Data Scientist": {"skills": ["python", "machine_learning", "sql", "data_analysis"], "abilities": {"logical_ability": 8, "problem_solving": 8}},
            "Product Manager": {"skills": ["data_analysis"], "abilities": {"communication": 8, "leadership": 7}},
            "UX Designer": {"skills": ["react"], "abilities": {"creativity_level": 8, "communication": 7}},
            "DevOps Engineer": {"skills": ["docker", "aws", "python"], "abilities": {"logical_ability": 7, "problem_solving": 7}},
            "Business Analyst": {"skills": ["sql", "data_analysis"], "abilities": {"communication": 7, "problem_solving": 7}},
            "Machine Learning Engineer": {"skills": ["python", "machine_learning", "docker"], "abilities": {"logical_ability": 8, "problem_solving": 8}},
            "Full Stack Developer": {"skills": ["javascript", "react", "node", "sql"], "abilities": {"logical_ability": 7, "problem_solving": 7}},
            "Cloud Architect": {"skills": ["aws", "docker"], "abilities": {"logical_ability": 8, "problem_solving": 8}},
            "Cybersecurity Analyst": {"skills": ["python"], "abilities": {"logical_ability": 8, "problem_solving": 8}},
            "Project Manager": {"skills": [], "abilities": {"leadership": 8, "communication": 8, "teamwork": 7}},
            "Technical Writer": {"skills": [], "abilities": {"communication": 9, "creativity_level": 6}},
            "QA Engineer": {"skills": ["python", "javascript"], "abilities": {"logical_ability": 7, "problem_solving": 7}},
            "Mobile Developer": {"skills": ["javascript", "react"], "abilities": {"logical_ability": 7, "creativity_level": 6}}
        }
        
        reqs = career_requirements.get(career, {"skills": [], "abilities": {}})
        
        skill_gaps = []
        suggestions = []
        
        # Check technical skills
        user_skills_lower = [s.lower() for s in assessment.technical_skills]
        for skill in reqs.get("skills", []):
            if skill not in user_skills_lower:
                skill_gaps.append(skill.replace("_", " ").title())
                suggestions.append(f"Learn {skill.replace('_', ' ').title()} through online courses or certifications")
        
        # Check abilities
        ability_map = {
            "logical_ability": assessment.logical_ability,
            "creativity_level": assessment.creativity_level,
            "communication": assessment.communication,
            "leadership": assessment.leadership,
            "problem_solving": assessment.problem_solving,
            "teamwork": assessment.teamwork
        }
        
        for ability, required in reqs.get("abilities", {}).items():
            if ability_map.get(ability, 0) < required:
                gap = required - ability_map.get(ability, 0)
                skill_gaps.append(f"{ability.replace('_', ' ').title()} (need +{gap})")
                suggestions.append(f"Improve {ability.replace('_', ' ')} through practice and training")
        
        if not suggestions:
            suggestions.append("You're well-prepared! Consider gaining practical experience through projects or internships")
        
        return skill_gaps[:5], suggestions[:5]
    
    def save(self, version: str = None):
        """Save model to disk"""
        if version:
            self.version = version
        
        model_data = {
            "model": self.model,
            "scaler": self.scaler,
            "label_encoder": self.label_encoder,
            "metrics": self.metrics,
            "version": self.version,
            "feature_importance": self.feature_importance,
            "trained_at": datetime.now(timezone.utc).isoformat()
        }
        
        model_path = MODEL_DIR / f"career_model_{self.version}.pkl"
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        return model_path
    
    def load(self, version: str = None):
        """Load model from disk"""
        if version:
            model_path = MODEL_DIR / f"career_model_{version}.pkl"
        else:
            # Find latest version
            model_files = list(MODEL_DIR.glob("career_model_*.pkl"))
            if not model_files:
                return False
            model_path = max(model_files, key=lambda p: p.stat().st_mtime)
        
        if model_path.exists():
            with open(model_path, 'rb') as f:
                data = pickle.load(f)
            
            self.model = data["model"]
            self.scaler = data["scaler"]
            self.label_encoder = data["label_encoder"]
            self.metrics = data["metrics"]
            self.version = data["version"]
            self.feature_importance = data.get("feature_importance", {})
            self.trained = True
            return True
        return False

# Global model instance
career_model = CareerModel()

# ===================
# INTELLIGENT EXPLANATION GENERATOR (NO API NEEDED)
# ===================

def generate_intelligent_explanation(recommendations: List[CareerRecommendation], assessment: AssessmentInput) -> str:
    """Generate intelligent career explanation based on ML model analysis - NO external API needed"""
    
    if not recommendations:
        return "Unable to generate recommendations. Please try again."
    
    top_career = recommendations[0]
    career_info = CAREER_DESCRIPTIONS.get(top_career.career, {})
    
    # Identify user's strengths
    strengths = []
    ability_scores = {
        "logical ability": assessment.logical_ability,
        "creativity": assessment.creativity_level,
        "communication": assessment.communication,
        "leadership": assessment.leadership,
        "problem-solving": assessment.problem_solving,
        "teamwork": assessment.teamwork
    }
    
    # Find top 3 strengths
    sorted_abilities = sorted(ability_scores.items(), key=lambda x: x[1], reverse=True)
    for ability, score in sorted_abilities[:3]:
        if score >= 6:
            strengths.append(ability)
    
    # Build explanation
    explanation_parts = []
    
    # Opening
    explanation_parts.append(f"Based on your comprehensive assessment, **{top_career.career}** emerges as your top career match with a {top_career.match_percentage}% compatibility score.")
    
    # Why this career
    if career_info:
        explanation_parts.append(f"\n\n**Why {top_career.career}?**\n{career_info.get('description', '')}. {career_info.get('growth', '')}")
    
    # Your strengths
    if strengths:
        explanation_parts.append(f"\n\n**Your Key Strengths:**\nYour profile shows strong {', '.join(strengths)}, which are essential for success in this role.")
    
    # Technical skills match
    if assessment.technical_skills:
        explanation_parts.append(f"\n\n**Technical Foundation:**\nYou already have experience with {', '.join(assessment.technical_skills[:3])}, providing a solid foundation for this career path.")
    
    # Areas for growth
    if top_career.skill_gaps:
        explanation_parts.append(f"\n\n**Areas for Development:**\nTo maximize your potential, focus on: {', '.join(top_career.skill_gaps[:3])}.")
    
    # Alternative paths
    if len(recommendations) > 1:
        alt_careers = [r.career for r in recommendations[1:]]
        explanation_parts.append(f"\n\n**Alternative Paths:**\nYou might also consider {' or '.join(alt_careers)}, which align well with your skill profile.")
    
    # Action items
    explanation_parts.append("\n\n**Recommended Next Steps:**")
    for i, suggestion in enumerate(top_career.suggestions[:3], 1):
        explanation_parts.append(f"\n{i}. {suggestion}")
    
    # Closing
    explanation_parts.append(f"\n\nRemember, career success depends on continuous learning and practical experience. Your {sorted_abilities[0][0]} score of {sorted_abilities[0][1]}/10 is a significant asset - leverage it as you pursue your goals!")
    
    return "".join(explanation_parts)

# ===================
# PDF GENERATION
# ===================

def generate_pdf_report(user: dict, assessment: dict, recommendations: List[dict], explanation: str) -> io.BytesIO:
    """Generate PDF career report"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=50, bottomMargin=50)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#F97316')
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.HexColor('#007AFF')
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=8
    )
    
    elements = []
    
    # Title
    elements.append(Paragraph("CareerAI - Career Recommendation Report", title_style))
    elements.append(Spacer(1, 20))
    
    # User Info
    elements.append(Paragraph("User Information", heading_style))
    user_info = [
        ["Name:", user.get('full_name', 'N/A')],
        ["Email:", user.get('email', 'N/A')],
        ["Profession:", user.get('profession', 'N/A')],
        ["Date:", datetime.now().strftime("%Y-%m-%d %H:%M")]
    ]
    user_table = Table(user_info, colWidths=[100, 300])
    user_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(user_table)
    elements.append(Spacer(1, 20))
    
    # Assessment Summary
    elements.append(Paragraph("Assessment Summary", heading_style))
    assessment_data = [
        ["Logical Ability:", f"{assessment.get('logical_ability', 0)}/10"],
        ["Creativity Level:", f"{assessment.get('creativity_level', 0)}/10"],
        ["Communication:", f"{assessment.get('communication', 0)}/10"],
        ["Leadership:", f"{assessment.get('leadership', 0)}/10"],
        ["Problem Solving:", f"{assessment.get('problem_solving', 0)}/10"],
        ["Teamwork:", f"{assessment.get('teamwork', 0)}/10"],
    ]
    assessment_table = Table(assessment_data, colWidths=[150, 100])
    assessment_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(assessment_table)
    elements.append(Spacer(1, 20))
    
    # Career Recommendations
    elements.append(Paragraph("Career Recommendations", heading_style))
    for i, rec in enumerate(recommendations, 1):
        elements.append(Paragraph(f"<b>#{i} {rec['career']}</b> - {rec['match_percentage']}% Match", body_style))
        elements.append(Paragraph(f"Confidence Score: {rec['confidence']}", body_style))
        if rec.get('skill_gaps'):
            elements.append(Paragraph(f"Skill Gaps: {', '.join(rec['skill_gaps'])}", body_style))
        if rec.get('suggestions'):
            elements.append(Paragraph("Suggestions:", body_style))
            for sug in rec['suggestions'][:3]:
                elements.append(Paragraph(f"  - {sug}", body_style))
        elements.append(Spacer(1, 10))
    
    # AI Explanation
    elements.append(Paragraph("Career Insight Analysis", heading_style))
    # Clean markdown from explanation
    clean_explanation = explanation.replace("**", "").replace("\n\n", "\n")
    for line in clean_explanation.split("\n"):
        if line.strip():
            elements.append(Paragraph(line, body_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

# ===================
# API ROUTES - AUTH
# ===================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    # Check if username exists
    existing = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "username": user_data.username,
        "full_name": user_data.full_name,
        "age": user_data.age,
        "profession": user_data.profession,
        "phone": user_data.phone,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.username, "user")
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            username=user_data.username,
            full_name=user_data.full_name,
            age=user_data.age,
            profession=user_data.profession,
            phone=user_data.phone,
            email=user_data.email,
            created_at=user_doc["created_at"],
            role="user"
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login_user(credentials: UserLogin):
    """Login user or admin"""
    # Check for admin login
    if credentials.username == ADMIN_USERNAME:
        if credentials.password == ADMIN_PASSWORD:
            token = create_token("admin", ADMIN_USERNAME, "admin")
            return TokenResponse(
                access_token=token,
                user=UserResponse(
                    id="admin",
                    username=ADMIN_USERNAME,
                    full_name="Administrator",
                    age=0,
                    profession="System Admin",
                    phone="",
                    email="admin@careerai.com",
                    created_at=datetime.now(timezone.utc).isoformat(),
                    role="admin"
                )
            )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Regular user login
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["username"], user.get("role", "user"))
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            username=user["username"],
            full_name=user["full_name"],
            age=user["age"],
            profession=user["profession"],
            phone=user["phone"],
            email=user["email"],
            created_at=user["created_at"],
            role=user.get("role", "user")
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(authorization: str = Header(None)):
    """Get current user info"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = await get_current_user(authorization)
    
    if payload["role"] == "admin":
        return UserResponse(
            id="admin",
            username=ADMIN_USERNAME,
            full_name="Administrator",
            age=0,
            profession="System Admin",
            phone="",
            email="admin@careerai.com",
            created_at=datetime.now(timezone.utc).isoformat(),
            role="admin"
        )
    
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(**user)

# ===================
# API ROUTES - ASSESSMENT & PREDICTION
# ===================

@api_router.post("/assessment/predict", response_model=PredictionResponse)
async def predict_career(assessment: AssessmentInput, authorization: str = Header(None)):
    """Generate career predictions based on assessment"""
    
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = await get_current_user(authorization)
    user_id = payload["sub"]
    
    # Ensure model is trained
    if not career_model.trained:
        if not career_model.load():
            # Train with sample data
            df = generate_sample_dataset()
            career_model.train(df)
            career_model.save()
    
    # Generate predictions
    recommendations = career_model.predict(assessment)
    
    # Generate intelligent explanation (NO API call - fully local)
    ai_explanation = generate_intelligent_explanation(recommendations, assessment)
    
    # Save prediction to database
    prediction_id = str(uuid.uuid4())
    prediction_doc = {
        "id": prediction_id,
        "user_id": user_id,
        "assessment": assessment.model_dump(),
        "recommendations": [r.model_dump() for r in recommendations],
        "ai_explanation": ai_explanation,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.predictions.insert_one(prediction_doc)
    
    return PredictionResponse(
        id=prediction_id,
        user_id=user_id,
        recommendations=recommendations,
        ai_explanation=ai_explanation,
        timestamp=prediction_doc["timestamp"]
    )

@api_router.get("/assessment/history", response_model=List[PredictionResponse])
async def get_prediction_history(authorization: str = Header(None)):
    """Get user's prediction history"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = await get_current_user(authorization)
    user_id = payload["sub"]
    
    predictions = await db.predictions.find(
        {"user_id": user_id}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
    return [PredictionResponse(**p) for p in predictions]

@api_router.get("/assessment/{prediction_id}/pdf")
async def download_pdf_report(prediction_id: str, authorization: str = Header(None)):
    """Download PDF report for a prediction"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = await get_current_user(authorization)
    user_id = payload["sub"]
    
    # Get prediction
    prediction = await db.predictions.find_one(
        {"id": prediction_id, "user_id": user_id},
        {"_id": 0}
    )
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Get user info
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        user = {"full_name": "User", "email": "", "profession": ""}
    
    # Generate PDF
    pdf_buffer = generate_pdf_report(
        user,
        prediction["assessment"],
        prediction["recommendations"],
        prediction["ai_explanation"]
    )
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=career_report_{prediction_id[:8]}.pdf"}
    )

# ===================
# API ROUTES - ADMIN
# ===================

async def require_admin(authorization: str):
    """Verify admin access"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = await get_current_user(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload

@api_router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(authorization: str = Header(None)):
    """Get admin dashboard statistics"""
    await require_admin(authorization)
    
    total_users = await db.users.count_documents({})
    total_predictions = await db.predictions.count_documents({})
    
    return AdminStats(
        total_users=total_users,
        total_predictions=total_predictions,
        model_version=career_model.version if career_model.trained else "Not trained",
        model_accuracy=career_model.metrics.get("accuracy", 0) if career_model.trained else 0
    )

@api_router.get("/admin/users")
async def get_all_users(authorization: str = Header(None), skip: int = 0, limit: int = 50):
    """Get all users (admin only)"""
    await require_admin(authorization)
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    
    return {"users": users, "total": total}

@api_router.get("/admin/predictions")
async def get_all_predictions(authorization: str = Header(None), skip: int = 0, limit: int = 50):
    """Get all predictions (admin only)"""
    await require_admin(authorization)
    
    predictions = await db.predictions.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.predictions.count_documents({})
    
    return {"predictions": predictions, "total": total}

@api_router.get("/admin/model/info", response_model=ModelInfo)
async def get_model_info(authorization: str = Header(None)):
    """Get current model information"""
    await require_admin(authorization)
    
    if not career_model.trained:
        raise HTTPException(status_code=404, detail="No model trained")
    
    # Get training dataset count
    sample_count = 500  # Default sample size
    
    return ModelInfo(
        version=career_model.version,
        accuracy=career_model.metrics.get("accuracy", 0),
        precision=career_model.metrics.get("precision", 0),
        recall=career_model.metrics.get("recall", 0),
        f1_score=career_model.metrics.get("f1_score", 0),
        trained_at=datetime.now(timezone.utc).isoformat(),
        sample_count=sample_count
    )

@api_router.post("/admin/model/train")
async def train_model_endpoint(authorization: str = Header(None)):
    """Train model with sample data - ONE CLICK TRAINING"""
    await require_admin(authorization)
    
    df = generate_sample_dataset(n_samples=1000)  # Larger sample for better accuracy
    metrics = career_model.train(df)
    
    # Save model with new version
    version_num = 1
    if career_model.version.startswith('v'):
        try:
            version_num = int(career_model.version[1:]) + 1
        except:
            version_num = 1
    version = f"v{version_num}"
    career_model.save(version)
    
    # Log training
    await db.model_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "train",
        "version": version,
        "metrics": metrics,
        "sample_count": 1000,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Model trained successfully!", "version": version, "metrics": metrics}

@api_router.post("/admin/dataset/upload")
async def upload_dataset(file: UploadFile = File(...), authorization: str = Header(None)):
    """Upload custom dataset for training"""
    await require_admin(authorization)
    
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    try:
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_cols = ["logical_ability", "creativity_level", "communication", 
                        "leadership", "problem_solving", "teamwork", "career"]
        missing = [col for col in required_cols if col not in df.columns]
        
        if missing:
            # Try to map common column names
            column_mapping = {
                'logical': 'logical_ability',
                'creativity': 'creativity_level',
                'comm': 'communication',
                'lead': 'leadership',
                'problem': 'problem_solving',
                'team': 'teamwork'
            }
            for old, new in column_mapping.items():
                for col in df.columns:
                    if old in col.lower() and new not in df.columns:
                        df = df.rename(columns={col: new})
            
            # Re-check missing
            missing = [col for col in required_cols if col not in df.columns]
            if missing:
                return {
                    "status": "validation_required",
                    "message": f"Missing columns: {', '.join(missing)}",
                    "available_columns": df.columns.tolist(),
                    "required_columns": required_cols,
                    "sample_rows": df.head(5).to_dict()
                }
        
        # Add tech_skill_count and soft_skill_count if not present
        if 'tech_skill_count' not in df.columns:
            df['tech_skill_count'] = 3  # Default value
        if 'soft_skill_count' not in df.columns:
            df['soft_skill_count'] = 2  # Default value
        
        # Save dataset
        dataset_id = str(uuid.uuid4())
        dataset_path = MODEL_DIR / f"dataset_{dataset_id}.csv"
        df.to_csv(dataset_path, index=False)
        
        # Store metadata
        await db.datasets.insert_one({
            "id": dataset_id,
            "filename": file.filename,
            "rows": len(df),
            "columns": df.columns.tolist(),
            "path": str(dataset_path),
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "status": "success",
            "dataset_id": dataset_id,
            "rows": len(df),
            "columns": df.columns.tolist(),
            "message": "Dataset uploaded successfully! Click 'Retrain Model' to train with this dataset."
        }
    except Exception as e:
        logger.error(f"Dataset upload error: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@api_router.post("/admin/model/retrain")
async def retrain_model(dataset_id: str = None, authorization: str = Header(None)):
    """Retrain model with uploaded dataset - ONE CLICK RETRAINING"""
    await require_admin(authorization)
    
    if dataset_id:
        dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        df = pd.read_csv(dataset["path"])
        sample_count = len(df)
    else:
        # Use latest uploaded dataset or generate sample
        latest_dataset = await db.datasets.find_one({}, {"_id": 0}, sort=[("uploaded_at", -1)])
        if latest_dataset:
            df = pd.read_csv(latest_dataset["path"])
            sample_count = len(df)
        else:
            df = generate_sample_dataset(n_samples=1000)
            sample_count = 1000
    
    # Store old metrics for comparison
    old_metrics = career_model.metrics.copy() if career_model.trained else {}
    old_version = career_model.version
    
    # Train new model
    new_metrics = career_model.train(df)
    
    # Validate improvement
    if old_metrics and new_metrics["accuracy"] < old_metrics.get("accuracy", 0) * 0.95:
        return {
            "status": "warning",
            "message": "New model accuracy is significantly lower than previous version",
            "old_accuracy": old_metrics.get("accuracy"),
            "new_accuracy": new_metrics["accuracy"],
            "recommendation": "Consider using more training data or different parameters"
        }
    
    # Save with new version
    version_num = 1
    if old_version.startswith('v'):
        try:
            version_num = int(old_version[1:]) + 1
        except:
            version_num = 1
    new_version = f"v{version_num}"
    career_model.save(new_version)
    
    # Log
    await db.model_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "retrain",
        "version": new_version,
        "old_version": old_version,
        "metrics": new_metrics,
        "old_metrics": old_metrics,
        "dataset_id": dataset_id,
        "sample_count": sample_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    improvement = new_metrics["accuracy"] - old_metrics.get("accuracy", 0) if old_metrics else None
    
    return {
        "status": "success",
        "message": "Model retrained successfully!",
        "version": new_version,
        "metrics": new_metrics,
        "sample_count": sample_count,
        "improvement": {
            "accuracy": f"+{improvement*100:.2f}%" if improvement and improvement > 0 else f"{improvement*100:.2f}%" if improvement else "N/A"
        }
    }

@api_router.get("/admin/model/versions")
async def get_model_versions(authorization: str = Header(None)):
    """Get all model versions"""
    await require_admin(authorization)
    
    logs = await db.model_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(20)
    
    # List saved model files
    model_files = list(MODEL_DIR.glob("career_model_*.pkl"))
    versions = [f.stem.replace("career_model_", "") for f in model_files]
    
    return {
        "current_version": career_model.version if career_model.trained else None,
        "available_versions": versions,
        "training_logs": logs
    }

@api_router.get("/admin/analytics")
async def get_analytics(authorization: str = Header(None)):
    """Get analytics data"""
    await require_admin(authorization)
    
    # Get predictions per day (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    
    predictions = await db.predictions.find(
        {"timestamp": {"$gte": thirty_days_ago}},
        {"_id": 0, "timestamp": 1, "recommendations": 1}
    ).to_list(1000)
    
    # Aggregate by day
    daily_counts = {}
    career_counts = {}
    
    for pred in predictions:
        date = pred["timestamp"][:10]
        daily_counts[date] = daily_counts.get(date, 0) + 1
        
        if pred.get("recommendations"):
            top_career = pred["recommendations"][0]["career"]
            career_counts[top_career] = career_counts.get(top_career, 0) + 1
    
    return {
        "predictions_by_day": [{"date": k, "count": v} for k, v in sorted(daily_counts.items())],
        "top_careers": sorted(career_counts.items(), key=lambda x: x[1], reverse=True)[:10],
        "total_predictions": len(predictions)
    }

@api_router.get("/admin/datasets")
async def get_datasets(authorization: str = Header(None)):
    """Get uploaded datasets"""
    await require_admin(authorization)
    
    datasets = await db.datasets.find({}, {"_id": 0}).sort("uploaded_at", -1).to_list(20)
    return {"datasets": datasets}

# ===================
# STARTUP
# ===================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    # Try to load existing model
    if not career_model.load():
        # Train with sample data
        logger.info("Training initial model with sample data...")
        df = generate_sample_dataset(n_samples=1000)
        career_model.train(df)
        career_model.save("v1")
        logger.info(f"Model trained with accuracy: {career_model.metrics['accuracy']:.2f}")

@api_router.get("/")
async def root():
    return {"message": "CareerAI API", "version": "1.0.0", "llm_required": False}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": career_model.trained, "llm_required": False}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router
app.include_router(api_router)



@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
