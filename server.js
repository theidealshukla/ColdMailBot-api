import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { sendEmails } from './emailservice.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// API Key Authentication Middleware
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API key is required. Include it in X-API-Key header or api_key query parameter.'
        });
    }
    
    const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
    
    if (!validApiKeys.includes(apiKey)) {
        return res.status(403).json({
            success: false,
            error: 'Invalid API key. Please check your authentication credentials.'
        });
    }
    
    console.log('✅ API key authenticated successfully');
    next();
};

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 60,
    message: {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Cache-Control']
}));

// Apply rate limiting to all requests
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: `${process.env.MAX_FILE_SIZE_MB || 10}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${process.env.MAX_FILE_SIZE_MB || 10}mb` }));

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024
    }
});

// Utility Functions
function getEmailTemplate(hrName, company) {
    return `Dear ${hrName},

I am writing to express my interest in the internship opportunity at ${company}. As a pre-final year B.Tech Computer Science student at Technocrats Institute of Technology, Bhopal, I have developed a strong foundation in web development and problem-solving, complemented by hands-on experience building real-world projects.

In my academic and project work, I have:

• Built an AI-powered customer support portal with real-time complaint tracking, Google Authentication, and automated RCA/CAPA suggestions, reducing analysis time by 70%.

• Developed a responsive news website using JavaScript and Bootstrap, simulating a headless CMS with dynamic content loading.

• Gained practical experience with JavaScript, React.js, Firebase, Supabase, and Python, alongside deployment tools such as Netlify and Vercel.

I am eager to apply these skills to contribute to ${company}, learn from industry professionals, and further sharpen my technical expertise. My strengths in collaboration, adaptability, and problem-solving make me confident in my ability to add value as an intern.

I would welcome the opportunity to discuss how my skills and projects align with your team's needs. Thank you for considering my application.

Sincerely,
Adarsh Kumar Shukla`;
}

function createTransporter(email, appPassword) {
    return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: email,
            pass: appPassword
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Routes

// Public health check (no API key required)
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        service: 'Email Automation API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            public: ['GET /health', 'GET /api/docs'],
            protected: [
                'POST /api/test-connection',
                'POST /api/parse-csv',
                'POST /api/send-emails',
                'GET /api/send-emails'
            ]
        },
        authentication: 'API Key required for protected endpoints'
    });
});

// API documentation endpoint (no API key required)
app.get('/api/docs', (req, res) => {
    res.json({
        success: true,
        apiDocumentation: {
            name: 'Email Automation API',
            version: '1.0.0',
            description: 'Secure API for automated email sending with Gmail integration',
            authentication: {
                method: 'API Key',
                header: 'X-API-Key',
                alternativeQuery: 'api_key'
            },
            endpoints: [
                {
                    method: 'GET',
                    path: '/health',
                    description: 'Health check endpoint',
                    authentication: 'Not required'
                },
                {
                    method: 'POST',
                    path: '/api/test-connection',
                    description: 'Test Gmail SMTP connection',
                    authentication: 'Required',
                    body: {
                        email: 'Gmail address',
                        appPassword: 'Gmail app password'
                    }
                },
                {
                    method: 'POST',
                    path: '/api/send-emails',
                    description: 'Send bulk emails with real-time progress',
                    authentication: 'Required',
                    body: {
                        gmail_email: 'Gmail address',
                        gmail_password: 'Gmail app password',
                        contacts: 'Array of contact objects with name, email, company'
                    }
                }
            ],
            rateLimit: `${process.env.MAX_REQUESTS_PER_MINUTE || 60} requests per minute`,
            maxEmailsPerRequest: process.env.MAX_EMAILS_PER_REQUEST || 50
        }
    });
});

// Protected Routes (require API key)

// Test Gmail SMTP connection
app.post('/api/test-connection', authenticateApiKey, async (req, res) => {
    console.log('📧 Testing Gmail connection...');
    
    try {
        const { email, appPassword } = req.body;
        
        if (!email || !appPassword) {
            return res.status(400).json({
                success: false,
                error: 'Email and app password are required',
                fields: ['email', 'appPassword']
            });
        }
        
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }
        
        console.log(`Testing connection for: ${email}`);
        
        // Create transporter and verify connection
        const transporter = createTransporter(email, appPassword);
        await transporter.verify();
        
        console.log('✅ Gmail connection successful!');
        
        res.json({
            success: true,
            message: 'Gmail connection successful! Ready to send emails.',
            email: email
        });
        
    } catch (error) {
        console.error('❌ Gmail connection error:', error.message);
        
        let message = 'Connection failed';
        if (error.code === 'EAUTH') {
            message = 'Authentication failed. Please check your Gmail app password.';
        } else if (error.code === 'ENOTFOUND') {
            message = 'Network error. Please check your internet connection.';
        } else {
            message = `Connection failed: ${error.message}`;
        }
        
        res.status(400).json({
            success: false,
            error: message,
            code: error.code
        });
    }
});

// Send emails with Server-Sent Events for real-time progress
app.post('/api/send-emails', authenticateApiKey, async (req, res) => {
    console.log('🚀 Starting email campaign...');
    
    try {
        const { gmail_email, gmail_password, contacts } = req.body;
        
        // Validate required fields
        if (!gmail_email || !gmail_password) {
            return res.status(400).json({
                success: false,
                error: 'Gmail email and app password are required',
                fields: ['gmail_email', 'gmail_password']
            });
        }
        
        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Contacts array is required and must not be empty',
                fields: ['contacts']
            });
        }
        
        // Check email limit
        const maxEmails = parseInt(process.env.MAX_EMAILS_PER_REQUEST) || 50;
        if (contacts.length > maxEmails) {
            return res.status(400).json({
                success: false,
                error: `Maximum ${maxEmails} emails allowed per request. You provided ${contacts.length} contacts.`,
                limit: maxEmails
            });
        }
        
        // Validate contacts format
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            if (!contact.name || !contact.email || !contact.company) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid contact at index ${i}. Each contact must have name, email, and company fields.`,
                    invalidContact: contact
                });
            }
            
            if (!isValidEmail(contact.email)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid email format for contact: ${contact.email}`,
                    invalidContact: contact
                });
            }
        }
        
        console.log(`📧 Sending emails to ${contacts.length} contacts`);
        
        // Test connection first
        const transporter = createTransporter(gmail_email, gmail_password);
        await transporter.verify();
        
        // Set up Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'X-Accel-Buffering': 'no'
        });
        
        let successful = 0;
        let failed = 0;
        const results = [];
        
        // Send initial connection message
        res.write(`data: ${JSON.stringify({
            type: 'connected', 
            message: 'Connected to Email Automation API',
            totalContacts: contacts.length
        })}\n\n`);
        
        // Process each contact
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            
            try {
                console.log(`📤 Sending email ${i + 1}/${contacts.length} to ${contact.name}`);
                
                // Send progress update
                res.write(`data: ${JSON.stringify({
                    type: 'progress',
                    contact: contact.name,
                    email: contact.email,
                    company: contact.company,
                    current: i + 1,
                    total: contacts.length,
                    successful: successful,
                    failed: failed
                })}\n\n`);
                
                // Create email content
                const mailOptions = {
                    from: {
                        name: 'Adarsh Kumar Shukla',
                        address: gmail_email
                    },
                    to: contact.email,
                    subject: `Application for Internship Opportunity at ${contact.company}`,
                    text: getEmailTemplate(contact.name, contact.company),
                    html: getEmailTemplate(contact.name, contact.company).replace(/\n/g, '<br>')
                };
                
                // Send email
                await transporter.sendMail(mailOptions);
                successful++;
                
                results.push({
                    contact: contact.name,
                    email: contact.email,
                    company: contact.company,
                    status: 'success',
                    sentAt: new Date().toISOString()
                });
                
                console.log(`✅ Email sent successfully to ${contact.email}`);
                
            } catch (error) {
                console.error(`❌ Error sending email to ${contact.email}:`, error.message);
                failed++;
                
                results.push({
                    contact: contact.name,
                    email: contact.email,
                    company: contact.company,
                    status: 'failed',
                    error: error.message,
                    failedAt: new Date().toISOString()
                });
                
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    contact: contact.name,
                    email: contact.email,
                    company: contact.company,
                    message: error.message,
                    current: i + 1,
                    total: contacts.length
                })}\n\n`);
            }
            
            // Add delay between emails to avoid rate limiting
            if (i < contacts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.log(`🎉 Campaign completed! Success: ${successful}, Failed: ${failed}`);
        
        // Send completion message
        res.write(`data: ${JSON.stringify({
            type: 'complete',
            successful: successful,
            failed: failed,
            total: contacts.length,
            results: results,
            completedAt: new Date().toISOString()
        })}\n\n`);
        
        res.end();
        
    } catch (error) {
        console.error('❌ Error in send-emails endpoint:', error.message);
        
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: `Error sending emails: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        } else {
            res.write(`data: ${JSON.stringify({
                type: 'fatal_error',
                message: error.message,
                timestamp: new Date().toISOString()
            })}\n\n`);
            res.end();
        }
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Express error:', error.message);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /health',
            'GET /api/docs',
            'POST /api/test-connection (protected)',
            'POST /api/send-emails (protected)'
        ]
    });
});

// Start the server
app.listen(PORT, () => {
    console.log('\n🚀 Email Automation API Starting...');
    console.log('🔐 Secure API with key authentication enabled');
    console.log(`🌐 API running on http://localhost:${PORT}`);
    console.log(`📊 Rate limit: ${process.env.MAX_REQUESTS_PER_MINUTE || 60} requests/minute`);
    console.log(`📧 Max emails per request: ${process.env.MAX_EMAILS_PER_REQUEST || 50}`);
    console.log('\n📋 Available endpoints:');
    console.log('  GET  /health - Health check (public)');
    console.log('  GET  /api/docs - API documentation (public)');
    console.log('  POST /api/test-connection - Test Gmail connection (protected)');
    console.log('  POST /api/send-emails - Send bulk emails (protected)');
    console.log('\n🔑 API Key required for protected endpoints');
    console.log('   Header: X-API-Key: your-api-key');
    console.log('   Query:  ?api_key=your-api-key');
    console.log('\n✅ Server is ready to accept requests!\n');
});

module.exports = app;