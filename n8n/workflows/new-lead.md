# Workflow: New Lead

## Trigger
Webhook — POST /webhook/new-lead
Authentication: Basic Auth

## Payload
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

- `phone` — Israeli format: 05XXXXXXXX
- `source` — "facebook" | "form" | "organic" | "unknown"

## Sources
This webhook fires from two places:
1. **POST /api/leads** — form submissions, manual entry
2. **POST /api/webhooks/facebook** — Facebook Lead Ads

## Nodes
1. **Webhook** — receives POST /webhook/new-lead
2. **IF** — check: phone is not empty AND phone length >= 10
3. **(true)** HTTP Request — Green API send WhatsApp welcome
   - URL: `https://api.green-api.com/waInstance{{instanceId}}/sendMessage/{{apiKey}}`
   - Body: `{"chatId":"{{phone}}@c.us","message":"שלום {{name}}, קיבלנו את פנייתך ונחזור אליך בהקדם 🙏"}`
4. **Wait** — 24 hours
5. **HTTP Request** — Green API follow-up
   - Body: `{"chatId":"{{phone}}@c.us","message":"היי {{name}}, רצינו לבדוק אם יש לך שאלות? 😊"}`
6. **(false)** No-op — log missing phone

## Setup Instructions
1. Import this workflow into n8n
2. Set webhook path to: `new-lead`
3. Enable Basic Auth with credentials from Railway env vars
4. Set Green API instanceId + apiKey in HTTP Request nodes
5. Activate the workflow
