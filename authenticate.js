const { google } = require('googleapis')
const OAuth2Client = google.auth.OAuth2
require('dotenv').config()

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = 'https://localhost:3000/auth/google/callback'

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

// Function to generate the authorization URL and redirect the user
function getAuthUrl(req, res) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify'],
  })
  res.redirect(authUrl)
}

// Function to handle the OAuth2 callback and exchange the code for tokens
async function authCallback(req, res) {
  try {
    const code = req.query.code
    if (!code) {
      throw new Error('No authorization code provided')
    }

    const { tokens } = await oAuth2Client.getToken(code)
    oAuth2Client.setCredentials(tokens)

    // Create a custom label after successful authentication
    await createCustomLabel(oAuth2Client)

    res.send('Authentication successful!')
  } catch (error) {
    console.error('Error exchanging code for tokens:', error)
    res.status(500).send('Error during authentication')
  }
}

// Function to create a custom label if it doesn't exist
async function createCustomLabel(auth) {
  const gmail = google.gmail({ version: 'v1', auth })
  try {
    // Check if label with name 'Replied' already exists
    const existingLabels = await gmail.users.labels.list({
      userId: 'me',
    })

    const labelExists = existingLabels.data.labels.some(
      (label) => label.name === 'Replied'
    )

    if (!labelExists) {
      // Create the custom label if it doesn't exist
      const label = await gmail.users.labels.create({
        userId: 'me',
        resource: {
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
          name: 'Replied', // The name of the custom label
        },
      })
      console.log('Created label with ID:', label.data.id)
    } else {
      console.log('Label "Replied" already exists.')
    }
  } catch (error) {
    console.error('Error creating label:', error)
  }
}

module.exports = {
  getAuthUrl,
  authCallback,
  oAuth2Client,
}
