const { google } = require('googleapis')
const authenticate = require('./authenticate')
const gmail = google.gmail('v1')
const nodemailer = require('nodemailer')
const Mailgen = require('mailgen')
require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
})

const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'Your App Name',
    link: 'https://yourapp.com',
  },
})

// Function to send an email using nodemailer
async function sendEmail(to, subject, body) {
  const mail = {
    from: 'suryansh3v@gmail.com',
    to: to,
    subject: subject,
    html: body,
  }

  try {
    await transporter.sendMail(mail)
    console.log('Email sent')
  } catch (error) {
    console.error('Error sending email:', error)
  }
}

// Function to process emails
async function processEmails() {
  try {
    // Check for new emails
    const response = await gmail.users.messages.list({
      auth: authenticate.oAuth2Client,
      userId: 'me',
    })

    const emails = response.data.messages || []
    for (const email of emails) {
      const emailId = email.id
      const emailDetails = await gmail.users.messages.get({
        auth: authenticate.oAuth2Client,
        userId: 'me',
        id: emailId,
      })

      const from = emailDetails.data.payload.headers.find(
        (header) => header.name === 'From'
      ).value

      const emailSubject = emailDetails.data.payload.headers.find(
        (header) => header.name === 'Subject'
      ).value

      // Check if the email has been replied to before
      const labels = emailDetails.data.labelIds

      if (!labels.includes('Label_2') && !labels.includes('SENT')) {
        // If the email has not been replied to, send a reply
        const mail = mailGenerator.generate({
          body: {
            intro: 'Thank you for your email. We have received your message.',
          },
        })

        // Send the email reply
        await sendEmail(from, `Re: ${emailSubject}`, mail)

        // Add the 'SENT' label to indicate that a reply has been sent
        await gmail.users.messages.modify({
          auth: authenticate.oAuth2Client,
          userId: 'me',
          id: emailId,
          resource: {
            addLabelIds: ['Label_2'],
          },
        })
      }
    }
  } catch (error) {
    console.error('Error processing emails:', error)
  }
}

// Function to start processing emails at random intervals
function startProcessing() {
  // Start processing emails in random intervals (45 to 120 seconds)
  setInterval(async () => {
    await processEmails()
  }, Math.floor(Math.random() * (120000 - 45000 + 1)) + 45000)
}

module.exports = {
  startProcessing,
}
