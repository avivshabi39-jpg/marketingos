# Workflow: Broadcast

## Trigger
Webhook — POST /webhook/broadcast
Authentication: Basic Auth

## Payload
```json
{
  "broadcastId": "string",
  "clientId": "string",
  "message": "string",
  "totalLeads": 42,
  "phones": ["0501234567", "0527654321"],
  "createdAt": "ISO string"
}
```

- `phones` — array of Israeli phone numbers (05XXXXXXXX)
- `message` — Hebrew text, max 4096 chars

## Nodes
1. **Webhook** — POST /webhook/broadcast (Basic Auth)
2. **Split In Batches** — iterate over `phones` array, batch size 1
3. **IF** — phone is not empty AND length >= 10
4. **(true)** Wait — random 2-5s delay (anti-spam)
5. **HTTP Request** — Green API send WhatsApp
   - URL: `https://api.green-api.com/waInstance{{instanceId}}/sendMessage/{{apiKey}}`
   - Body: `{"chatId":"{{phone}}@c.us","message":"{{message}}"}`
6. **(false)** No-op — skip invalid phone

## Notes
- Random delay in step 4 is critical to avoid WhatsApp bans
- Green API rate limit: ~60 messages/minute
- For 100+ leads, consider splitting into multiple runs

## Setup
1. Import workflow into n8n
2. Set webhook path: `broadcast`
3. Enable Basic Auth (Railway env credentials)
4. Set Green API instanceId + apiKey
5. Activate workflow
