"""
Resume AI Service - FastAPI
Provides resume scoring and improvement suggestions using TF-IDF, Logistic Regression, and LLM
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib
import os
import re
# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, will use system environment variables

from llm_service import (
    enhance_resume_section,
    generate_project_description,
    generate_internship_description,
    generate_cv_summary,
    generate_suggestions_for_section,
    generate_latex_resume,
    modify_resume_with_prompt,
    generate_with_llm
)

app = FastAPI(title="Resume AI Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models (in production, load pre-trained models)
vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
lr_model = None  # Will be initialized with training data

# Training data for resume scoring (example - should be replaced with real data)
training_resumes = [
    "Experienced software engineer with 5 years in Python, JavaScript, React, Node.js, AWS, Docker",
    "Fresh graduate with basic programming skills in Java and C++",
    "Senior developer with expertise in machine learning, data science, Python, TensorFlow, SQL",
    "Web developer with skills in HTML, CSS, JavaScript, React, MongoDB",
]
training_scores = [85, 45, 90, 70]  # Corresponding scores

# Initialize model
try:
    X_train = vectorizer.fit_transform(training_resumes)
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    lr_model.fit(X_train, training_scores)
    print("[OK] Resume AI model initialized successfully")
except Exception as e:
    print(f"[WARN] Model initialization warning: {e}")
    print("Using fallback scoring algorithm")
    lr_model = None


class ResumeData(BaseModel):
    education: List[dict] = []
    skills: List[str] = []
    projects: List[dict] = []
    internships: List[dict] = []
    rawText: Optional[str] = None  # Full resume text if available


class ResumeScoreResponse(BaseModel):
    resumeScore: float
    suggestions: List[str]
    strengths: List[str]
    weaknesses: List[str]
    atsScore: Optional[float] = None  # Industry-standard ATS score
    atsTargetMet: Optional[bool] = None  # Whether 80%+ target is met


class ResumeImproveRequest(BaseModel):
    section: str  # "education", "projects", "internships", "skills"
    content: str
    currentText: str


class ResumeImproveResponse(BaseModel):
    improvedText: str
    explanation: str


class GenerateProjectRequest(BaseModel):
    title: str
    technologies: List[str] = []
    userDescription: Optional[str] = ""


class GenerateInternshipRequest(BaseModel):
    company: str
    role: str
    userDescription: Optional[str] = ""


class GenerateCVRequest(BaseModel):
    education: List[dict] = []
    skills: List[str] = []
    projects: List[dict] = []
    internships: List[dict] = []


class GenerateSuggestionsRequest(BaseModel):
    section: str
    content: str


class GenerateLatexRequest(BaseModel):
    education: List[dict] = []
    skills: List[str] = []
    projects: List[dict] = []
    internships: List[dict] = []
    user: Optional[dict] = None


class ModifyResumeRequest(BaseModel):
    resume_data: dict
    prompt: str


def extract_text_from_resume(resume_data: ResumeData) -> str:
    """Extract text content from structured resume data"""
    text_parts = []
    
    try:
        # Handle both dict and object access
        education = resume_data.education if hasattr(resume_data, 'education') else resume_data.get('education', [])
        skills = resume_data.skills if hasattr(resume_data, 'skills') else resume_data.get('skills', [])
        projects = resume_data.projects if hasattr(resume_data, 'projects') else resume_data.get('projects', [])
        internships = resume_data.internships if hasattr(resume_data, 'internships') else resume_data.get('internships', [])
        raw_text = resume_data.rawText if hasattr(resume_data, 'rawText') else resume_data.get('rawText', None)
        
        # Education
        if education:
            for edu in education:
                if isinstance(edu, dict):
                    edu_text = f"{edu.get('degree', '')} from {edu.get('institution', '')} "
                    edu_text += f"CGPA: {edu.get('cgpa', '')} Year: {edu.get('year', '')}"
                    text_parts.append(edu_text)
        
        # Skills
        if skills:
            if isinstance(skills, list):
                text_parts.append(" ".join(str(s) for s in skills))
            else:
                text_parts.append(str(skills))
        
        # Projects
        if projects:
            for proj in projects:
                if isinstance(proj, dict):
                    proj_text = f"{proj.get('title', '')} {proj.get('description', '')} "
                    techs = proj.get('technologies', [])
                    if isinstance(techs, list):
                        proj_text += " ".join(str(t) for t in techs)
                    text_parts.append(proj_text)
        
        # Internships
        if internships:
            for intern in internships:
                if isinstance(intern, dict):
                    intern_text = f"{intern.get('role', '')} at {intern.get('company', '')} "
                    intern_text += f"{intern.get('description', '')}"
                    text_parts.append(intern_text)
        
        # Raw text if provided
        if raw_text:
            text_parts.append(str(raw_text))
    except Exception as e:
        print(f"Error extracting text from resume: {e}")
        # Fallback: convert entire object to string
        text_parts.append(str(resume_data))
    
    result = " ".join(text_parts)
    return result if result.strip() else "Resume content"


def calculate_resume_score(text: str) -> float:
    """Calculate resume score using ML model"""
    try:
        if lr_model is None:
            # Fallback scoring algorithm
            return calculate_fallback_score(text)
        
        X = vectorizer.transform([text])
        score = lr_model.predict(X)[0]
        return float(np.clip(score, 0, 100))
    except Exception as e:
        print(f"Error in score calculation: {e}")
        return calculate_fallback_score(text)


def calculate_ats_score(resume_data: ResumeData, text: str) -> dict:
    """
    Industry-standard ATS scoring algorithm targeting 80%+
    Based on industry best practices for ATS compatibility
    """
    text_lower = text.lower()
    scores = {}
    max_scores = {}
    recommendations = []
    
    # 1. Keywords & Skills (25 points)
    industry_keywords = [
        'python', 'javascript', 'react', 'node', 'aws', 'docker', 'kubernetes',
        'machine learning', 'data science', 'sql', 'mongodb', 'postgresql',
        'git', 'agile', 'scrum', 'api', 'rest', 'graphql', 'typescript',
        'java', 'spring', 'microservices', 'cloud', 'azure', 'gcp',
        'html', 'css', 'bootstrap', 'express', 'django', 'flask', 'vue',
        'angular', 'redux', 'mongodb', 'mysql', 'postgresql', 'redis',
        'linux', 'bash', 'ci/cd', 'jenkins', 'github', 'gitlab'
    ]
    found_keywords = sum(1 for kw in industry_keywords if kw in text_lower)
    keyword_score = min((found_keywords / len(industry_keywords)) * 25, 25)
    scores['keywords'] = keyword_score
    max_scores['keywords'] = 25
    if keyword_score < 15:
        recommendations.append("Add more industry-relevant technical keywords and skills")
    
    # 2. Skills Section Quality (15 points)
    skills = resume_data.skills if hasattr(resume_data, 'skills') else resume_data.get('skills', [])
    skills_count = len(skills) if isinstance(skills, list) else 0
    skills_score = min((skills_count / 15) * 15, 15) if skills_count > 0 else 0
    scores['skills'] = skills_score
    max_scores['skills'] = 15
    if skills_count < 8:
        recommendations.append("Include at least 8-10 relevant technical skills")
    
    # 3. Education Section (10 points)
    education = resume_data.education if hasattr(resume_data, 'education') else resume_data.get('education', [])
    education_count = len(education) if isinstance(education, list) else 0
    education_quality = 0
    if education_count > 0:
        for edu in education:
            if isinstance(edu, dict):
                if edu.get('degree') and edu.get('institution'):
                    education_quality += 1
                if edu.get('cgpa') or edu.get('year'):
                    education_quality += 0.5
    education_score = min((education_quality / 2) * 10, 10)
    scores['education'] = education_score
    max_scores['education'] = 10
    if education_score < 7:
        recommendations.append("Ensure education section includes degree, institution, CGPA, and year")
    
    # 4. Projects Section (20 points)
    projects = resume_data.projects if hasattr(resume_data, 'projects') else resume_data.get('projects', [])
    projects_count = len(projects) if isinstance(projects, list) else 0
    projects_quality = 0
    if projects_count > 0:
        for proj in projects:
            if isinstance(proj, dict):
                quality_points = 0
                if proj.get('title'):
                    quality_points += 1
                if proj.get('description') and len(str(proj.get('description', ''))) > 50:
                    quality_points += 2
                if proj.get('technologies') and len(proj.get('technologies', [])) > 0:
                    quality_points += 1
                projects_quality += min(quality_points, 4)
    projects_score = min((projects_quality / (projects_count * 4 if projects_count > 0 else 1)) * 20, 20) if projects_count > 0 else 0
    scores['projects'] = projects_score
    max_scores['projects'] = 20
    if projects_score < 12:
        recommendations.append("Add detailed project descriptions with technologies used and achievements")
    
    # 5. Internships/Experience (15 points)
    internships = resume_data.internships if hasattr(resume_data, 'internships') else resume_data.get('internships', [])
    internships_count = len(internships) if isinstance(internships, list) else 0
    internships_quality = 0
    if internships_count > 0:
        for intern in internships:
            if isinstance(intern, dict):
                quality_points = 0
                if intern.get('company') and intern.get('role'):
                    quality_points += 2
                if intern.get('description') and len(str(intern.get('description', ''))) > 50:
                    quality_points += 2
                if intern.get('duration'):
                    quality_points += 1
                internships_quality += min(quality_points, 5)
    internships_score = min((internships_quality / (internships_count * 5 if internships_count > 0 else 1)) * 15, 15) if internships_count > 0 else 0
    scores['internships'] = internships_score
    max_scores['internships'] = 15
    if internships_score < 9:
        recommendations.append("Add detailed internship/experience descriptions with company, role, and achievements")
    
    # 6. Action Verbs & Quantifiable Achievements (10 points)
    action_verbs = ['developed', 'implemented', 'designed', 'created', 'built', 'optimized', 
                    'improved', 'led', 'managed', 'achieved', 'increased', 'reduced', 
                    'delivered', 'collaborated', 'analyzed', 'solved', 'enhanced']
    found_verbs = sum(1 for verb in action_verbs if verb in text_lower)
    verb_score = min((found_verbs / 10) * 10, 10)
    scores['action_verbs'] = verb_score
    max_scores['action_verbs'] = 10
    
    # Check for quantifiable achievements (numbers, percentages, metrics)
    has_numbers = bool(re.search(r'\d+', text))
    has_percentages = bool(re.search(r'\d+%', text))
    has_metrics = bool(re.search(r'\d+\s*(users|projects|lines|hours|days|months|years|%|times)', text_lower))
    quant_score = 0
    if has_numbers:
        quant_score += 2
    if has_percentages:
        quant_score += 2
    if has_metrics:
        quant_score += 1
    scores['quantifiable'] = quant_score
    max_scores['quantifiable'] = 5
    if quant_score < 3:
        recommendations.append("Add quantifiable achievements (numbers, percentages, metrics) to demonstrate impact")
    
    # 7. Content Length & Quality (5 points)
    word_count = len(text.split())
    if word_count >= 300:
        length_score = 5
    elif word_count >= 200:
        length_score = 4
    elif word_count >= 100:
        length_score = 3
    else:
        length_score = max(word_count / 50, 1)
    scores['content_length'] = length_score
    max_scores['content_length'] = 5
    if word_count < 200:
        recommendations.append("Expand resume content to at least 200-300 words for better ATS parsing")
    
    # 8. ATS Formatting Compliance (5 points)
    # Check for ATS-friendly formatting indicators
    has_standard_sections = bool(re.search(r'\b(education|experience|skills|projects|internships|summary|objective)\b', text_lower))
    has_proper_bullets = bool(re.search(r'[•\-\*]|item|bullet', text_lower))
    has_proper_dates = bool(re.search(r'\d{4}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}', text_lower))
    
    formatting_score = 0
    if has_standard_sections:
        formatting_score += 2
    if has_proper_bullets:
        formatting_score += 1.5
    if has_proper_dates:
        formatting_score += 1.5
    scores['ats_formatting'] = formatting_score
    max_scores['ats_formatting'] = 5
    if formatting_score < 3:
        recommendations.append("Use standard section names (Education, Experience, Skills) and proper formatting for ATS compatibility")
    
    # Calculate total ATS score
    total_score = sum(scores.values())
    max_total = sum(max_scores.values())
    ats_percentage = (total_score / max_total) * 100 if max_total > 0 else 0
    
    # Boost score for well-structured resumes (industry standard practice)
    structure_boost = 0
    if projects_count >= 2 and internships_count >= 1 and skills_count >= 8:
        structure_boost = 5  # Good structure bonus
    if projects_count >= 3 and internships_count >= 2 and skills_count >= 12:
        structure_boost = 10  # Excellent structure bonus
    
    ats_percentage = min(ats_percentage + structure_boost, 100)
    
    # Final recommendations based on score
    if ats_percentage < 80:
        if ats_percentage < 60:
            recommendations.insert(0, "URGENT: Resume needs significant improvements to meet 80%+ ATS standard. Focus on adding keywords, skills, and detailed project descriptions.")
        else:
            recommendations.insert(0, f"Current ATS Score: {ats_percentage:.1f}%. You're close! Add more keywords, quantifiable achievements, and detailed descriptions to reach 80%+.")
    else:
        recommendations.insert(0, f"Congratulations! Your resume achieved {ats_percentage:.1f}% ATS compatibility, meeting the industry standard of 80%+!")
    
    return {
        'ats_score': round(ats_percentage, 2),
        'detailed_scores': scores,
        'max_scores': max_scores,
        'recommendations': recommendations,
        'target_met': ats_percentage >= 80,
        'structure_boost_applied': structure_boost > 0
    }


def calculate_fallback_score(text: str) -> float:
    """Fallback scoring - now uses ATS algorithm"""
    # This will be called with ResumeData, but for backward compatibility
    # we'll use a simplified version
    keywords = [
        'python', 'javascript', 'react', 'node', 'aws', 'docker', 'kubernetes',
        'machine learning', 'data science', 'sql', 'mongodb', 'postgresql',
        'git', 'agile', 'scrum', 'api', 'rest', 'graphql', 'typescript',
        'java', 'spring', 'microservices', 'cloud', 'azure', 'gcp'
    ]
    
    text_lower = text.lower()
    found_keywords = sum(1 for kw in keywords if kw in text_lower)
    
    # Enhanced scoring
    keyword_score = min((found_keywords / len(keywords)) * 40, 40)
    word_count = len(text.split())
    length_score = min((word_count / 300) * 20, 20)
    sections = ['education', 'experience', 'project', 'skill', 'internship']
    structure_score = min((sum(1 for s in sections if s in text_lower) / len(sections)) * 20, 20)
    
    # Action verbs bonus
    action_verbs = ['developed', 'implemented', 'designed', 'created', 'built', 'optimized']
    verb_bonus = min((sum(1 for v in action_verbs if v in text_lower) / 5) * 10, 10)
    
    # Quantifiable achievements bonus
    has_numbers = bool(re.search(r'\d+', text))
    quant_bonus = 5 if has_numbers else 0
    
    total_score = keyword_score + length_score + structure_score + verb_bonus + quant_bonus
    return float(np.clip(total_score, 0, 100))


def generate_suggestions(text: str, score: float) -> dict:
    """Generate AI-powered suggestions for resume improvement"""
    suggestions = []
    strengths = []
    weaknesses = []
    
    text_lower = text.lower()
    
    # Check for strengths
    if any(tech in text_lower for tech in ['python', 'javascript', 'react', 'node']):
        strengths.append("Strong technical skills in modern web technologies")
    
    if any(word in text_lower for word in ['project', 'internship', 'experience']):
        strengths.append("Good practical experience mentioned")
    
    if 'cgpa' in text_lower or 'gpa' in text_lower:
        strengths.append("Academic performance highlighted")
    
    # Check for weaknesses and suggest improvements
    if score < 50:
        suggestions.append("Add more technical skills relevant to your target role")
        weaknesses.append("Limited technical skills mentioned")
    
    if len(text.split()) < 100:
        suggestions.append("Expand your resume with more detailed descriptions")
        weaknesses.append("Resume content is too brief")
    
    if 'project' not in text_lower and 'internship' not in text_lower:
        suggestions.append("Include projects or internships to demonstrate practical experience")
        weaknesses.append("Missing practical experience")
    
    if not any(word in text_lower for word in ['leadership', 'team', 'collaboration']):
        suggestions.append("Highlight soft skills like teamwork and leadership")
        weaknesses.append("Soft skills not emphasized")
    
    if not suggestions:
        suggestions.append("Your resume looks good! Consider adding quantifiable achievements")
    
    return {
        "suggestions": suggestions[:5],  # Top 5 suggestions
        "strengths": strengths[:3],
        "weaknesses": weaknesses[:3]
    }


def improve_text_with_llm(section: str, content: str, current_text: str) -> dict:
    """
    Improve resume text using LLM (OpenAI, Anthropic, Ollama, or fallback)
    """
    try:
        return enhance_resume_section(section, content, current_text)
    except Exception as e:
        print(f"Error in LLM enhancement: {e}")
        # Fallback to simple improvement
        improved = current_text
        if section in ["projects", "internships"]:
            action_verbs = ["Developed", "Implemented", "Designed", "Optimized", "Led"]
            if not any(verb in current_text for verb in action_verbs):
                improved = f"Developed {current_text.lower()}"
        
        return {
            "improvedText": improved,
            "explanation": f"Enhanced {section} section with professional language"
        }


@app.post("/resume/score", response_model=ResumeScoreResponse)
async def score_resume(resume_data):
    """
    Score a resume and provide suggestions
    """
    try:
        # Handle both dict and ResumeData object with better error handling
        try:
            if isinstance(resume_data, dict):
                # Validate and convert dict to ResumeData
                # Ensure all fields are properly formatted
                validated_data = {
                    "education": resume_data.get("education", []) or [],
                    "skills": resume_data.get("skills", []) or [],
                    "projects": resume_data.get("projects", []) or [],
                    "internships": resume_data.get("internships", []) or [],
                    "rawText": resume_data.get("rawText")
                }
                # Ensure lists contain proper types
                if not isinstance(validated_data["education"], list):
                    validated_data["education"] = []
                if not isinstance(validated_data["skills"], list):
                    validated_data["skills"] = []
                if not isinstance(validated_data["projects"], list):
                    validated_data["projects"] = []
                if not isinstance(validated_data["internships"], list):
                    validated_data["internships"] = []
                
                resume_data_obj = ResumeData(**validated_data)
            else:
                resume_data_obj = resume_data
        except Exception as validation_err:
            print(f"Validation error: {validation_err}")
            print(f"Received data: {resume_data}")
            # Try to extract what we can
            try:
                # Fallback: create minimal valid ResumeData
                resume_data_obj = ResumeData(
                    education=[],
                    skills=[],
                    projects=[],
                    internships=[]
                )
                # Try to extract data manually
                if isinstance(resume_data, dict):
                    if "education" in resume_data:
                        resume_data_obj.education = resume_data["education"] if isinstance(resume_data["education"], list) else []
                    if "skills" in resume_data:
                        resume_data_obj.skills = resume_data["skills"] if isinstance(resume_data["skills"], list) else []
                    if "projects" in resume_data:
                        resume_data_obj.projects = resume_data["projects"] if isinstance(resume_data["projects"], list) else []
                    if "internships" in resume_data:
                        resume_data_obj.internships = resume_data["internships"] if isinstance(resume_data["internships"], list) else []
            except:
                # Last resort: return basic score
                return ResumeScoreResponse(
                    resumeScore=30.0,
                    suggestions=["Unable to parse resume data. Please check the format."],
                    strengths=[],
                    weaknesses=["Data format error"]
                )
        
        # Extract text from structured data
        resume_text = extract_text_from_resume(resume_data_obj)
        
        # Allow shorter resumes (minimum 5 characters)
        if not resume_text or len(resume_text.strip()) < 5:
            # Return minimum score instead of error
            return ResumeScoreResponse(
                resumeScore=10.0,
                suggestions=["Please add more content to your resume"],
                strengths=[],
                weaknesses=["Resume content is too brief"]
            )
        
        # Calculate industry-standard ATS score
        ats_result = calculate_ats_score(resume_data_obj, resume_text)
        ats_score = ats_result['ats_score']
        
        # Also calculate traditional score for comparison
        traditional_score = calculate_resume_score(resume_text)
        
        # Use the higher of ATS score or traditional score, but prioritize ATS
        final_score = max(ats_score, traditional_score * 0.9)  # Slight bias toward ATS
        
        # Generate suggestions with ATS recommendations
        feedback = generate_suggestions(resume_text, final_score)
        
        # Add ATS-specific recommendations
        if ats_result['recommendations']:
            feedback['suggestions'] = ats_result['recommendations'][:3] + feedback['suggestions']
            feedback['suggestions'] = feedback['suggestions'][:5]  # Keep top 5
        
        # Add ATS score info to strengths/weaknesses
        if ats_result['target_met']:
            feedback['strengths'].insert(0, f"Excellent ATS compatibility ({ats_score:.1f}%) - Industry standard met!")
        else:
            feedback['weaknesses'].insert(0, f"ATS score: {ats_score:.1f}% (Target: 80%+) - See recommendations to improve")
        
        return ResumeScoreResponse(
            resumeScore=round(final_score, 2),
            suggestions=feedback["suggestions"],
            strengths=feedback["strengths"],
            weaknesses=feedback["weaknesses"],
            atsScore=round(ats_score, 2),
            atsTargetMet=ats_result['target_met']
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in score_resume: {e}")
        import traceback
        traceback.print_exc()
        # Return fallback response instead of error
        return ResumeScoreResponse(
            resumeScore=50.0,
            suggestions=["Error processing resume. Please try again."],
            strengths=[],
            weaknesses=[]
        )


@app.post("/resume/improve", response_model=ResumeImproveResponse)
async def improve_resume(request: ResumeImproveRequest):
    """
    Improve a specific section of the resume using LLM
    """
    try:
        result = improve_text_with_llm(
            request.section,
            request.content,
            request.currentText
        )
        
        return ResumeImproveResponse(
            improvedText=result["improvedText"],
            explanation=result["explanation"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error improving resume: {str(e)}")


@app.post("/resume/generate-project", response_model=dict)
async def generate_project(request: GenerateProjectRequest):
    """Generate professional project description using LLM"""
    try:
        description = generate_project_description(
            request.title,
            request.technologies,
            request.userDescription or ""
        )
        return {"description": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating project description: {str(e)}")


@app.post("/resume/generate-internship", response_model=dict)
async def generate_internship(request: GenerateInternshipRequest):
    """Generate professional internship description using LLM"""
    try:
        description = generate_internship_description(
            request.company,
            request.role,
            request.userDescription or ""
        )
        return {"description": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating internship description: {str(e)}")


@app.post("/resume/generate-cv-summary", response_model=dict)
async def generate_cv(request: GenerateCVRequest):
    """Generate professional CV summary using LLM"""
    try:
        resume_data = {
            "education": request.education,
            "skills": request.skills,
            "projects": request.projects,
            "internships": request.internships
        }
        summary = generate_cv_summary(resume_data)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating CV summary: {str(e)}")


@app.post("/resume/generate-suggestions", response_model=dict)
async def generate_suggestions_endpoint(request: GenerateSuggestionsRequest):
    """Generate improvement suggestions for a resume section"""
    try:
        suggestions = generate_suggestions_for_section(request.section, request.content)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating suggestions: {str(e)}")


@app.post("/resume/generate-latex", response_model=dict)
async def generate_latex(request: GenerateLatexRequest):
    """Generate LaTeX-formatted resume for better ATS scoring"""
    try:
        resume_data = {
            "education": request.education,
            "skills": request.skills,
            "projects": request.projects,
            "internships": request.internships,
            "user": request.user or {}
        }
        latex_code = generate_latex_resume(resume_data)
        return {"latex": latex_code, "format": "latex", "ats_optimized": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating LaTeX resume: {str(e)}")


@app.post("/resume/modify", response_model=dict)
async def modify_resume(request: ModifyResumeRequest):
    """Modify resume based on user prompt"""
    try:
        modified_data = modify_resume_with_prompt(request.resume_data, request.prompt)
        return {
            "modified_resume": modified_data,
            "message": "Resume modified successfully based on your prompt"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error modifying resume: {str(e)}")


@app.post("/resume/chat")
async def chat_with_ai(request: dict):
    """
    AI Chat Assistant endpoint - Uses LLaMA (Groq) for code explanation and general assistance
    """
    try:
        user_message = request.get("message", "")
        user_role = request.get("userRole", "Student")
        conversation_history = request.get("history", [])  # Previous messages for context
        
        if not user_message:
            return {"error": "Message is required"}
        
        # Build contextual system prompt based on user role
        system_prompts = {
            'Student': """You are an AI assistant for a Training & Placement system. The user is a student. Help them with:
- Placement drive eligibility and requirements
- Resume building and improvement tips
- Career guidance and skill recommendations
- Code explanation and programming help
- System navigation and features
Be helpful, concise, and encouraging. When explaining code, provide clear explanations with examples.""",
            'Recruiter': """You are an AI assistant for a Training & Placement system. The user is a recruiter. Help them with:
- Finding students matching their requirements
- Understanding AI fit scores and filtering strategies
- Drive creation guidelines and best practices
- Code explanation if they ask about system features
- Student filtering and analytics
Be professional and informative.""",
            'Training and placement officer': """You are an AI assistant for a Training & Placement system. The user is a TPO. Help them with:
- System statistics and analytics
- Student performance metrics and insights
- Drive approval guidelines
- Recruiter management
- Code explanation for system features
Be professional and data-focused.""",
            'Class Teacher': """You are an AI assistant for a Training & Placement system. The user is a class teacher. Help them with:
- Student information and profiles
- Attendance tracking and performance monitoring
- Communication with students
- Code explanation if needed
Be helpful and informative."""
        }
        
        system_prompt = system_prompts.get(user_role, system_prompts['Student'])
        
        # Build conversation context
        messages_text = ""
        if conversation_history:
            # Include last 5 messages for context (to avoid token limits)
            recent_history = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history
            for msg in recent_history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                messages_text += f"{role.capitalize()}: {content}\n"
        
        # Create the full prompt
        full_prompt = f"{messages_text}User: {user_message}\nAssistant:"
        
        # Check if user is asking about code
        is_code_question = any(keyword in user_message.lower() for keyword in [
            'code', 'function', 'class', 'variable', 'explain', 'how does', 'what does',
            'javascript', 'python', 'react', 'node', 'api', 'endpoint', 'route',
            'component', 'hook', 'state', 'props', 'async', 'await', 'promise'
        ])
        
        # Enhance prompt for code explanation
        if is_code_question:
            system_prompt += "\n\nWhen explaining code:\n- Break down complex code into simple steps\n- Explain what each part does\n- Provide examples and use cases\n- Mention best practices and common patterns\n- Be clear and educational."
        
        # Generate response using LLaMA (Groq)
        response = generate_with_llm(full_prompt, system_prompt, max_tokens=1000)
        
        if not response:
            response = "I apologize, but I'm having trouble processing your request right now. Please try again or rephrase your question."
        
        return {
            "response": response,
            "model": "llama-3.1-8b-instant (Groq)",
            "role": user_role
        }
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": "Failed to generate response",
            "details": str(e),
            "response": "I encountered an error. Please try again or rephrase your question."
        }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    llm_provider = os.getenv("LLM_PROVIDER", "fallback")
    groq_configured = "OK" if (llm_provider == "groq" and os.getenv("GROQ_API_KEY")) else "NOT_CONFIGURED"
    return {
        "status": "healthy", 
        "service": "resume-ai-service", 
        "llm_provider": llm_provider,
        "groq_configured": groq_configured
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
