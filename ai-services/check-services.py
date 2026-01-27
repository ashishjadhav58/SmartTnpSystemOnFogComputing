#!/usr/bin/env python3
"""
Quick script to check if all AI services are running
"""

import urllib.request
import urllib.error
import json
import sys

SERVICES = {
    "Resume AI Service": "http://localhost:8001/health",
    "Placement Prediction Service": "http://localhost:8002/health",
    "Skill Match Service": "http://localhost:8003/health"
}

def check_service(name, url):
    """Check if a service is running"""
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=2) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                print(f"[OK] {name}: Running - {data.get('status', 'OK')}")
                return True
            else:
                print(f"[ERROR] {name}: Responded with status {response.status}")
                return False
    except urllib.error.URLError as e:
        if "Connection refused" in str(e) or "No connection" in str(e) or "timed out" in str(e).lower():
            print(f"[NOT RUNNING] {name}: Not running (connection refused or timeout)")
        else:
            print(f"[ERROR] {name}: Connection error - {str(e)}")
        return False
    except Exception as e:
        print(f"[ERROR] {name}: Error - {str(e)}")
        return False

def main():
    print("Checking AI Services Status...")
    print("=" * 50)
    
    all_running = True
    for name, url in SERVICES.items():
        if not check_service(name, url):
            all_running = False
    
    print("=" * 50)
    
    if all_running:
        print("[SUCCESS] All AI services are running!")
        sys.exit(0)
    else:
        print("[WARNING] Some AI services are not running.")
        print("\nTo start services:")
        print("  Windows: run start-all-services.bat")
        print("  Linux/Mac: run start-all-services.sh")
        print("\nNote: The system will use fallback scoring if services are unavailable.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
