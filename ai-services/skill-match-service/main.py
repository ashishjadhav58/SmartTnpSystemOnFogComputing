"""
Skill Match Service - FastAPI
Matches student skills with drive requirements using embeddings and cosine similarity
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = FastAPI(title="Skill Match Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize TF-IDF vectorizer for skill matching
vectorizer = TfidfVectorizer(analyzer='word', ngram_range=(1, 2), max_features=500)


class SkillMatchRequest(BaseModel):
    studentSkills: List[str]
    driveRequiredSkills: List[str]
    driveDescription: str = ""
    studentResume: str = ""


class SkillMatchResponse(BaseModel):
    matchPercentage: float
    missingSkills: List[str]
    matchedSkills: List[str]
    recommendations: List[str]


def normalize_skills(skills: List[str]) -> List[str]:
    """Normalize skill names (lowercase, remove special chars)"""
    normalized = []
    for skill in skills:
        # Remove extra whitespace and convert to lowercase
        cleaned = re.sub(r'[^\w\s]', '', skill.lower().strip())
        normalized.append(cleaned)
    return normalized


def calculate_skill_similarity(skill1: str, skill2: str) -> float:
    """Calculate similarity between two skills"""
    # Simple exact match
    if skill1.lower() == skill2.lower():
        return 1.0
    
    # Check if one contains the other
    if skill1.lower() in skill2.lower() or skill2.lower() in skill1.lower():
        return 0.8
    
    # Check for common words
    words1 = set(skill1.lower().split())
    words2 = set(skill2.lower().split())
    if words1 & words2:  # Intersection
        return 0.6
    
    return 0.0


def match_skills_tfidf(student_skills: List[str], drive_skills: List[str]) -> dict:
    """Match skills using TF-IDF and cosine similarity"""
    if not student_skills or not drive_skills:
        return {
            "matchPercentage": 0.0,
            "matchedSkills": [],
            "missingSkills": drive_skills.copy()
        }
    
    # Combine all skills for vectorization
    all_skills = student_skills + drive_skills
    
    try:
        # Fit and transform
        tfidf_matrix = vectorizer.fit_transform(all_skills)
        
        # Split matrix
        student_matrix = tfidf_matrix[:len(student_skills)]
        drive_matrix = tfidf_matrix[len(student_skills):]
        
        # Calculate cosine similarity
        similarity_matrix = cosine_similarity(student_matrix, drive_matrix)
        
        # Find best matches
        matched_skills = []
        missing_skills = []
        
        # For each drive skill, find best student skill match
        for i, drive_skill in enumerate(drive_skills):
            max_sim = similarity_matrix[:, i].max()
            best_match_idx = similarity_matrix[:, i].argmax()
            
            if max_sim > 0.3:  # Threshold for matching
                matched_skills.append({
                    "driveSkill": drive_skill,
                    "studentSkill": student_skills[best_match_idx],
                    "similarity": float(max_sim)
                })
            else:
                missing_skills.append(drive_skill)
        
        # Calculate overall match percentage
        match_percentage = (len(matched_skills) / len(drive_skills)) * 100 if drive_skills else 0
        
        return {
            "matchPercentage": round(match_percentage, 2),
            "matchedSkills": [m["driveSkill"] for m in matched_skills],
            "missingSkills": missing_skills
        }
    except Exception as e:
        print(f"Error in TF-IDF matching: {e}")
        return match_skills_simple(student_skills, drive_skills)


def match_skills_simple(student_skills: List[str], drive_skills: List[str]) -> dict:
    """Simple skill matching using string comparison"""
    student_normalized = normalize_skills(student_skills)
    drive_normalized = normalize_skills(drive_skills)
    
    matched = []
    missing = []
    
    for drive_skill in drive_normalized:
        found = False
        for student_skill in student_normalized:
            similarity = calculate_skill_similarity(student_skill, drive_skill)
            if similarity > 0.5:
                matched.append(drive_skills[drive_normalized.index(drive_skill)])
                found = True
                break
        
        if not found:
            missing.append(drive_skills[drive_normalized.index(drive_skill)])
    
    match_percentage = (len(matched) / len(drive_skills)) * 100 if drive_skills else 0
    
    return {
        "matchPercentage": round(match_percentage, 2),
        "matchedSkills": matched,
        "missingSkills": missing
    }


def extract_skills_from_text(text: str) -> List[str]:
    """Extract skills from text using common patterns"""
    # Common tech skills keywords
    tech_keywords = [
        'python', 'javascript', 'java', 'c++', 'react', 'node', 'angular', 'vue',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'mongodb', 'postgresql',
        'sql', 'nosql', 'machine learning', 'ai', 'data science', 'tensorflow',
        'pytorch', 'git', 'agile', 'scrum', 'rest api', 'graphql', 'microservices'
    ]
    
    text_lower = text.lower()
    found_skills = [kw for kw in tech_keywords if kw in text_lower]
    
    return found_skills


def generate_recommendations(match_percentage: float, missing_skills: List[str]) -> List[str]:
    """Generate recommendations based on match results"""
    recommendations = []
    
    if match_percentage >= 80:
        recommendations.append("Excellent match! You have most required skills.")
    elif match_percentage >= 60:
        recommendations.append("Good match. Consider learning the missing skills to improve your chances.")
    elif match_percentage >= 40:
        recommendations.append("Moderate match. Focus on acquiring the missing skills.")
    else:
        recommendations.append("Low match. Significant skill gap. Consider upskilling before applying.")
    
    if missing_skills:
        recommendations.append(f"Focus on learning: {', '.join(missing_skills[:3])}")
    
    if match_percentage < 70:
        recommendations.append("Consider taking online courses or certifications for missing skills")
    
    return recommendations


@app.post("/match/skills", response_model=SkillMatchResponse)
async def match_skills(request):
    """
    Match student skills with drive requirements
    """
    try:
        # Handle both dict and SkillMatchRequest object
        if isinstance(request, dict):
            req_obj = SkillMatchRequest(**request)
        else:
            req_obj = request
        
        # Extract skills with safe access
        student_skills = list(req_obj.studentSkills if hasattr(req_obj, 'studentSkills') else req_obj.get('studentSkills', []))
        drive_skills = list(req_obj.driveRequiredSkills if hasattr(req_obj, 'driveRequiredSkills') else req_obj.get('driveRequiredSkills', []))
        drive_description = str(req_obj.driveDescription if hasattr(req_obj, 'driveDescription') else req_obj.get('driveDescription', ''))
        student_resume = str(req_obj.studentResume if hasattr(req_obj, 'studentResume') else req_obj.get('studentResume', ''))
        
        # Extract skills from text if provided
        if student_resume:
            extracted = extract_skills_from_text(student_resume)
            student_skills.extend(extracted)
        
        if drive_description:
            extracted = extract_skills_from_text(drive_description)
            drive_skills.extend(extracted)
        
        # Remove duplicates and empty strings
        student_skills = list(set(str(s).strip() for s in student_skills if s and str(s).strip()))
        drive_skills = list(set(str(s).strip() for s in drive_skills if s and str(s).strip()))
        
        if not drive_skills:
            # Return zero match instead of error
            return SkillMatchResponse(
                matchPercentage=0.0,
                missingSkills=[],
                matchedSkills=[],
                recommendations=["No drive skills provided. Please add required skills to the drive."]
            )
        
        # Match skills
        if len(student_skills) > 0 and len(drive_skills) > 0:
            result = match_skills_tfidf(student_skills, drive_skills)
        else:
            result = match_skills_simple(student_skills, drive_skills)
        
        # Generate recommendations
        recommendations = generate_recommendations(
            result["matchPercentage"],
            result["missingSkills"]
        )
        
        return SkillMatchResponse(
            matchPercentage=result["matchPercentage"],
            missingSkills=result["missingSkills"],
            matchedSkills=result["matchedSkills"],
            recommendations=recommendations
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in match_skills: {e}")
        import traceback
        traceback.print_exc()
        # Return fallback response
        return SkillMatchResponse(
            matchPercentage=0.0,
            missingSkills=[],
            matchedSkills=[],
            recommendations=["Error matching skills. Please try again."]
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "skill-match-service"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
