# Workflow: Appointment Reminder

## Trigger
Webhook — POST /webhook/appointment-reminder
Authentication: Basic Auth

## Payload
```json
{
  "appointmentId": "string",
  "clientId": "string",
  "leadId": "string | null",
  "leadName": "string",
  "leadPhone": "string",
  "scheduledAt": "ISO string",
  "notes": "string",
  "action": "created | updated"
}
```

- `leadPhone` — Israeli format: 05XXXXXXXX
- `scheduledAt` — appointment date/time in UTC

## Nodes
1. **Webhook** — POST /webhook/appointment-reminder (Basic Auth)
2. **IF** — leadPhone not empty AND length >= 10
3. **IF** — scheduledAt is in the future
4. **Code** — calculate reminder times:
   ```javascript
   const scheduled = new Date($json.scheduledAt)
   const now = new Date()
   const day = new Date(scheduled.getTime() - 24*60*60*1000)
   const hour = new Date(scheduled.getTime() - 60*60*1000)
   return [{json: {
     ...$input.item.json,
     reminderDayMs: Math.max(0, day - now),
     reminderHourMs: Math.max(0, hour - now),
     time: scheduled.toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'}),
   }}]
   ```
5. **Wait** — reminderDayMs (24h before)
6. **HTTP Request** — Green API WhatsApp:
   `"היי {{leadName}}, תזכורת לפגישה שלנו מחר ב-{{time}} 📅"`
7. **Wait** — reminderHourMs (1h before)
8. **HTTP Request** — Green API WhatsApp:
   `"היי {{leadName}}, הפגישה שלנו בעוד שעה! נתראה 🙏"`

## Notes
- Workflow executions run for hours/days (waiting for reminders)
- If appointment updated, new run starts (old continues)
- Ensure Railway has enough memory for long-running executions

## Setup
1. Import workflow, set path: `appointment-reminder`
2. Enable Basic Auth (Railway credentials)
3. Set Green API instanceId + apiKey
4. Activate workflow
