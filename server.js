const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001; // You can choose any port

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- File Upload Configuration (using Multer) ---
// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Store files in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        // Use a timestamp to make filenames unique
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// --- API Routes ---

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Email Automation API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get API Information
app.get('/api', (req, res) => {
    res.status(200).json({
        name: 'Email Automation API',
        version: '1.0.0',
        description: 'API for automated email campaigns with file uploads',
        endpoints: {
            'GET /api': 'API information',
            'GET /api/health': 'Health check',
            'POST /api/send-emails': 'Send email campaign',
            'GET /api/uploads': 'List uploaded files',
            'DELETE /api/uploads/:filename': 'Delete uploaded file'
        }
    });
});

// List uploaded files (for debugging/management)
app.get('/api/uploads', (req, res) => {
    try {
        const files = fs.readdirSync(uploadDir);
        const fileDetails = files.map(filename => {
            const filePath = path.join(uploadDir, filename);
            const stats = fs.statSync(filePath);
            return {
                filename,
                size: stats.size,
                uploadedAt: stats.birthtime,
                modifiedAt: stats.mtime
            };
        });
        
        res.status(200).json({
            message: 'Files retrieved successfully',
            count: files.length,
            files: fileDetails
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve files',
            details: error.message
        });
    }
});

// Delete specific uploaded file
app.delete('/api/uploads/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadDir, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'File not found',
                filename: filename
            });
        }
        
        fs.unlinkSync(filePath);
        res.status(200).json({
            message: 'File deleted successfully',
            filename: filename
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to delete file',
            details: error.message
        });
    }
});

// --- Main API Endpoint for Sending Emails ---
app.post('/api/send-emails', upload.fields([{ name: 'contacts_csv', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), (req, res) => {
    
    const { sender_email, gmail_password } = req.body;
    
    // --- Enhanced Validation ---
    if (!sender_email || !gmail_password) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            required: ['sender_email', 'gmail_password'],
            received: { sender_email: !!sender_email, gmail_password: !!gmail_password }
        });
    }
    
    if (!req.files || !req.files['contacts_csv'] || !req.files['resume']) {
        return res.status(400).json({ 
            error: 'Missing required files',
            required: ['contacts_csv', 'resume'],
            received: {
                contacts_csv: !!(req.files && req.files['contacts_csv']),
                resume: !!(req.files && req.files['resume'])
            }
        });
    }
    
    const csvFile = req.files['contacts_csv'][0];
    const resumeFile = req.files['resume'][0];
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sender_email)) {
        return res.status(400).json({ 
            error: 'Invalid email format',
            field: 'sender_email'
        });
    }
    
    // Validate file types
    if (!csvFile.originalname.toLowerCase().endsWith('.csv')) {
        return res.status(400).json({ 
            error: 'Invalid file type for contacts file',
            expected: 'CSV file (.csv)',
            received: csvFile.originalname
        });
    }

    // --- Execute the Python Script ---
    const pythonScriptPath = path.join(__dirname, 'scripts', 'send_email.py');
    const pythonProcess = spawn('python', [
        pythonScriptPath,
        '--sender_email', sender_email,
        '--gmail_password', gmail_password,
        '--csv_file', csvFile.path,
        '--resume_file', resumeFile.path
    ]);

    let scriptOutput = '';
    let scriptError = '';

    // Capture output from the script
    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python Script stdout: ${data}`);
        scriptOutput += data.toString();
    });

    // Capture errors from the script
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Script stderr: ${data}`);
        scriptError += data.toString();
    });

    // Handle script completion
    pythonProcess.on('close', (code) => {
        console.log(`Python script exited with code ${code}`);

        // --- Cleanup: Delete the uploaded files after use ---
        try {
            if (fs.existsSync(csvFile.path)) {
                fs.unlinkSync(csvFile.path);
            }
            if (fs.existsSync(resumeFile.path)) {
                fs.unlinkSync(resumeFile.path);
            }
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError.message);
        }

        if (code === 0) {
            res.status(200).json({ 
                success: true,
                message: 'Email campaign finished successfully!',
                output: scriptOutput,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ 
                success: false,
                error: 'Failed to execute email script',
                details: scriptError || scriptOutput,
                exitCode: code,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Handle Python process errors
    pythonProcess.on('error', (error) => {
        console.error('Python process error:', error);
        
        // Cleanup files
        try {
            if (fs.existsSync(csvFile.path)) {
                fs.unlinkSync(csvFile.path);
            }
            if (fs.existsSync(resumeFile.path)) {
                fs.unlinkSync(resumeFile.path);
            }
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError.message);
        }
        
        res.status(500).json({
            success: false,
            error: 'Python script execution failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    });
});

// --- Error Handling Middleware ---

// 404 Handler - Must be after all routes
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /api',
            'GET /api/health',
            'POST /api/send-emails',
            'GET /api/uploads',
            'DELETE /api/uploads/:filename'
        ]
    });
});

// Global Error Handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    // Multer errors
    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            error: 'File upload error',
            details: error.message,
            code: error.code
        });
    }
    
    // General errors
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
    console.log(`📖 API Documentation available at: http://localhost:${port}/api`);
    console.log(`💚 Health check available at: http://localhost:${port}/api/health`);
});