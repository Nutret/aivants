require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Helper: build a Nodemailer transporter from user-supplied credentials
function createTransporter(smtpEmail, smtpPassword) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });
}

// POST /api/send-email
// Body: { smtp_email, smtp_password, to, subject, body, from_name? }
app.post("/api/send-email", async (req, res) => {
  const { smtp_email, smtp_password, to, subject, body, from_name } = req.body;

  if (!smtp_email || !smtp_password || !to || !subject || !body) {
    return res.status(400).json({
      error: "Missing required fields: smtp_email, smtp_password, to, subject, body",
    });
  }

  const transporter = createTransporter(smtp_email, smtp_password);

  const mailOptions = {
    from: from_name ? `"${from_name}" <${smtp_email}>` : smtp_email,
    to,
    subject,
    html: body,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} — Message ID: ${info.messageId}`);
    return res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/test-smtp
// Body: { smtp_email, smtp_password }  — validates credentials by sending a test email to yourself
app.post("/api/test-smtp", async (req, res) => {
  const { smtp_email, smtp_password } = req.body;

  if (!smtp_email || !smtp_password) {
    return res.status(400).json({ error: "smtp_email and smtp_password are required" });
  }

  const transporter = createTransporter(smtp_email, smtp_password);

  try {
    await transporter.verify();
    return res.json({ success: true, message: "SMTP credentials verified!" });
  } catch (err) {
    console.error("❌ SMTP verification failed:", err.message);
    return res.status(401).json({ error: `SMTP Error: ${err.message}` });
  }
});

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.EMAIL_SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n📧 Email server (Nodemailer) running on http://localhost:${PORT}`);
  console.log(`   POST /api/send-email  — send an email`);
  console.log(`   POST /api/test-smtp   — verify SMTP credentials`);
  console.log(`   GET  /api/health      — health check\n`);
});
