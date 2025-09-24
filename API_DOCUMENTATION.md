# Email Automation API Documentation

## Overview
A RESTful API for automated email campaigns with file upload capabilities. Built with Express.js and supports CSV contact lists and resume attachments.

## Base URL
```
http://localhost:3001
```

## API Endpoints

### 1. API Information
**GET** `/api`

Get basic information about the API and available endpoints.

**Response:**
```json
{
  "name": "Email Automation API",
  "version": "1.0.0",
  "description": "API for automated email campaigns with file uploads",
  "endpoints": { ... }
}
```

### 2. Health Check
**GET** `/api/health`

Check if the API is running and responsive.

**Response:**
```json
{
  "status": "OK",
  "message": "Email Automation API is running",
  "timestamp": "2025-09-25T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 3. Send Email Campaign
**POST** `/api/send-emails`

Send personalized emails to contacts from a CSV file with resume attachment.

**Content-Type:** `multipart/form-data`

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sender_email` | string | Yes | Valid Gmail address |
| `gmail_password` | string | Yes | Gmail app password |
| `contacts_csv` | file | Yes | CSV file with contacts (must have .csv extension) |
| `resume` | file | Yes | Resume file to attach |

**CSV Format:**
```csv
name,email,company
John Doe,john@example.com,Tech Corp
Jane Smith,jane@startup.com,StartupXYZ
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email campaign finished successfully!",
  "output": "Python script output...",
  "timestamp": "2025-09-25T10:30:00.000Z"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error description",
  "details": "Detailed error message",
  "timestamp": "2025-09-25T10:30:00.000Z"
}
```

### 4. List Uploaded Files
**GET** `/api/uploads`

Get list of currently uploaded files (for debugging/management).

**Response:**
```json
{
  "message": "Files retrieved successfully",
  "count": 2,
  "files": [
    {
      "filename": "1729845600000-contacts.csv",
      "size": 1024,
      "uploadedAt": "2025-09-25T10:00:00.000Z",
      "modifiedAt": "2025-09-25T10:00:00.000Z"
    }
  ]
}
```

### 5. Delete Uploaded File
**DELETE** `/api/uploads/:filename`

Delete a specific uploaded file.

**Parameters:**
- `filename` (path parameter): Name of the file to delete

**Success Response (200):**
```json
{
  "message": "File deleted successfully",
  "filename": "1729845600000-contacts.csv"
}
```

**Error Response (404):**
```json
{
  "error": "File not found",
  "filename": "nonexistent.csv"
}
```

## Error Handling

### Common Error Codes
- `400` - Bad Request (validation errors, missing fields)
- `404` - Not Found (endpoint or file not found)
- `500` - Internal Server Error (server or Python script errors)

### Error Response Format
All errors follow this structure:
```json
{
  "error": "Error type",
  "details": "Detailed description",
  "timestamp": "2025-09-25T10:30:00.000Z"
}
```

## File Upload Specifications

### Supported File Types
- **CSV Files:** `.csv` extension required for contact lists
- **Resume Files:** Any file type accepted

### File Size Limits
- Default limit: No specific limit set (uses Express.js defaults)
- Files are temporarily stored and cleaned up after processing

### File Naming
Uploaded files are automatically renamed with timestamp prefix:
```
{timestamp}-{original_filename}
```

## Usage Examples

### Using cURL

#### Health Check
```bash
curl -X GET http://localhost:3001/api/health
```

#### Send Email Campaign
```bash
curl -X POST http://localhost:3001/api/send-emails \
  -F "sender_email=your-email@gmail.com" \
  -F "gmail_password=your-app-password" \
  -F "contacts_csv=@path/to/contacts.csv" \
  -F "resume=@path/to/resume.pdf"
```

#### List Files
```bash
curl -X GET http://localhost:3001/api/uploads
```

#### Delete File
```bash
curl -X DELETE http://localhost:3001/api/uploads/1729845600000-contacts.csv
```

### Using JavaScript Fetch

```javascript
// Send email campaign
const formData = new FormData();
formData.append('sender_email', 'your-email@gmail.com');
formData.append('gmail_password', 'your-app-password');
formData.append('contacts_csv', csvFile); // File object
formData.append('resume', resumeFile);    // File object

fetch('http://localhost:3001/api/send-emails', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Security Considerations

### Gmail App Passwords
- Use Gmail App Passwords instead of regular passwords
- Enable 2-factor authentication on Gmail account
- Generate app-specific password in Google Account settings

### File Security
- Files are temporarily stored and automatically cleaned up
- Validate file types and contents before processing
- Consider implementing file size limits for production use

### CORS
- CORS is enabled for all origins (consider restricting in production)
- Suitable for development and testing

## Starting the Server

1. Install dependencies:
```bash
npm install express multer cors form-data
```

2. Start the server:
```bash
node server.js
```

3. Server will start on `http://localhost:3001`

## Dependencies

- **express**: Web framework
- **multer**: File upload handling
- **cors**: Cross-origin resource sharing
- **child_process**: Python script execution
- **fs**: File system operations
- **path**: File path utilities

## Python Script Integration

The API executes a Python script (`scripts/send_email.py`) with the following arguments:
```bash
python send_email.py --sender_email EMAIL --gmail_password PASSWORD --csv_file PATH --resume_file PATH
```

Ensure the Python script is properly implemented and has the required dependencies installed.