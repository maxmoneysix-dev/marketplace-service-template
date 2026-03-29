#!/usr/bin/env python3
"""Deploy SERP Scraper to Render using API"""

import requests
import json

API_KEY = "rnd_iYCZh8wHpPmFwYePBxyREtQhrWrw"
OWNER_ID = "tea-d74bbc5m5p6s73f4i000"
BASE_URL = "https://api.render.com/v1"

headers = {
    "Accept": "application/json",
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def create_api_server():
    """Create Node.js API server"""
    print("Creating serp-api-server...")
    
    # For Node.js, envSpecificDetails needs buildCommand and startCommand
    payload = {
        "type": "web_service",
        "name": "serp-api-server",
        "ownerId": OWNER_ID,
        "repo": "https://github.com/maxmoneysix-dev/serp-scraper",
        "branch": "main",
        "serviceDetails": {
            "buildCommand": "npm install",
            "startCommand": "npm start",
            "plan": "starter",
            "region": "oregon",
            "env": "node",
            "envSpecificDetails": {
                "buildCommand": "npm install",
                "startCommand": "npm start"
            }
        }
    }
    
    resp = requests.post(f"{BASE_URL}/services", headers=headers, json=payload)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 201:
        data = resp.json()
        print(f"Created: {data.get('service', {}).get('name')}")
        return data.get('service', {}).get('id')
    else:
        print(f"Error: {resp.text[:200]}")
        return None

def create_ai_engine():
    """Create Python AI engine"""
    print("\nCreating serp-ai-engine...")
    
    payload = {
        "type": "web_service",
        "name": "serp-ai-engine",
        "ownerId": OWNER_ID,
        "repo": "https://github.com/maxmoneysix-dev/serp-scraper",
        "branch": "main",
        "serviceDetails": {
            "buildCommand": "pip install -r requirements.txt",
            "startCommand": "uvicorn api.main:app --host 0.0.0.0 --port 10000",
            "plan": "starter",
            "region": "oregon",
            "env": "python",
            "envSpecificDetails": {
                "buildCommand": "pip install -r requirements.txt",
                "startCommand": "uvicorn api.main:app --host 0.0.0.0 --port 10000"
            }
        }
    }
    
    resp = requests.post(f"{BASE_URL}/services", headers=headers, json=payload)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 201:
        data = resp.json()
        print(f"Created: {data.get('service', {}).get('name')}")
        return data.get('service', {}).get('id')
    else:
        print(f"Error: {resp.text[:200]}")
        return None

def list_services():
    """List all services"""
    print("\nListing existing services...")
    resp = requests.get(f"{BASE_URL}/services?limit=20", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        api_id = None
        ai_id = None
        for item in data:
            svc = item.get('service', {})
            name = svc.get('name')
            sid = svc.get('id')
            print(f"  - {name}: {sid}")
            if name == 'serp-api-server':
                api_id = sid
            elif name == 'serp-ai-engine':
                ai_id = sid
        return api_id, ai_id
    return None, None

def add_env_var(service_id, key, value):
    """Add environment variable to service"""
    payload = {"key": key, "value": value}
    resp = requests.post(
        f"{BASE_URL}/services/{service_id}/env-vars",
        headers=headers,
        json=payload
    )
    if resp.status_code == 201:
        print(f"   Set: {key}")
        return True
    else:
        print(f"   Error {key}: {resp.text[:100]}")
        return False

def deploy_service(service_id):
    """Trigger deploy for service"""
    print(f"\nDeploying service {service_id[:8]}...")
    resp = requests.post(
        f"{BASE_URL}/services/{service_id}/deploys",
        headers={"Accept": "application/json", "Authorization": f"Bearer {API_KEY}"}
    )
    if resp.status_code == 201:
        print("Deploy triggered!")
        return True
    else:
        print(f"Deploy error: {resp.text[:100]}")
        return False

def main():
    print("=" * 50)
    print("DEPLOYING SERP SCRAPER TO RENDER")
    print("=" * 50)
    
    # Try to create services
    api_id = create_api_server()
    ai_id = create_ai_engine()
    
    # If creation failed, check for existing services
    if not api_id or not ai_id:
        print("\nChecking for existing services...")
        existing_api, existing_ai = list_services()
        if not api_id and existing_api:
            api_id = existing_api
            print(f"Using existing API server: {api_id[:8]}")
        if not ai_id and existing_ai:
            ai_id = existing_ai
            print(f"Using existing AI engine: {ai_id[:8]}")
    
    if not api_id and not ai_id:
        print("\nERROR: Could not create or find services!")
        print("Trying alternative deploy via GitHub webhook...")
        return
    
    # Add env vars and deploy
    if api_id:
        print("\nConfiguring serp-api-server...")
        add_env_var(api_id, "NODE_ENV", "production")
        add_env_var(api_id, "PORT", "10000")
        add_env_var(api_id, "AI_ENGINE_URL", "https://serp-ai-engine.onrender.com")
        add_env_var(api_id, "MOONSHOT_API_KEY", "sk-H5M5pLgSe5w0IqmSxxuxJ98s7quLrAgdouv85hyAMzJaD1vx")
        add_env_var(api_id, "PROXIES_SX_API_KEY", "free_trial")
        add_env_var(api_id, "X402_PRIVATE_KEY", "6wJg9tyKFbzjiM5kU0TD7wOIB80/bfxEgyp9dNyzKSsAf8/Vpenpg1MHx0QQC8ZnCkpZ+8p/SGv13hbNXKflOQ==")
        add_env_var(api_id, "X402_RECEIVER_ADDRESS", "12x3AzDYV6WUYjPuv7mh3a73WSZQZazSoJCzJqayw632")
        deploy_service(api_id)
    
    if ai_id:
        print("\nConfiguring serp-ai-engine...")
        add_env_var(ai_id, "PYTHONUNBUFFERED", "1")
        add_env_var(ai_id, "PORT", "10000")
        add_env_var(ai_id, "MOONSHOT_API_KEY", "sk-H5M5pLgSe5w0IqmSxxuxJ98s7quLrAgdouv85hyAMzJaD1vx")
        add_env_var(ai_id, "PROXIES_SX_API_KEY", "free_trial")
        deploy_service(ai_id)
    
    print("\n" + "=" * 50)
    print("DONE!")
    print("=" * 50)
    print("\nURLs (may take 5-10 mins to be live):")
    print("  API Server: https://serp-api-server.onrender.com")
    print("  AI Engine:  https://serp-ai-engine.onrender.com")
    print("\nCheck: https://dashboard.render.com")

if __name__ == "__main__":
    main()
