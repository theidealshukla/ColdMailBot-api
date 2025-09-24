# Email Automation API

A powerful RESTful API for automated email campaigns with file upload capabilities. Perfect for sending personalized job applications, newsletters, or any bulk email campaigns with attachments.

## 🚀 Features

- **File Upload Support**: Upload CSV contacts and resume/attachment files
- **Personalized Emails**: Generate personalized email content for each recipient
- **Gmail Integration**: Send emails via Gmail SMTP with App Password support
- **Error Handling**: Comprehensive error handling and validation
- **CORS Enabled**: Ready for frontend integration
- **Clean Logging**: Detailed console logging for monitoring
- **File Cleanup**: Automatic cleanup of uploaded files after processing

## 📋 Prerequisites

- **Node.js** (v14.0.0 or higher)
- **Python** (v3.6 or higher) - for email sending script
- **Gmail Account** with App Password enabled

### Setting up Gmail App Password

1. Enable 2-Factor Authentication on your Gmail account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this app password (not your regular password) in the API

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd email-automation-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file** (optional)
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   ```

The server will run on `http://localhost:3001`

## 📚 API Documentation

### Base URL
```
http://localhost:3001
```

### Endpoints

#### 1. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Email Automation API is running",
  "timestamp": "2025-09-25T10:30:00Z",
  "uptime": "5m 23s"
}
```

#### 2. API Information
```http
GET /api
```

Returns API documentation and available endpoints.

#### 3. Send Email Campaign
```http
POST /api/send-emails
```

**Content-Type:** `multipart/form-data`

**Body Parameters:**
- `sender_email` (string, required): Your Gmail address
- `gmail_password` (string, required): Your Gmail App Password
- `contacts_csv` (file, required): CSV file with contacts (name, email, company columns)
- `resume` (file, required): Resume/attachment file (PDF, DOC, TXT, etc.)

**CSV Format:**
```csv
name,email,company
John Doe,john@example.com,TechCorp Inc
Jane Smith,jane@testcompany.com,Innovation Labs
```

**Success Response (200):**
```json
{
  "message": "Email campaign finished successfully!",
  "output": "Campaign details and results"
}
```

**Error Response (400/500):**
```json
{
  "error": "Error description",
  "details": "Additional error details"
}
```

## 🌐 Frontend Integration Example

### HTML Form
```html
<form id="emailForm" enctype="multipart/form-data">
  <input type="email" name="sender_email" placeholder="Your Gmail" required>
  <input type="password" name="gmail_password" placeholder="Gmail App Password" required>
  <input type="file" name="contacts_csv" accept=".csv" required>
  <input type="file" name="resume" required>
  <button type="submit">Send Emails</button>
</form>
```

### JavaScript
```javascript
document.getElementById('emailForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  
  try {
    const response = await fetch('http://localhost:3001/api/send-emails', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Emails sent successfully!');
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    alert('Network error: ' + error.message);
  }
});
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3001
NODE_ENV=production
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

### Server Configuration
- **Port**: Default 3001 (configurable via environment)
- **File Size Limit**: 10MB per file
- **Supported File Types**: All file types accepted
- **CORS**: Enabled for all origins

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Deploy to Heroku

1. Install Heroku CLI
2. Create app: `heroku create your-app-name`
3. Add Python buildpack: `heroku buildpacks:add heroku/python`
4. Add Node.js buildpack: `heroku buildpacks:add heroku/nodejs`
5. Deploy: `git push heroku main`

### Deploy to Railway

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on git push

### Deploy to Render

1. Connect repository to Render
2. Set build command: `npm install`
3. Set start command: `npm start`

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Manual Testing
1. Start the server: `npm start`
2. Visit: `http://localhost:3001/api`
3. Use the provided test client: `test-client.html`

### Test with cURL
```bash
curl -X POST http://localhost:3001/api/send-emails \
  -F "sender_email=your@gmail.com" \
  -F "gmail_password=your-app-password" \
  -F "contacts_csv=@contacts.csv" \
  -F "resume=@resume.pdf"
```

## 📁 Project Structure

```
email-automation-api/
├── server.js              # Main Express server
├── package.json           # Node.js dependencies
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── .env.example          # Environment variables template
├── scripts/
│   └── send_email.py     # Python email sending script
├── uploads/              # Temporary file uploads (auto-cleanup)
│   └── .gitkeep          # Keep directory in git
└── test-client.html      # Test frontend client
```

## 🔒 Security Considerations

- **Never commit Gmail passwords** - Use environment variables
- **Validate file types** - Implement file type restrictions if needed
- **Rate limiting** - Consider adding rate limiting for production
- **File size limits** - Default 10MB limit configured
- **Input validation** - Email addresses and required fields validated

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Error**
   - Ensure you're using Gmail App Password, not regular password
   - Verify 2FA is enabled on Gmail account

2. **File Upload Error**
   - Check file size (max 10MB)
   - Ensure CSV has correct headers: name, email, company

3. **Python Script Error**
   - Verify Python is installed and in PATH
   - Check that all required files exist

4. **Port Already in Use**
   - Change port in `.env` file or kill existing process

### Debug Mode
Set `NODE_ENV=development` in `.env` for detailed error logging.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with:
   - Error messages
   - Steps to reproduce
   - System information

## 🔗 Related Links

- [Express.js Documentation](https://expressjs.com/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Node.js Deployment Guide](https://nodejs.org/en/docs/guides/getting-started-guide/)

---

Made with ❤️ for automating email campaigns