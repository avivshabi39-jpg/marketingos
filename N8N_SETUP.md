# n8n Setup Guide

## Option 1: n8n Cloud (Easiest)
1. Go to: n8n.io/cloud
2. Start free trial
3. Copy your instance URL

## Option 2: Railway (Self-hosted)
1. Go to: railway.app
2. New Project → Deploy from template → "n8n"
3. Add env vars:
   - N8N_BASIC_AUTH_ACTIVE=true
   - N8N_BASIC_AUTH_USER=admin
   - N8N_BASIC_AUTH_PASSWORD=your-password
4. Copy the Railway URL

## Connect to MarketingOS
Add to Vercel env vars:
- N8N_WEBHOOK_URL=https://your-n8n-instance.com
- N8N_API_KEY=optional-api-key

## Building Workflows

### New Lead → WhatsApp
1. Trigger: Webhook (URL from portal automations page)
2. Action: HTTP Request → Green API
3. Body: {"chatId": "{{phone}}@c.us", "message": "..."}

### Lead → Google Sheets
1. Trigger: Webhook
2. Action: Google Sheets → Append Row
3. Map: name, phone, email, source

### Weekly Report → WhatsApp
1. Trigger: Schedule (Monday 8:00)
2. Action: HTTP Request → MarketingOS API
3. Process data → Send WhatsApp

## Free Tier Limits
- n8n Cloud: 5 workflows, 2500 executions/month
- Railway: Unlimited (self-hosted) ~$5/month
