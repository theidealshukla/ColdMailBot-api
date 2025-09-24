#!/usr/bin/env python3
"""
Email Automation Script for HR Job Applications
Sends personalized emails to HR contacts with resume attachments
"""

import argparse
import csv
import smtplib
import time
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import mimetypes
import sys


def read_hr_contacts(csv_file_path):
    """
    Reads HR contact information from a CSV file.
    Expected CSV format: name, email, company
    """
    contacts = []
    
    try:
        if not os.path.exists(csv_file_path):
            print(f"❌ CSV file not found: {csv_file_path}")
            return contacts
            
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            # Validate CSV headers
            required_fields = ['name', 'email', 'company']
            if not all(field in csv_reader.fieldnames for field in required_fields):
                print(f"❌ CSV file must contain columns: {', '.join(required_fields)}")
                print(f"   Found columns: {', '.join(csv_reader.fieldnames or [])}")
                return contacts
            
            for row_num, row in enumerate(csv_reader, start=2):
                # Skip empty rows
                if not any(row.values()):
                    continue
                    
                # Validate required fields
                missing_fields = [field for field in required_fields if not row.get(field, '').strip()]
                if missing_fields:
                    print(f"⚠️  Skipping row {row_num}: Missing {', '.join(missing_fields)}")
                    continue
                
                contact = {
                    'name': row['name'].strip(),
                    'email': row['email'].strip().lower(),
                    'company': row['company'].strip()
                }
                
                # Basic email validation
                if '@' not in contact['email'] or '.' not in contact['email']:
                    print(f"⚠️  Skipping row {row_num}: Invalid email format '{contact['email']}'")
                    continue
                
                contacts.append(contact)
        
        print(f"✅ Successfully loaded {len(contacts)} HR contacts from CSV")
        return contacts
        
    except Exception as e:
        print(f"❌ Error reading CSV file: {str(e)}")
        return contacts


def generate_personalized_email(hr_name, company):
    """
    Generates a personalized email body for the HR contact.
    """
    try:
        email_template = f"""Dear {hr_name},

I hope this email finds you well. I am writing to express my strong interest in frontend development internship opportunities at {company}.

As a passionate frontend developer with experience in modern web technologies including React, JavaScript, HTML5, and CSS3, I am excited about the possibility of contributing to {company}'s innovative projects while further developing my skills in a professional environment.

Key highlights of my background:
• Proficient in React, JavaScript (ES6+), HTML5, and CSS3
• Experience with responsive design and modern CSS frameworks
• Familiarity with version control (Git) and development tools
• Strong problem-solving skills and attention to detail
• Eager to learn and adapt to new technologies

I have attached my resume for your review, which provides more detailed information about my projects and technical skills. I would greatly appreciate the opportunity to discuss how I can contribute to {company}'s frontend development team.

Thank you for considering my application. I look forward to hearing from you and would be happy to provide any additional information you may need.

Best regards,
[Your Name]
[Your Phone Number]
[Your Email Address]

---
This email was sent as part of my internship application process. I apologize if this is not the appropriate contact for internship inquiries and would appreciate being directed to the correct department if needed.
"""
        return email_template
        
    except Exception as e:
        print(f"❌ Error generating email template: {str(e)}")
        return None


def send_email_via_gmail(sender_email, sender_password, recipient_email, subject, body, attachment_path=None):
    """
    Sends an email via Gmail SMTP with optional attachment.
    """
    try:
        # Create message container
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = subject
        
        # Add body to email
        msg.attach(MIMEText(body, 'plain'))
        
        # Add attachment if provided
        if attachment_path and os.path.exists(attachment_path):
            try:
                # Determine the file type
                content_type, encoding = mimetypes.guess_type(attachment_path)
                if content_type is None or encoding is not None:
                    content_type = 'application/octet-stream'
                
                main_type, sub_type = content_type.split('/', 1)
                
                with open(attachment_path, 'rb') as fp:
                    attachment = MIMEBase(main_type, sub_type)
                    attachment.set_payload(fp.read())
                
                encoders.encode_base64(attachment)
                
                # Add header for attachment
                filename = os.path.basename(attachment_path)
                attachment.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {filename}'
                )
                
                msg.attach(attachment)
                print(f"   📎 Attached file: {filename}")
                
            except Exception as e:
                print(f"   ⚠️  Warning: Could not attach file: {str(e)}")
        
        # Gmail SMTP configuration
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        
        # Create SMTP session
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Enable TLS encryption
        server.login(sender_email, sender_password)
        
        # Send email
        text = msg.as_string()
        server.sendmail(sender_email, recipient_email, text)
        server.quit()
        
        return True
        
    except smtplib.SMTPAuthenticationError:
        print(f"   ❌ Authentication failed. Check your Gmail app password.")
        print(f"   💡 Make sure you're using an App Password, not your regular password.")
        return False
        
    except smtplib.SMTPRecipientsRefused:
        print(f"   ❌ Recipient email address rejected: {recipient_email}")
        return False
        
    except smtplib.SMTPException as e:
        print(f"   ❌ SMTP error: {str(e)}")
        return False
        
    except Exception as e:
        print(f"   ❌ Unexpected error sending email: {str(e)}")
        return False


def main():
    """Main function to send personalized emails to all HR contacts."""
    
    # --- Start of new code ---
    # Setup command-line argument parsing
    parser = argparse.ArgumentParser(description="Send personalized emails to HR contacts.")
    parser.add_argument("--sender_email", required=True, help="Sender's Gmail address.")
    parser.add_argument("--gmail_password", required=True, help="Sender's Gmail App Password.")
    parser.add_argument("--csv_file", required=True, help="Path to the CSV file with HR contacts.")
    parser.add_argument("--resume_file", required=True, help="Path to the resume file.")
    
    args = parser.parse_args()

    # Configuration from arguments
    sender_email = args.sender_email
    gmail_password = args.gmail_password
    csv_file_path = args.csv_file
    resume_path = args.resume_file
    # --- End of new code ---

    # Read HR contacts from CSV
    contacts = read_hr_contacts(csv_file_path)
    if not contacts:
        return False
    
    print(f"\n🚀 Starting email campaign to {len(contacts)} HR contacts")
    print(f"📧 From: {sender_email}")
    print(f"📎 Resume: {resume_path}")
    print("=" * 60)
    
    successful_sends = 0
    failed_sends = 0
    
    # (The rest of your main function's logic remains exactly the same)
    # Process each contact
    for i, contact in enumerate(contacts, 1):
        try:
            hr_name = contact['name']
            hr_email = contact['email']
            company = contact['company']
            
            print(f"\n📩 [{i}/{len(contacts)}] Processing {hr_name} at {company}")
            print(f"   Email: {hr_email}")
            
            # Generate personalized email content
            email_body = generate_personalized_email(hr_name, company)
            if not email_body:
                print(f"   ❌ Failed to generate email content")
                failed_sends += 1
                continue
            
            # Prepare subject
            subject = f"Frontend Internship Application – {company}"
            
            # Send email
            print(f"   📤 Sending email...")
            success = send_email_via_gmail(
                sender_email=sender_email,
                sender_password=gmail_password,
                recipient_email=hr_email,
                subject=subject,
                body=email_body,
                attachment_path=resume_path
            )
            
            if success:
                successful_sends += 1
                print(f"   ✅ Email sent successfully!")
            else:
                failed_sends += 1
                print(f"   ❌ Email sending failed!")
            
            # Add delay between emails to avoid rate limiting
            if i < len(contacts):  # Don't wait after the last email
                print(f"   ⏳ Waiting 3 seconds before next email...")
                time.sleep(3)
                
        except Exception as e:
            print(f"   ❌ Error processing {contact.get('name', 'Unknown')}: {str(e)}")
            failed_sends += 1
            continue
    
    # Final summary
    print("\n" + "=" * 60)
    print(f"📊 EMAIL CAMPAIGN SUMMARY:")
    print(f"   ✅ Successful: {successful_sends}")
    print(f"   ❌ Failed: {failed_sends}")
    print(f"   📧 Total: {len(contacts)}")
    
    if successful_sends > 0:
        print(f"\n🎉 Successfully sent {successful_sends} personalized emails!")
        print("📱 Check your Gmail Sent folder to confirm delivery.")
    
    if failed_sends > 0:
        print(f"\n⚠️  {failed_sends} emails failed to send.")
        print("💡 Check your internet connection and Gmail app password.")
    
    return successful_sends > 0

if __name__ == "__main__":
    main()