import express from "express";
import multer from "multer";
import { sendEmails } from "./emailservice.js";
import cors from "cors";
import fs from "fs";

const app = express();

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({ dest: "uploads/" });

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint - Welcome message
app.get("/", (req, res) => {
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

app.get("/status", (req, res) => {
  res.json({ status: "Backend running ✅" });
});

// Send all emails with user config + contacts
app.post(
  "/send-emails",
  upload.fields([{ name: "configFile" }, { name: "contactsFile" }, { name: "resumeFile" }]),
  async (req, res) => {
    try {
      const { email, password, smtp_host, smtp_port } = req.body;
      const configPath = req.files["configFile"]?.[0]?.path;
      const contactsPath = req.files["contactsFile"]?.[0]?.path;
      const resumePath = req.files["resumeFile"]?.[0]?.path;

      if (!email || !password || !configPath || !contactsPath) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await sendEmails({
        email,
        password,
        smtp_host: smtp_host || "smtp.gmail.com",
        smtp_port: smtp_port || 587,
        configPath,
        contactsPath,
        resumePath,
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

const PORT = process.env.PORT || 3001;

// Add error handling for unhandled errors
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Status endpoint: http://localhost:${PORT}/status`);
  console.log(`📧 Email endpoint: http://localhost:${PORT}/send-emails`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
});
