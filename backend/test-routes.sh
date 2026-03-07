#!/bin/bash
BASE_URL="http://localhost:3001"

echo "=========================================="
echo " 1. PUBLIC ROUTES "
echo "=========================================="
echo ""
echo "Health Check:"
curl -s -X GET "$BASE_URL/" | jq

echo -e "\nNational Trends:"
curl -s -X GET "$BASE_URL/alerts/national" | jq

echo -e "\n=========================================="
echo " 2. REPORTS (As Institution)"
echo "=========================================="
echo ""
echo "Submit Sentinel Report:"
curl -s -X POST "$BASE_URL/reports" \
  -H "Content-Type: application/json" \
  -H "X-Mock-Role: institution" \
  -H "X-Mock-OrgId: test-hospital-1" \
  -d '{
    "patientCount": 5,
    "originLocation": {
        "lat": 6.5244,
        "lng": 3.3792,
        "address": "Lagos Mainland"
    },
    "symptomMatrix": ["Fever", "Cough", "Fatigue"],
    "severity": 8,
    "notes": "Cluster of unknown respiratory distress"
  }' | jq

echo -e "\nGet Facility Feed:"
curl -s -X GET "$BASE_URL/reports/feed" \
  -H "X-Mock-Role: institution" \
  -H "X-Mock-OrgId: test-hospital-1" | jq

echo -e "\nGet Medical Analytics:"
curl -s -X GET "$BASE_URL/reports/analytics" \
  -H "X-Mock-Role: institution" \
  -H "X-Mock-OrgId: test-hospital-1" | jq


echo -e "\n=========================================="
echo " 3. ALERTS (As PHO & Civilian)"
echo "=========================================="
echo ""
echo "Get Civilian Local Alerts:"
curl -s -X GET "$BASE_URL/alerts/local?lat=6.5244&lng=3.3792" \
  -H "X-Mock-Role: civilian" | jq

echo -e "\nGet PHO Inbox:"
curl -s -X GET "$BASE_URL/alerts/inbox" \
  -H "X-Mock-Role: pho" \
  -H "X-Mock-OrgId: zone-1" | jq

echo -e "\nClaim Alert (Mock UUID):"
curl -s -X POST "$BASE_URL/alerts/11111111-1111-1111-1111-111111111111/claim" \
  -H "X-Mock-Role: pho" | jq

echo -e "\nPromote Alert Status:"
curl -s -X PATCH "$BASE_URL/alerts/11111111-1111-1111-1111-111111111111/status" \
  -H "Content-Type: application/json" \
  -H "X-Mock-Role: pho" \
  -d '{"status": "confirmed"}' | jq

echo -e "\nBroadcast Alerts:"
curl -s -X POST "$BASE_URL/alerts/broadcast" \
  -H "X-Mock-Role: pho" | jq


echo -e "\n=========================================="
echo " 4. ADMIN & EOC COMMAND (As EOC)"
echo "=========================================="
echo ""
echo "Approve Facility:"
curl -s -X PATCH "$BASE_URL/admin/facilities/test-hospital-1/status" \
  -H "Content-Type: application/json" \
  -H "X-Mock-Role: eoc" \
  -d '{"status": "approved"}' | jq

echo -e "\nAppoint PHO:"
curl -s -X POST "$BASE_URL/admin/phos" \
  -H "Content-Type: application/json" \
  -H "X-Mock-Role: eoc" \
  -d '{"userId": "new-pho-user-id", "zoneId": "zone-2"}' | jq

echo -e "\nManage Protocols:"
curl -s -X POST "$BASE_URL/admin/protocols" \
  -H "Content-Type: application/json" \
  -H "X-Mock-Role: eoc" \
  -d '{
    "diseaseId": "mock-disease-1",
    "title": "Standard Operating Procedure",
    "content": "Isolate and monitor symptoms"
  }' | jq
