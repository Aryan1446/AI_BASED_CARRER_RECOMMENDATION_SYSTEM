# CareerAI - Intelligent Career Recommendation System

## Project Overview
A full-stack AI-powered career recommendation system that analyzes user skills, interests, and abilities to provide personalized career suggestions.

## Architecture
- **Frontend:** React 19 + Tailwind CSS + Shadcn UI + Recharts
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **ML Model:** Random Forest Classifier (scikit-learn)
- **PDF Generation:** ReportLab

## Core Features Implemented

### User Authentication
- [x] User registration with full profile
- [x] JWT-based login/logout
- [x] Protected routes
- [x] Admin authentication

### Career Assessment
- [x] Multi-step assessment wizard (5 steps)
- [x] Technical skills selection
- [x] Soft skills selection
- [x] Interest areas
- [x] Ability rating sliders (1-10)
- [x] Work preference selection

### ML-Powered Recommendations
- [x] Random Forest model for career prediction
- [x] Top 3 career recommendations with confidence scores
- [x] Skill gap analysis
- [x] Actionable improvement suggestions
- [x] **NO external API required** - fully self-contained

### Intelligent Explanations
- [x] Rule-based explanation generator
- [x] Personalized career insights
- [x] Strength analysis
- [x] Growth recommendations

### Admin Panel (/admin)
- [x] Dashboard with stats
- [x] User management
- [x] Prediction history
- [x] Analytics charts
- [x] **One-click model training**
- [x] Custom dataset upload (CSV/Excel)
- [x] Model version history

### PDF Reports
- [x] Server-side PDF generation
- [x] User profile summary
- [x] Career recommendations
- [x] Skill gap analysis
- [x] Actionable suggestions

## User Personas

### Students/Fresh Graduates
- Exploring career options
- Need guidance on skill development
- Want to understand job market requirements

### Career Changers
- Professionals seeking new directions
- Need to identify transferable skills
- Want targeted upskilling advice

### Administrators
- Monitor user activity
- Upload training datasets
- Retrain models with one click
- Track model performance

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Assessment
- POST /api/assessment/predict
- GET /api/assessment/history
- GET /api/assessment/{id}/pdf

### Admin
- GET /api/admin/stats
- GET /api/admin/users
- GET /api/admin/predictions
- GET /api/admin/analytics
- GET /api/admin/model/info
- POST /api/admin/model/train
- POST /api/admin/dataset/upload
- POST /api/admin/model/retrain

## Backlog (Future Enhancements)

### P0 (Critical)
- Improve model accuracy with larger dataset

### P1 (High Priority)
- Email notifications for new assessments
- Social sharing of results
- Mobile-responsive improvements

### P2 (Medium Priority)
- User profile editing
- Assessment comparison over time
- Industry-specific career paths
- Job market integration

## Credentials
- Admin: admin / Admin@12345
- Test User: testuser / Test@123

## Last Updated
- Date: 2026-05-06
- Status: MVP Complete
