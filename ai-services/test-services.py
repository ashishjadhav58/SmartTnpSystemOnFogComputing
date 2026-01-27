#!/usr/bin/env python3
"""
Test script to verify AI services are working correctly
"""

import urllib.request
import urllib.error
import json
import sys

def test_resume_ai():
    """Test Resume AI Service"""
    print("\n=== Testing Resume AI Service ===")
    url = "http://localhost:8001/resume/score"
    data = {
        "education": [{"degree": "B.Tech", "institution": "University", "year": "2024", "cgpa": 8.5}],
        "skills": ["Python", "JavaScript", "React"],
        "projects": [{"title": "Web App", "description": "Built a web application", "technologies": ["React", "Node.js"]}],
        "internships": []
    }
    
    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode())
            print(f"[OK] Resume Score: {result.get('resumeScore', 'N/A')}")
            print(f"[OK] Suggestions: {len(result.get('suggestions', []))} suggestions")
            return True
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return False

def test_placement_prediction():
    """Test Placement Prediction Service"""
    print("\n=== Testing Placement Prediction Service ===")
    url = "http://localhost:8002/predict/placement"
    data = {
        "resumeScore": 75,
        "cgpa": 8.5,
        "attendancePercent": 90,
        "hasInternship": True,
        "numProjects": 3,
        "numSkills": 10
    }
    
    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode())
            print(f"[OK] Placement Score: {result.get('mostLikelyScore', 'N/A')}")
            print(f"[OK] Prediction: {result.get('prediction', 'N/A')}")
            return True
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return False

def test_skill_match():
    """Test Skill Match Service"""
    print("\n=== Testing Skill Match Service ===")
    url = "http://localhost:8003/match/skills"
    data = {
        "studentSkills": ["Python", "JavaScript"],
        "driveRequiredSkills": ["Python", "React", "Node.js"],
        "driveDescription": "",
        "studentResume": ""
    }
    
    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode())
            print(f"[OK] Match Percentage: {result.get('matchPercentage', 'N/A')}%")
            print(f"[OK] Missing Skills: {len(result.get('missingSkills', []))}")
            return True
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return False

def main():
    print("Testing AI Microservices...")
    print("=" * 50)
    
    results = []
    results.append(("Resume AI", test_resume_ai()))
    results.append(("Placement Prediction", test_placement_prediction()))
    results.append(("Skill Match", test_skill_match()))
    
    print("\n" + "=" * 50)
    print("Test Results:")
    for name, success in results:
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status} {name}")
    
    all_passed = all(result[1] for result in results)
    if all_passed:
        print("\n[SUCCESS] All services are working correctly!")
        sys.exit(0)
    else:
        print("\n[WARNING] Some services failed. Check if services are running.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
