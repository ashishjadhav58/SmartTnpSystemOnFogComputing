"""
LLM Service Module for Resume Generation
Supports multiple LLM providers: OpenAI, Anthropic, Ollama (LLaMA), and fallback
"""

import os
import json
import re
from typing import Dict, List, Optional
import requests

# Load environment variables from .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()  # Load .env file if it exists
    print("[OK] Loaded environment variables from .env file")
except ImportError:
    # python-dotenv not installed, will use system environment variables
    pass

# LLM Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "fallback").lower()  # openai, anthropic, ollama, groq, fallback
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama2")  # or llama3, mistral, etc.
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")  # llama-3.1-8b-instant (fast), llama-3.1-70b-versatile (accurate), mixtral-8x7b-32768 (long context)

# Print configuration status (without exposing keys)
if LLM_PROVIDER == "groq" and GROQ_API_KEY:
    print(f"[OK] Groq LLM configured (Model: {GROQ_MODEL})")
elif LLM_PROVIDER != "fallback":
    print(f"[WARN] LLM Provider: {LLM_PROVIDER}, but API key not found. Using fallback mode.")
else:
    print("[INFO] Using fallback LLM mode (no API keys required)")


def call_openai(prompt: str, system_prompt: str = None, max_tokens: int = 500) -> str:
    """Call OpenAI API (GPT-3.5/4)"""
    try:
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7
        }
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"].strip()
        else:
            print(f"OpenAI API error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error calling OpenAI: {e}")
        return None


def call_anthropic(prompt: str, system_prompt: str = None, max_tokens: int = 500) -> str:
    """Call Anthropic API (Claude)"""
    try:
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        
        messages = [{"role": "user", "content": prompt}]
        
        payload = {
            "model": "claude-3-sonnet-20240229",
            "max_tokens": max_tokens,
            "messages": messages
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()["content"][0]["text"].strip()
        else:
            print(f"Anthropic API error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error calling Anthropic: {e}")
        return None


def call_groq(prompt: str, system_prompt: str = None, max_tokens: int = 500) -> str:
    """Call Groq API (Fast LLaMA 3 models)"""
    try:
        from groq import Groq
        
        client = Groq(api_key=GROQ_API_KEY)
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    except ImportError:
        print("Groq SDK not installed. Install with: pip install groq")
        return None
    except Exception as e:
        print(f"Error calling Groq: {e}")
        return None


def call_ollama(prompt: str, system_prompt: str = None, max_tokens: int = 500) -> str:
    """Call Ollama API (Local LLaMA models)"""
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": 0.7
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=60  # Local models may take longer
        )
        
        if response.status_code == 200:
            return response.json().get("response", "").strip()
        else:
            print(f"Ollama API error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return None


def fallback_llm(prompt: str, system_prompt: str = None) -> str:
    """Fallback rule-based LLM for when no API is available"""
    # Enhanced rule-based generation
    prompt_lower = prompt.lower()
    
    # Education enhancement
    if "education" in prompt_lower or "degree" in prompt_lower:
        if "cgpa" in prompt_lower or "gpa" in prompt_lower:
            return "Academic excellence demonstrated through strong performance. Relevant coursework and projects showcase technical proficiency and dedication to learning."
        return "Strong educational foundation with focus on practical application of theoretical knowledge. Active participation in academic projects and coursework."
    
    # Project enhancement
    if "project" in prompt_lower:
        if "web" in prompt_lower or "app" in prompt_lower:
            return "Developed a full-stack application using modern technologies, implementing best practices for scalability and user experience. Achieved measurable improvements in performance and functionality."
        if "machine learning" in prompt_lower or "ai" in prompt_lower:
            return "Implemented machine learning models with focus on accuracy and efficiency. Applied data science techniques to solve real-world problems with quantifiable results."
        return "Led development of innovative project, applying technical skills to deliver solutions. Demonstrated problem-solving abilities and technical expertise."
    
    # Internship enhancement
    if "internship" in prompt_lower or "experience" in prompt_lower:
        return "Gained valuable industry experience, contributing to team projects and learning best practices. Developed professional skills and applied academic knowledge in real-world scenarios."
    
    # Skills enhancement
    if "skill" in prompt_lower:
        return "Proficient in multiple technologies with hands-on experience. Continuously learning and adapting to new tools and frameworks. Strong foundation in both frontend and backend development."
    
    # Default enhancement
    return "Enhanced content with professional language, quantifiable achievements, and action-oriented descriptions. Highlighted key contributions and measurable impact."


def generate_with_llm(prompt: str, system_prompt: str = None, max_tokens: int = 500) -> str:
    """Main function to generate text using configured LLM provider"""
    if not prompt or not prompt.strip():
        return ""
    
    result = None
    
    # Try Groq first (fastest and free)
    if LLM_PROVIDER == "groq" and GROQ_API_KEY:
        result = call_groq(prompt, system_prompt, max_tokens)
    elif LLM_PROVIDER == "openai" and OPENAI_API_KEY:
        result = call_openai(prompt, system_prompt, max_tokens)
    elif LLM_PROVIDER == "anthropic" and ANTHROPIC_API_KEY:
        result = call_anthropic(prompt, system_prompt, max_tokens)
    elif LLM_PROVIDER == "ollama":
        result = call_ollama(prompt, system_prompt, max_tokens)
    
    # Fallback if API call failed or provider is "fallback"
    if not result:
        result = fallback_llm(prompt, system_prompt)
    
    return result


def enhance_resume_section(section: str, content: str, current_text: str) -> Dict[str, str]:
    """Enhance a specific resume section using LLM"""
    system_prompt = """You are an expert resume writer. Your task is to improve resume content to make it more professional, impactful, and ATS-friendly. 
    Use action verbs, quantifiable achievements, and industry-standard language. Keep it concise (1-2 sentences for bullet points)."""
    
    prompt = f"""Improve the following {section} section for a resume:

Current text: {current_text}

Context: {content}

Provide an improved, professional version that:
1. Uses strong action verbs (Developed, Implemented, Designed, Optimized, Led, etc.)
2. Includes quantifiable achievements where possible
3. Is concise and impactful
4. Follows industry best practices

Improved text:"""
    
    improved_text = generate_with_llm(prompt, system_prompt, max_tokens=200)
    
    explanation = f"Enhanced {section} section with professional language, action verbs, and measurable outcomes"
    
    return {
        "improvedText": improved_text,
        "explanation": explanation
    }


def generate_project_description(title: str, technologies: List[str], user_description: str = "") -> str:
    """Generate professional project description"""
    system_prompt = """You are an expert at writing resume project descriptions. Create concise, impactful descriptions that highlight technical skills and achievements."""
    
    tech_str = ", ".join(technologies) if technologies else "various technologies"
    
    prompt = f"""Write a professional 2-3 sentence project description for a resume:

Project Title: {title}
Technologies: {tech_str}
User's description: {user_description if user_description else "No additional details provided"}

Create a description that:
- Starts with a strong action verb
- Highlights technical implementation
- Mentions key technologies used
- Shows impact or learning outcomes

Project Description:"""
    
    return generate_with_llm(prompt, system_prompt, max_tokens=150)


def generate_internship_description(company: str, role: str, user_description: str = "") -> str:
    """Generate professional internship description"""
    system_prompt = """You are an expert at writing resume internship descriptions. Create professional descriptions that highlight contributions and learning."""
    
    prompt = f"""Write a professional 2-3 sentence internship description for a resume:

Company: {company}
Role: {role}
User's description: {user_description if user_description else "No additional details provided"}

Create a description that:
- Starts with a strong action verb
- Highlights specific contributions
- Shows skills learned or applied
- Demonstrates professional growth

Internship Description:"""
    
    return generate_with_llm(prompt, system_prompt, max_tokens=150)


def generate_cv_summary(resume_data: Dict) -> str:
    """Generate professional CV summary/objective"""
    system_prompt = """You are an expert at writing CV summaries. Create compelling professional summaries that highlight key qualifications and career objectives."""
    
    # Extract key information
    education = resume_data.get("education", [])
    skills = resume_data.get("skills", [])
    projects = resume_data.get("projects", [])
    internships = resume_data.get("internships", [])
    
    prompt = f"""Write a professional 3-4 sentence CV summary/objective for a student:

Education: {json.dumps(education[:2]) if education else "No education listed"}
Key Skills: {', '.join(skills[:10]) if skills else "No skills listed"}
Projects: {len(projects)} project(s) completed
Internships: {len(internships)} internship(s) completed

Create a summary that:
- Highlights educational background
- Mentions key technical skills
- Shows practical experience
- Expresses career goals or value proposition

CV Summary:"""
    
    return generate_with_llm(prompt, system_prompt, max_tokens=200)


def generate_suggestions_for_section(section: str, content: str) -> List[str]:
    """Generate improvement suggestions for a resume section"""
    system_prompt = """You are a resume expert. Provide specific, actionable suggestions for improving resume sections."""
    
    prompt = f"""Analyze this {section} section and provide 3-5 specific improvement suggestions:

Content: {content}

Provide suggestions that are:
- Specific and actionable
- Focused on ATS optimization
- Industry-relevant
- Practical to implement

Suggestions (one per line):"""
    
    suggestions_text = generate_with_llm(prompt, system_prompt, max_tokens=300)
    
    # Parse suggestions (split by newlines or numbers)
    suggestions = []
    for line in suggestions_text.split('\n'):
        line = line.strip()
        # Remove numbering (1., 2., -, etc.)
        line = re.sub(r'^[\d\-\.\)]\s*', '', line)
        if line and len(line) > 10:  # Filter out very short lines
            suggestions.append(line)
    
    return suggestions[:5]  # Return top 5 suggestions


def generate_latex_resume(resume_data: Dict) -> str:
    """
    Generate LaTeX-formatted resume for better ATS (Applicant Tracking System) compatibility
    Returns LaTeX code that can be compiled to PDF
    """
    try:
        education = resume_data.get("education", [])
        skills = resume_data.get("skills", [])
        projects = resume_data.get("projects", [])
        internships = resume_data.get("internships", [])
        user_info = resume_data.get("user", {})
        
        name = user_info.get("username", "Your Name") if isinstance(user_info, dict) else "Your Name"
        email = user_info.get("email", "") if isinstance(user_info, dict) else ""
        
        system_prompt = """You are an expert LaTeX resume writer specializing in ATS-optimized resumes.
        Generate professional LaTeX resume code that achieves 80%+ ATS compatibility.
        Industry standards for ATS optimization:
        1. Use standard section names (Education, Experience, Skills, Projects)
        2. Avoid complex tables, graphics, or non-standard formatting
        3. Use simple, clean formatting with proper headings
        4. Include quantifiable achievements with numbers
        5. Use action verbs (Developed, Implemented, Designed, etc.)
        6. Ensure proper keyword density for technical skills
        7. Use standard LaTeX packages: article, geometry, enumitem, xcolor, fontawesome5
        8. Keep formatting simple and ATS-parseable
        Make it clean, professional, and optimized for 80%+ ATS score."""
        
        prompt = f"""Generate a complete LaTeX resume document for:
        
        Name: {name}
        Email: {email}
        
        Education:
        {json.dumps(education, indent=2)}
        
        Skills:
        {', '.join(skills) if isinstance(skills, list) else skills}
        
        Projects:
        {json.dumps(projects, indent=2)}
        
        Internships:
        {json.dumps(internships, indent=2)}
        
        Generate a complete, compilable LaTeX document using modern resume template.
        Include proper document structure, sections, and formatting.
        Use bullet points for descriptions and ensure ATS compatibility.
        Return ONLY the LaTeX code, no explanations."""
        
        latex_code = generate_with_llm(prompt, system_prompt, max_tokens=3000)
        
        # If LLM didn't provide complete LaTeX, create a template
        if not latex_code or "\\documentclass" not in latex_code:
            latex_code = create_latex_template(name, email, education, skills, projects, internships)
        
        return latex_code
    except Exception as e:
        print(f"Error generating LaTeX resume: {e}")
        # Return fallback template
        return create_latex_template(
            resume_data.get("user", {}).get("username", "Your Name") if isinstance(resume_data.get("user"), dict) else "Your Name",
            resume_data.get("user", {}).get("email", "") if isinstance(resume_data.get("user"), dict) else "",
            resume_data.get("education", []),
            resume_data.get("skills", []),
            resume_data.get("projects", []),
            resume_data.get("internships", [])
        )


def create_latex_template(name: str, email: str, education: List, skills: List, projects: List, internships: List) -> str:
    """
    Create a professional, ATS-optimized LaTeX resume template
    Designed to achieve 80%+ ATS compatibility with industry standards
    """
    # Escape LaTeX special characters
    def escape_latex(text):
        if not text:
            return ""
        text = str(text)
        special_chars = {'&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', '^': '\\textasciicircum{}', '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '\\': '\\textbackslash{}'}
        for char, replacement in special_chars.items():
            text = text.replace(char, replacement)
        return text
    
    name_escaped = escape_latex(name)
    email_escaped = escape_latex(email)
    
    # Build ATS-optimized LaTeX document
    # Using simple formatting for maximum ATS compatibility
    latex = "\\documentclass[11pt,a4paper]{article}\n"
    latex += "\\usepackage[utf8]{inputenc}\n"
    latex += "\\usepackage[T1]{fontenc}\n"
    latex += "\\usepackage{geometry}\n"
    latex += "\\geometry{margin=0.75in}\n"
    latex += "\\usepackage{enumitem}\n"
    latex += "\\usepackage{xcolor}\n"
    latex += "\\usepackage{fontawesome5}\n"
    latex += "\\usepackage{hyperref}\n\n"
    latex += "% ATS Optimization: Simple formatting, standard sections, no complex tables\n"
    latex += "\\hypersetup{\n"
    latex += "    colorlinks=true,\n"
    latex += "    linkcolor=blue,\n"
    latex += "    urlcolor=blue,\n"
    latex += "    pdfkeywords={resume,cv,software engineer,developer},\n"
    latex += "    pdfsubject={Resume},\n"
    latex += "    pdfauthor={" + name_escaped + "}\n"
    latex += "}\n\n"
    latex += "\\pagestyle{empty}\n\n"
    latex += "\\begin{document}\n\n"
    latex += "% Header Section - ATS-friendly format\n"
    latex += "\\begin{center}\n"
    latex += "{\\huge \\textbf{" + name_escaped + "}}\n"
    latex += "\\\\\n"
    latex += "\\vspace{0.1cm}\n"
    if email_escaped:
        latex += "{\\faEnvelope} " + email_escaped + "\n"
    latex += "\\end{center}\n\n"
    latex += "\\vspace{0.3cm}\n"
    latex += "\\hrule\n"
    latex += "\\vspace{0.3cm}\n\n"
    
    if education:
        latex += "\\section*{Education}\n"
        latex += "\\begin{itemize}[leftmargin=*]\n"
        for edu in education:
            degree = escape_latex(edu.get("degree", ""))
            institution = escape_latex(edu.get("institution", ""))
            year = escape_latex(edu.get("year", ""))
            cgpa = edu.get("cgpa", "")
            
            edu_line = "\\item \\textbf{" + degree + "}"
            if institution:
                edu_line += " - " + escape_latex(institution)
            if year:
                edu_line += " (" + year + ")"
            if cgpa:
                edu_line += " | CGPA: " + str(cgpa)
            edu_line += "\n"
            latex += edu_line
        latex += "\\end{itemize}\n\n"
    
    if skills:
        latex += "\\section*{Skills}\n"
        latex += "\\begin{itemize}[leftmargin=*]\n"
        for skill in skills:
            skill_escaped = escape_latex(skill)
            latex += f"\\item {skill_escaped}\n"
        latex += "\\end{itemize}\n\n"
    
    if projects:
        latex += "\\section*{Projects}\n"
        latex += "\\begin{itemize}[leftmargin=*]\n"
        for proj in projects:
            title = escape_latex(proj.get("title", ""))
            desc = escape_latex(proj.get("description", ""))
            tech = proj.get("technologies", [])
            duration = escape_latex(proj.get("duration", ""))
            
            latex += "\\item \\textbf{" + title + "}"
            if tech:
                tech_str = ', '.join([escape_latex(t) for t in tech])
                latex += " (" + tech_str + ")"
            if duration:
                latex += " [" + duration + "]"
            latex += "\n"
            if desc:
                latex += "  \\begin{itemize}\n"
                latex += f"    \\item {desc}\n"
                latex += "  \\end{itemize}\n"
        latex += "\\end{itemize}\n\n"
    
    if internships:
        latex += "\\section*{Internships}\n"
        latex += "\\begin{itemize}[leftmargin=*]\n"
        for intern in internships:
            role = escape_latex(intern.get("role", ""))
            company = escape_latex(intern.get("company", ""))
            duration = escape_latex(intern.get("duration", ""))
            desc = escape_latex(intern.get("description", ""))
            
            latex += "\\item \\textbf{" + role + "} at " + company
            if duration:
                latex += " (" + duration + ")"
            latex += "\n"
            if desc:
                latex += "  \\begin{itemize}\n"
                latex += f"    \\item {desc}\n"
                latex += "  \\end{itemize}\n"
        latex += "\\end{itemize}\n\n"
    
    latex += "\\end{document}\n"
    return latex


def modify_resume_with_prompt(resume_data: Dict, user_prompt: str) -> Dict:
    """
    Modify resume based on user prompt using LLM
    Returns modified resume data
    """
    try:
        system_prompt = """You are an expert resume writer. Modify the resume based on user instructions.
        Return the modified resume data in the same JSON structure.
        Only modify what the user asks for, keep everything else unchanged.
        Ensure the modifications improve ATS compatibility and professional quality."""
        
        prompt = f"""Current Resume Data:
{json.dumps(resume_data, indent=2)}

User Request:
{user_prompt}

Modify the resume according to the user's request. Return the complete modified resume data as valid JSON.
Maintain the same structure: education (array), skills (array), projects (array), internships (array).
Only change what the user requested, keep other sections unchanged."""
        
        response = generate_with_llm(prompt, system_prompt, max_tokens=2000)
        
        # Try to parse JSON from response
        try:
            # Extract JSON from response if it's wrapped in markdown or text
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                modified_data = json.loads(json_match.group())
                # Validate structure
                if all(key in modified_data for key in ['education', 'skills', 'projects', 'internships']):
                    return modified_data
        except:
            pass
        
        # If parsing failed, return original with note
        return {
            **resume_data,
            "_modification_note": "LLM response could not be parsed. Please try a more specific prompt."
        }
    except Exception as e:
        print(f"Error modifying resume with prompt: {e}")
        return resume_data
