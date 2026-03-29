#!/bin/bash
# Deploy to Render using API

API_KEY="rnd_iYCZh8wHpPmFwYePBxyREtQhrWrw"
OWNER_ID="tea-d74bbc5m5p6s73f4i000"

echo "🚀 Creating services on Render..."

# Create API Server (Node.js)
echo "Creating serp-api-server..."
curl -s -X POST "https://api.render.com/v1/services" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"web_service\",
    \"name\": \"serp-api-server\",
    \"ownerId\": \"$OWNER_ID\",
    \"repo\": \"https://github.com/maxmoneysix-dev/serp-scraper\",
    \"branch\": \"main\",
    \"serviceDetails\": {
      \"buildCommand\": \"npm install\",
      \"startCommand\": \"npm start\",
      \"plan\": \"starter\",
      \"region\": \"oregon\",
      \"env\": \"node\",
      \"envSpecificDetails\": {
        \"runtime\": \"node\"
      }
    }
  }" | jq .

# Create AI Engine (Python)
echo "Creating serp-ai-engine..."
curl -s -X POST "https://api.render.com/v1/services" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"web_service\",
    \"name\": \"serp-ai-engine\",
    \"ownerId\": \"$OWNER_ID\",
    \"repo\": \"https://github.com/maxmoneysix-dev/serp-scraper\",
    \"branch\": \"main\",
    \"serviceDetails\": {
      \"buildCommand\": \"pip install -r requirements.txt\",
      \"startCommand\": \"uvicorn api.main:app --host 0.0.0.0 --port 10000\",
      \"plan\": \"starter\",
      \"region\": \"oregon\",
      \"env\": \"python\",
      \"envSpecificDetails\": {
        \"runtime\": \"python3\",
        \"buildCommand\": \"pip install -r requirements.txt\",
        \"startCommand\": \"uvicorn api.main:app --host 0.0.0.0 --port 10000\"
      }
    }
  }" | jq .

# Create Redis
echo "Creating serp-redis..."
curl -s -X POST "https://api.render.com/v1/services" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"redis\",
    \"name\": \"serp-redis\",
    \"ownerId\": \"$OWNER_ID\",
    \"serviceDetails\": {
      \"plan\": \"starter\",
      \"region\": \"oregon\"
    }
  }" | jq .

echo "✅ Services created! Check https://dashboard.render.com"
