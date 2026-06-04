#!/bin/bash
# Test the support bot API flow
# Run: bash test-support.sh

API="http://localhost:3000/api/support/check-deposit"
API2="http://localhost:3000/api/top-up"

echo "=== TEST 1: Check DB (existing tx) ==="
curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"reference":"MORA8XZ7BVK6"}' | python3 -m json.tool 2>/dev/null

echo ""
echo "=== TEST 2: Check DB (non-existing tx) ==="
curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"reference":"MORAFAKE123"}' | python3 -m json.tool 2>/dev/null

echo ""
echo "=== TEST 3: Check DB with amount ==="
curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"reference":"MORA8XZ7BVK6","amount":50000}' | python3 -m json.tool 2>/dev/null

echo ""
echo "=== TEST 4: Check DB (wrong amount) ==="
curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"reference":"MORA8XZ7BVK6","amount":40000}' | python3 -m json.tool 2>/dev/null

echo ""
echo "=== TEST 5: Get user transactions ==="
curl -s "$API2" \
  -H "Cookie: $(cat /tmp/test-cookie.txt 2>/dev/null)" | python3 -m json.tool 2>/dev/null | head -30

echo ""
echo "=== ALL TESTS DONE ==="
