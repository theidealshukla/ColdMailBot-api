import fs from "fs";
import csv from "csv-parser";
import nodemailer from "nodemailer";

// Extract email config from markdown file
function loadConfig(configPath) {
  const content = fs.readFileSync(configPath, "utf-8");

  const subjectMatch = content.match(/## Email Subject Template\s*```([\s\S]*?)```/);
  const bodyMatch = content.match(/## Email Body Template\s*```([\s\S]*?)```/);
  const senderName = content.match(/\*\*Sender Name\*\*: (.+)/)?.[1].trim();
  const delayMatch = content.match(/\*\*Delay Between Emails\*\*: (\d+)/);

  return {
    subjectTemplate: subjectMatch ? subjectMatch[1].trim() : "Internship Application - {company}",
    bodyTemplate: bodyMatch ? bodyMatch[1].trim() : "Dear {hr_name},\n\nI am interested in {company}.",
    senderName: senderName || "Anonymous",
    delay: delayMatch ? parseInt(delayMatch[1]) : 3,
  };
}

// Replace template variables
function personalize(template, vars) {
  return template
    .replace("{hr_name}", vars.hr_name)
    .replace("{company}", vars.company)
    .replace("{sender_name}", vars.sender_name)
    .replace("{sender_email}", vars.sender_email);
}

// Send a single email
async function sendEmail({ smtpConfig, to, subject, body, resumePath }) {
  let transporter = nodemailer.createTransport(smtpConfig);

  let mailOptions = {
    from: `"${smtpConfig.name}" <${smtpConfig.auth.user}>`,
    to,
    subject,
    text: body,
    attachments: resumePath ? [{ path: resumePath }] : [],
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Sent to ${to}`);
}

// Main function
export async function sendEmails({ email, password, smtp_host, smtp_port, configPath, contactsPath, resumePath }) {
  const config = loadConfig(configPath);

  const smtpConfig = {
    host: smtp_host,
    port: smtp_port,
    secure: false,
    auth: { user: email, pass: password },
    name: config.senderName,
  };

  let contacts = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(contactsPath)
      .pipe(csv())
      .on("data", (row) => contacts.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  let success = 0, fail = 0, failedEmails = [];

  for (let i = 0; i < contacts.length; i++) {
    const { name, email: hrEmail, company } = contacts[i];
    try {
      const subject = personalize(config.subjectTemplate, {
        hr_name: name,
        company,
        sender_name: config.senderName,
        sender_email: email,
      });

      const body = personalize(config.bodyTemplate, {
        hr_name: name,
        company,
        sender_name: config.senderName,
        sender_email: email,
      });

      await sendEmail({ smtpConfig, to: hrEmail, subject, body, resumePath });
      success++;
    } catch (err) {
      console.error(`❌ Failed to send to ${contacts[i].email}: ${err.message}`);
      fail++;
      failedEmails.push(contacts[i].email);
    }

    if (i < contacts.length - 1) {
      await new Promise((r) => setTimeout(r, config.delay * 1000));
    }
  }

  return { total: contacts.length, success, fail, failedEmails };
}
