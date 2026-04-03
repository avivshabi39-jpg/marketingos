# הגדרת n8n לאוטומציות WhatsApp

מדריך מפורט להתקנה ולהגדרת n8n עם MarketingOS לאוטומציות WhatsApp, מעקב לידים, ודוחות אוטומטיים.

---

## 1. התקנת n8n עם Docker

הרץ את הפקודה הבאה כדי להפעיל n8n עם שמירת נתונים מקומית:

```bash
docker run -d \
  --name n8n \
  --restart unless-stopped \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=changeme123 \
  -e WEBHOOK_URL=http://localhost:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

> **הערה**: החלף את `changeme123` בסיסמה חזקה. בסביבת פרודקשן, החלף `localhost` בכתובת הדומיין שלך.

---

## 2. פתיחת n8n

1. פתח דפדפן וגלוש לכתובת: `http://localhost:5678`
2. התחבר עם: שם משתמש `admin` וסיסמה שהגדרת
3. בפעם הראשונה תתבקש ליצור חשבון בעל – מלא את הפרטים ולחץ **Get Started**

---

## 3. הגדרת Credentials ל-WhatsApp (WhatsApp Business API)

לפני יצירת workflows, הגדר את החיבור ל-WhatsApp:

1. לחץ על **Credentials** בתפריט השמאלי
2. לחץ **Add Credential** → חפש **WhatsApp Business Cloud**
3. מלא:
   - **Access Token**: טוקן ה-API מ-Meta for Developers
   - **Phone Number ID**: מזהה מספר הטלפון מ-Meta
4. לחץ **Save**

---

## 4. Workflow: ליד חדש → WhatsApp

Workflow זה שולח הודעת WhatsApp אוטומטית לכל ליד חדש שנכנס דרך MarketingOS.

### שלב א': יצירת ה-Workflow

1. לחץ **New Workflow** → שמו: `ליד חדש - WhatsApp`
2. הוסף את הצמתים הבאים לפי הסדר:

### Node 1: Webhook (Trigger)

- **Node type**: `Webhook`
- **HTTP Method**: `POST`
- **Path**: `new-lead`
- **Authentication**: None (נאמת דרך MarketingOS)
- לאחר שמירה, העתק את **Webhook URL** (דוגמה: `http://localhost:5678/webhook/new-lead`)

### Node 2: IF (סינון לפי מקור)

- **Node type**: `IF`
- **Condition**: `{{ $json.source }}` equals `facebook` OR `google`
- ענף `true`: שלח WhatsApp
- ענף `false`: עצור (לידים ידניים לא מקבלים הודעה אוטומטית)

### Node 3: WhatsApp (שליחת הודעה)

- **Node type**: `WhatsApp Business Cloud`
- **Credential**: בחר את ה-credential שיצרת
- **Resource**: Message
- **Operation**: Send
- **To**: `{{ $json.phone }}`
- **Message Type**: Text
- **Text**:
  ```
  שלום {{ $json.firstName }}!
  תודה שפנית אלינו. אחד מנציגינו יחזור אליך בהקדם.
  ```

### שלב ב': חיבור ל-MarketingOS

1. בממשק MarketingOS, לך ל-**הגדרות לקוח** → **Webhooks**
2. הכנס את ה-Webhook URL מ-n8n
3. בחר אירוע: **ליד חדש**
4. לחץ **שמור**

---

## 5. Workflow: תזכורת מעקב (Follow-up Reminder)

Workflow זה שולח תזכורת WhatsApp ל-leads שלא קיבלו מענה תוך 24 שעות.

### Node 1: Schedule Trigger

- **Node type**: `Schedule Trigger`
- **Interval**: Every Day
- **Time**: `09:00`

### Node 2: HTTP Request (שליפת לידים פתוחים)

- **Node type**: `HTTP Request`
- **Method**: `GET`
- **URL**: `{{ $env.MARKETINGOS_URL }}/api/leads?status=NEW&olderThan=24h`
- **Headers**:
  - `Authorization`: `Bearer {{ $env.MARKETINGOS_API_KEY }}`

### Node 3: Split In Batches

- **Node type**: `Split In Batches`
- **Batch Size**: 10

### Node 4: IF (בדיקת מספר טלפון)

- **Condition**: `{{ $json.phone }}` is not empty

### Node 5: WhatsApp (תזכורת)

- **To**: `{{ $json.phone }}`
- **Text**:
  ```
  שלום {{ $json.firstName }},
  שמנו לב שטרם נוצר קשר לגבי פנייתך.
  האם נוכל לעזור לך?
  ```

### Node 6: HTTP Request (עדכון סטטוס)

- **Method**: `PATCH`
- **URL**: `{{ $env.MARKETINGOS_URL }}/api/leads/{{ $json.id }}`
- **Body**: `{ "notes": "תזכורת follow-up נשלחה ב-n8n" }`

---

## 6. Workflow: דוח שבועי אוטומטי

Workflow זה מפעיל את מחולל הדוחות של MarketingOS כל יום ראשון בבוקר.

### Node 1: Schedule Trigger

- **Node type**: `Schedule Trigger`
- **Interval**: Every Week
- **Day**: Monday (יום ראשון)
- **Time**: `07:00`

### Node 2: HTTP Request (הפעלת cron)

- **Node type**: `HTTP Request`
- **Method**: `POST`
- **URL**: `https://your-domain.com/api/cron/reports`
- **Headers**:
  - `Authorization`: `Bearer {{ $env.CRON_SECRET }}`
- **Body**: `{}`

### Node 3: IF (בדיקת הצלחה)

- **Condition**: `{{ $json.ok }}` equals `true`

### Node 4: Slack / Email (התראה על הצלחה) — אופציונלי

- שלח הודעה לערוץ Slack או למייל שהדוח נשלח בהצלחה

---

## 7. Workflow: עדכון סטטוס ליד מ-WhatsApp

Workflow זה מקשיב לתגובות נכנסות ב-WhatsApp ומעדכן את סטטוס הליד ב-MarketingOS.

### Node 1: Webhook (Incoming WhatsApp)

- **Path**: `whatsapp-incoming`
- הגדר ב-Meta Webhooks URL: `http://your-domain.com/webhook/whatsapp-incoming`

### Node 2: Switch (לפי תוכן ההודעה)

- **Value**: `{{ $json.body.entry[0].changes[0].value.messages[0].text.body.toLowerCase() }}`
- **Case 1**: מכיל `מעוניין` → עדכן סטטוס `QUALIFIED`
- **Case 2**: מכיל `לא מעוניין` → עדכן סטטוס `LOST`
- **Default**: log בלבד

### Node 3: HTTP Request (עדכון ב-MarketingOS)

- **Method**: `PATCH`
- **URL**: `https://your-domain.com/api/leads/lookup?phone={{ $json.body.entry[0].changes[0].value.messages[0].from }}`
- **Body**: `{ "status": "{{ $node['Switch'].json.newStatus }}" }`

---

## 8. חיבור ל-MarketingOS — הגדרות סביבה ב-n8n

הוסף את משתני הסביבה הבאים ל-n8n:

1. לחץ על שם המשתמש בפינה הימנית העליונה → **Settings**
2. עבור ל-**Environment Variables**
3. הוסף:

| שם המשתנה | ערך לדוגמה |
|---|---|
| `MARKETINGOS_URL` | `https://your-domain.com` |
| `MARKETINGOS_API_KEY` | `your_api_key` |
| `CRON_SECRET` | `same_as_env_local` |

---

## 9. בדיקה

### בדיקת Webhook ליד חדש:

```bash
curl -X POST http://localhost:5678/webhook/new-lead \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "ישראל",
    "lastName": "ישראלי",
    "phone": "972501234567",
    "email": "test@example.com",
    "source": "facebook",
    "clientId": "test-client-id"
  }'
```

### בדיקת cron דוח שבועי:

```bash
curl -X POST https://your-domain.com/api/cron/reports \
  -H "Authorization: Bearer your_cron_secret"
```

### בדיקת Workflow מ-n8n:

1. פתח את ה-Workflow הרצוי
2. לחץ **Test Workflow**
3. שלח נתוני דוגמה דרך Webhook
4. בדוק שכל הצמתים ירוקים ב-execution

---

## 10. הגדרת פרודקשן (Deployment)

### Docker Compose (מומלץ):

```yaml
version: "3.8"
services:
  n8n:
    image: n8nio/n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=strong_password_here
      - WEBHOOK_URL=https://n8n.your-domain.com
      - N8N_PROTOCOL=https
      - N8N_HOST=n8n.your-domain.com
      - N8N_PORT=5678
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

### הגדרת Nginx reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name n8n.your-domain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## סיכום

| Workflow | Trigger | פעולה |
|---|---|---|
| ליד חדש | Webhook מ-MarketingOS | שליחת WhatsApp ברכה |
| תזכורת מעקב | כל יום ב-09:00 | WhatsApp ל-leads ישנים |
| דוח שבועי | כל ראשון ב-07:00 | POST ל-`/api/cron/reports` |
| תגובת WhatsApp | Webhook נכנס | עדכון סטטוס ב-MarketingOS |
