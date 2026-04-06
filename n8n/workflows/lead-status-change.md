# Workflow: Lead Status Change

## Trigger
Webhook — POST /webhook/lead-status-change
Authentication: Basic Auth

## Payload
```json
{
  "leadId": "string",
  "clientId": "string",
  "name": "string",
  "phone": "string",
  "oldStatus": "string",
  "newStatus": "string",
  "updatedAt": "ISO string"
}
```

- `phone` — Israeli format: 05XXXXXXXX
- Status values: NEW, CONTACTED, QUALIFIED, PROPOSAL, WON, LOST

## Nodes
1. **Webhook** — POST /webhook/lead-status-change (Basic Auth)
2. **IF** — phone is not empty AND length >= 10
3. **Switch** — route by newStatus:
   - CONTACTED: "היי {{name}}, דיברנו איתך לאחרונה — אנחנו כאן לכל שאלה 😊"
   - QUALIFIED: "שלום {{name}}, שמחים לשמוע שאתה מתעניין! נחזור אליך בקרוב 🙏"
   - WON: "{{name}}, ברוך הבא למשפחה! 🎉 נשמח לעזור בכל עת"
   - LOST: no message — stop
   - Default: no message — stop
4. **HTTP Request** — Green API send WhatsApp
   - URL: `https://api.green-api.com/waInstance{{instanceId}}/sendMessage/{{apiKey}}`
   - Body: `{"chatId":"{{phone}}@c.us","message":"..."}`
5. **(false branch)** No-op — missing phone

## Setup
1. Import workflow into n8n
2. Set webhook path: `lead-status-change`
3. Enable Basic Auth (same credentials as Railway env)
4. Set Green API instanceId + apiKey
5. Activate workflow
