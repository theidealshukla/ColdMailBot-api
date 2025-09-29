"""
Production-ready Flask backend for Internship Email Automation
Designed for deployment on Render, Railway, Vercel, or similar platforms
"""

import os
import re
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from werkzeug.utils import secure_filename
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Configure CORS for production
CORS(app, origins=[
    "http://localhost:3000",
    "http://localhost:8000", 
    "https://*.github.io",
    "https://*.netlify.app",
    "https://*.vercel.app"
])

# Configuration
UPLOAD_FOLDER = '/tmp'  # Use /tmp for cloud deployments
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def clean_text(text):
    """Clean and normalize text data"""
    if not text:
        return ''
    return text.replace('\xa0', ' ').replace('\u00a0', ' ').replace(r'[^\x20-\x7E]', ' ').strip()

def validate_email(email):
    """Validate email format"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def send_email_via_gmail(sender_email, app_password, recipient_email, subject, body, resume_path=None):
    """Send email via Gmail SMTP"""
    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = subject
        
        # Add body
        msg.attach(MIMEText(body, 'plain'))
        
        # Add resume attachment if provided
        if resume_path and os.path.exists(resume_path):
            with open(resume_path, "rb") as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
                
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {os.path.basename(resume_path)}'
            )
            msg.attach(part)
        
        # Connect to Gmail SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, app_password)
        
        # Send email
        text = msg.as_string()
        server.sendmail(sender_email, recipient_email, text)
        server.quit()
        
        return True, "Email sent successfully"
        
    except Exception as e:
        error_msg = str(e)
        if "Invalid login" in error_msg:
            return False, "Invalid Gmail credentials. Please check your email and app password."
        elif "Authentication failed" in error_msg:
            return False, "Gmail authentication failed. Make sure you're using an App Password, not your regular password."
        else:
            return False, f"Failed to send email: {error_msg}"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for deployment platforms"""
    return jsonify({
        'status': 'healthy',
        'service': 'Internship Email Automation API',
        'version': '1.0.0'
    })

@app.route('/api/test-connection', methods=['POST'])
def test_connection():
    """Test Gmail SMTP connection"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
            
        email = data.get('email')
        app_password = data.get('appPassword')
        
        if not email or not app_password:
            return jsonify({
                'success': False,
                'message': 'Email and App Password are required'
            }), 400
            
        if not email.endswith('@gmail.com'):
            return jsonify({
                'success': False,
                'message': 'Only Gmail addresses are supported'
            }), 400
            
        if len(app_password) != 16:
            return jsonify({
                'success': False,
                'message': 'Gmail App Password must be 16 characters long'
            }), 400
        
        # Test connection
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(email, app_password)
            server.quit()
            
            return jsonify({
                'success': True,
                'message': 'Gmail connection successful!'
            })
            
        except Exception as e:
            error_msg = str(e)
            if "Invalid login" in error_msg or "Authentication failed" in error_msg:
                return jsonify({
                    'success': False,
                    'message': 'Gmail authentication failed. Please check your App Password.'
                }), 401
            else:
                return jsonify({
                    'success': False,
                    'message': f'Connection failed: {error_msg}'
                }), 500
                
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/send-emails', methods=['POST'])
def send_emails():
    """Send bulk emails to contacts"""
    try:
        # Get form data
        gmail_email = request.form.get('gmailEmail')
        gmail_password = request.form.get('gmailPassword')
        email_subject = request.form.get('emailSubject', 'Exploring Internship Opportunities at {company}')
        email_body = request.form.get('emailBody', '')
        
        # Get uploaded files
        contacts_file = request.files.get('contacts')
        resume_file = request.files.get('resume')
        
        # Validation
        if not all([gmail_email, gmail_password, contacts_file, resume_file]):
            return jsonify({
                'success': False,
                'message': 'Missing required data: gmailEmail, gmailPassword, contacts, resume'
            }), 400
            
        if not email_body.strip():
            return jsonify({
                'success': False,
                'message': 'Email body template is required'
            }), 400
        
        # Save uploaded files temporarily
        contacts_filename = secure_filename(contacts_file.filename)
        resume_filename = secure_filename(resume_file.filename)
        
        contacts_path = os.path.join(app.config['UPLOAD_FOLDER'], contacts_filename)
        resume_path = os.path.join(app.config['UPLOAD_FOLDER'], resume_filename)
        
        contacts_file.save(contacts_path)
        resume_file.save(resume_path)
        
        # Parse CSV contacts
        try:
            df = pd.read_csv(contacts_path)
            
            # Map column names flexibly
            column_mapping = {}
            for col in df.columns:
                col_lower = col.lower().strip()
                if 'name' in col_lower or 'hr' in col_lower or 'contact' in col_lower:
                    column_mapping['name'] = col
                elif 'email' in col_lower or 'mail' in col_lower:
                    column_mapping['email'] = col
                elif 'company' in col_lower or 'organization' in col_lower or 'firm' in col_lower:
                    column_mapping['company'] = col
            
            required_fields = ['name', 'email', 'company']
            missing_fields = [field for field in required_fields if field not in column_mapping]
            
            if missing_fields:
                return jsonify({
                    'success': False,
                    'message': f'Missing required columns: {missing_fields}. Found: {list(df.columns)}'
                }), 400
            
            # Extract contacts
            contacts = []
            for _, row in df.iterrows():
                contact = {
                    'name': clean_text(str(row[column_mapping['name']])),
                    'email': clean_text(str(row[column_mapping['email']])),
                    'company': clean_text(str(row[column_mapping['company']]))
                }
                
                # Validate contact data
                if contact['name'] and contact['email'] and contact['company']:
                    if validate_email(contact['email']):
                        contacts.append(contact)
            
            if not contacts:
                return jsonify({
                    'success': False,
                    'message': 'No valid contacts found in CSV file'
                }), 400
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error parsing CSV: {str(e)}'
            }), 400
        
        # Send emails
        results = []
        successful = 0
        
        for contact in contacts:
            try:
                # Generate personalized email content
                sender_name = gmail_email.split('@')[0].replace('.', ' ').title()
                
                subject = email_subject.format(
                    hr_name=contact['name'],
                    company=contact['company'],
                    sender_name=sender_name
                )
                
                body = email_body.format(
                    hr_name=contact['name'],
                    company=contact['company'],
                    sender_name=sender_name
                )
                
                # Send email
                success, message = send_email_via_gmail(
                    gmail_email,
                    gmail_password,
                    contact['email'],
                    subject,
                    body,
                    resume_path
                )
                
                results.append({
                    'contact': contact['name'],
                    'email': contact['email'],
                    'company': contact['company'],
                    'success': success,
                    'message': message
                })
                
                if success:
                    successful += 1
                    # Add delay between emails to avoid rate limiting
                    time.sleep(2)
                
            except Exception as e:
                results.append({
                    'contact': contact['name'],
                    'email': contact['email'],
                    'company': contact['company'],
                    'success': False,
                    'message': f'Error: {str(e)}'
                })
        
        # Cleanup temporary files
        try:
            os.remove(contacts_path)
            os.remove(resume_path)
        except:
            pass
        
        return jsonify({
            'success': True,
            'message': f'Email campaign completed. {successful}/{len(contacts)} emails sent successfully.',
            'results': results,
            'summary': {
                'total': len(contacts),
                'successful': successful,
                'failed': len(contacts) - successful
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({
        'success': False,
        'message': 'File too large. Maximum file size is 16MB.'
    }), 413

@app.errorhandler(500)
def internal_error(e):
    return jsonify({
        'success': False,
        'message': 'Internal server error occurred.'
    }), 500

if __name__ == '__main__':
    # For local development
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)