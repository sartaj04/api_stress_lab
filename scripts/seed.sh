#!/bin/bash
# Seed script - creates a test user and sample data

set -e

API_URL="${API_URL:-http://localhost:8000}"
EMAIL="${EMAIL:-test@example.com}"
PASSWORD="${PASSWORD:-testpass123}"

echo "Creating test user..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Signup failed, trying login..."
  RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")
  TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "Token obtained!"
echo ""

echo "Creating sample project..."
PROJECT=$(curl -s -X POST "$API_URL/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "JSONPlaceholder Test", "description": "Load test for JSONPlaceholder API"}')

PROJECT_ID=$(echo $PROJECT | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Created project ID: $PROJECT_ID"

echo "Configuring base URL..."
curl -s -X PATCH "$API_URL/projects/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"base_url": "https://jsonplaceholder.typicode.com"}' > /dev/null

echo "Uploading OpenAPI spec..."
curl -s -X POST "$API_URL/projects/$PROJECT_ID/spec" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@samples/jsonplaceholder.json" > /dev/null

echo "Getting specs..."
SPECS=$(curl -s "$API_URL/projects/$PROJECT_ID/specs" \
  -H "Authorization: Bearer $TOKEN")
SPEC_ID=$(echo $SPECS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo "Generating scenario from spec $SPEC_ID..."
curl -s -X POST "$API_URL/projects/$PROJECT_ID/scenario/generate?spec_id=$SPEC_ID" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

echo ""
echo "====================================="
echo "Setup complete!"
echo "====================================="
echo ""
echo "Login credentials:"
echo "  Email: $EMAIL"
echo "  Password: $PASSWORD"
echo ""
echo "Open http://localhost:3000 and login to start testing!"
