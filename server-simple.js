import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { sendEmails } from './emailservice.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - Allow all origins for now
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ 
  dest: './uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "🤖 Welcome to MailBot API",
    description: "Automated email campaign service with personalized messaging",
    version: "1.0.0",
    endpoints: {
      status: "/status",
      sendEmails: "/send-emails"
    },
    github: "https://github.com/theidealshukla/ColdMailBot-api"
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: "Backend running ✅"
  });
});

// Send emails endpoint
app.post('/send-emails', upload.fields([
  { name: 'contactsFile', maxCount: 1 },
  { name: 'resumeFile', maxCount: 1 },
  { name: 'configFile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📧 Email sending request received');
    console.log('Body:', req.body);
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');

    const { email, password } = req.body;
    const { contactsFile, resumeFile, configFile } = req.files || {};

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (!contactsFile || !contactsFile[0]) {
      return res.status(400).json({
        success: false,
        error: 'Contacts CSV file is required'
      });
    }

    if (!configFile || !configFile[0]) {
      return res.status(400).json({
        success: false,
        error: 'Email config MD file is required'
      });
    }

    console.log('📁 Processing files...');
    
    // Call the email service
    const result = await sendEmails(
      email,
      password,
      contactsFile[0].path,
      configFile[0].path,
      resumeFile ? resumeFile[0].path : null
    );

    console.log('✅ Email sending completed:', result);

    res.json({
      success: true,
      message: "Emails processed successfully",
      total: result.total || 0,
      success: result.successful || 0,
      fail: result.failed || 0,
      details: result.results || []
    });

  } catch (error) {
    console.error('❌ Error in send-emails:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send emails'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: ['GET /', 'GET /status', 'POST /send-emails']
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('💥 Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MailBot API running on port ${PORT}`);
  console.log('📡 Endpoints:');
  console.log('  GET  / - Welcome');
  console.log('  GET  /status - Health check'); 
  console.log('  POST /send-emails - Send bulk emails');
});

export default app;