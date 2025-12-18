#!/usr/bin/env bash
set -euo pipefail

# Simple script to create/update a proxy host in Nginx Proxy Manager (Node Proxy Manager)
# Requires: curl, jq

NPM_URL="${NPM_URL:?}"
NPM_USER="${NPM_USER:?}"
NPM_PASS="${NPM_PASS:?}"
DOMAIN="${DOMAIN:?}"
TARGET_HOST="${TARGET_HOST:?}"
TARGET_PORT="${TARGET_PORT:?}"

# Login - create token (API may differ by NPM version; adapt if needed)
TOKEN=$(curl -sS -X POST "$NPM_URL/api/toksen" -H "Content-Type: application/json" -d "{\"username\":\"$NPM_USER\",\"password\":\"$NPM_PASS\"}" | jq -r '.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Failed to get token from NPM"
  exit 1
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

# Find existing proxy host
EXISTING_ID=$(curl -sS -H "$AUTH_HEADER" "$NPM_URL/api/nginx/proxy-hosts" | jq -r --arg domain "$DOMAIN" '.data[]? | select(.domain_names[]? == $domain) | .id' || true)

body=$(jq -n --arg domain "$DOMAIN" --arg fh "$TARGET_HOST" --arg fp "$TARGET_PORT" '{"domain_names":[ $domain ], "forward_host": $fh, "forward_port": ($fp|tonumber), "access_list_id": 0, "meta": {"letsencrypt_agree": true, "http_to_https": true}}')

if [ -n "$EXISTING_ID" ] && [ "$EXISTING_ID" != "null" ]; then
  echo "Updating existing proxy host id=$EXISTING_ID"
  curl -sS -X PUT "$NPM_URL/api/nginx/proxy-hosts/$EXISTING_ID" -H "$AUTH_HEADER" -H "Content-Type: application/json" -d "$body"
else
  echo "Creating new proxy host for $DOMAIN"
  curl -sS -X POST "$NPM_URL/api/nginx/proxy-hosts" -H "$AUTH_HEADER" -H "Content-Type: application/json" -d "$body"
fi

echo "Done."
