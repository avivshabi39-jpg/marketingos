#!/bin/bash
# ============================================
# n8n Railway Deploy Checklist
# MarketingOS Automation Engine
# ============================================

echo ""
echo "============================================"
echo "  n8n Railway Deploy Checklist"
echo "  MarketingOS Automation Engine"
echo "============================================"
echo ""
echo "Follow each step and mark as done."
echo ""

STEPS=(
  "Created Railway project at railway.app"
  "Added PostgreSQL database service"
  "Copied PostgreSQL connection details (host, port, db, user, password)"
  "Added n8n service (Docker image: n8nio/n8n:latest)"
  "Set all environment variables (see n8n/.env.railway for template)"
  "Generated N8N_ENCRYPTION_KEY (openssl rand -hex 16)"
  "Set strong N8N_BASIC_AUTH_PASSWORD"
  "Deployed and generated public domain in Railway Settings -> Networking"
  "Set WEBHOOK_URL to the Railway public domain"
  "Redeployed after setting WEBHOOK_URL"
  "Verified /healthz returns 200"
  "Logged into n8n dashboard with basic auth"
  "Added N8N_WEBHOOK_URL to Vercel env vars for MarketingOS"
  "Updated .env.local with N8N_WEBHOOK_URL"
  "Created first test workflow with Webhook trigger"
  "Tested webhook from MarketingOS intake form"
)

echo "Checklist:"
echo "----------"
for i in "${!STEPS[@]}"; do
  NUM=$((i + 1))
  echo "  [ ] $NUM. ${STEPS[$i]}"
done

echo ""
echo "============================================"
echo "  Quick Commands"
echo "============================================"
echo ""
echo "Generate encryption key:"
echo "  openssl rand -hex 16"
echo ""
echo "Generate secure password:"
echo "  openssl rand -base64 24"
echo ""
echo "Test health check:"
echo "  curl https://YOUR_RAILWAY_URL/healthz"
echo ""
echo "Test webhook:"
echo "  curl -X POST https://YOUR_RAILWAY_URL/webhook/test \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"test\": true}'"
echo ""
echo "============================================"
echo "  Files Reference"
echo "============================================"
echo ""
echo "  n8n/railway.toml      — Railway build config"
echo "  n8n/Dockerfile         — Fallback Docker config"
echo "  n8n/.env.railway       — Env vars template"
echo "  n8n/README.md          — Full setup guide"
echo ""
echo "============================================"
