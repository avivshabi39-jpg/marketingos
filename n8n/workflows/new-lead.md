# Workflow: New Lead

## Trigger
Webhook POST -> /webhook/new-lead

## Payload received from MarketingOS
```json
{
  "leadId": "string",
  "clientId": "string",
  "name": "string",
  "phone": "string",
  "source": "string",
  "createdAt": "ISO string"
}
```

## Flow
1. Webhook node receives lead data
2. IF node — check if phone exists
3. WhatsApp node (Green API) — send welcome message
4. Wait 24 hours
5. WhatsApp node — send follow-up message

## Setup in n8n
- Webhook URL: POST https://YOUR_RAILWAY_URL/webhook/new-lead
- Authentication: Basic Auth (user/password from env)
- Workflow name: "MarketingOS — New Lead"
