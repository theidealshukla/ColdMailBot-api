# MailBot API

🤖 **Automated Email Campaign Service** - Send personalized job application emails with resume attachments.

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/theidealshukla/ColdMailBot-api.git
cd ColdMailBot-api
npm install

# Start the server
npm start
```

Server runs on: **http://localhost:3001**

## 📡 API Endpoints

### Root Endpoint
```http
GET /
```
Returns API welcome message and available endpoints.

### Health Check
```http
GET /status  
```
Returns backend status.

### Send Emails
```http
POST /send-emails
```
**Form Data Parameters:**
- `email` - Your Gmail address
- `password` - Gmail App Password  
- `smtp_host` - SMTP server (default: smtp.gmail.com)
- `smtp_port` - SMTP port (default: 587)
- `configFile` - Email template config (.md file)
- `contactsFile` - HR contacts (.csv file)
- `resumeFile` - Your resume (any format)

## 📄 File Formats

### Contacts CSV
```csv
name,email,company
John Doe,john@company.com,TechCorp Inc
Jane Smith,jane@startup.com,Innovation Labs
```

### Email Config (Markdown)
```markdown
**Sender Name**: Your Name
**Delay Between Emails**: 3

## Email Subject Template
```
Internship Application - {company}
```

## Email Body Template  
```
Dear {hr_name},

I am interested in opportunities at {company}.

Best regards,
{sender_name}
```

## 🔧 Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Use App Password (not regular password) in API

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Email:** Nodemailer
- **File Upload:** Multer
- **CSV Parsing:** csv-parser

## 📦 Deploy

### Vercel
```bash
npm i -g vercel
vercel
```

### Heroku
```bash
git push heroku main
```

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature-name`
3. Commit: `git commit -am 'Add feature'`
4. Push: `git push origin feature-name`  
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

⭐ **Star this repo if it helped you!**