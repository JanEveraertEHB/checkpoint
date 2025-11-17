const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')
const { checkBodyFields } = require("./../helpers/bodyHelpers")

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

// Send contact form message
router.post('/', async (req, res) => {
  if (!req.body) {
    return res.status(400).send({ message: "No body" })
  }

  if (!checkBodyFields(req.body, ["name", "email", "subject", "message"])) {
    return res.status(400).send({ message: "Missing required fields" })
  }

  const { name, email, subject, message } = req.body

  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'jan@tastbaar.studio',
      replyTo: email,
      subject: `[Checkpoint Contact] ${subject} - from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
      html: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<hr>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
      `
    }

    await transporter.sendMail(mailOptions)

    res.status(200).send({ message: "Message sent successfully" })
  } catch (e) {
    console.log('Error sending contact email:', e)
    res.status(500).send({ message: "Failed to send message" })
  }
})

module.exports = router
