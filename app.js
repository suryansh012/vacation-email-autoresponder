const express = require('express')
const https = require('https')
const fs = require('fs').promises // Using promises from fs
const path = require('path')
const authenticate = require('./authenticate')
const gmailProcessor = require('./gmailProcessor')

const app = express()
const PORT = 3000

const SSL_CERT_PATH = path.join(__dirname, 'sslcert', 'cert.pem')
const SSL_KEY_PATH = path.join(__dirname, 'sslcert', 'key.pem')

// A function to read SSL certificate and private key files
const readCertAndKeyFiles = async () => {
  try {
    const cert = await fs.readFile(SSL_CERT_PATH)
    const key = await fs.readFile(SSL_KEY_PATH)
    return { cert, key, passphrase: 'abcd' }
  } catch (error) {
    console.error('Error reading certificate or key file:', error)
    throw error // Propagate the error
  }
}

// An async function to start the app
const startApp = async () => {
  // Set up routes
  app.get('/', (req, res) => {
    res.send('App is running!')
  })

  // OAuth2.0 authentication route
  app.get('/auth/google', authenticate.getAuthUrl)

  // Callback route for OAuth2.0 authentication
  app.get('/auth/google/callback', authenticate.authCallback)

  // Start checking emails and sending replies
  try {
    await gmailProcessor.startProcessing()
  } catch (error) {
    console.error('Error starting email processing:', error)
    throw error // Propagate the error
  }

  // Read SSL certificate and private key files
  const options = await readCertAndKeyFiles()

  // Create an HTTPS server with the SSL certificate and private key
  https.createServer(options, app).listen(PORT, () => {
    console.log(`Server is running on port ${PORT} with HTTPS`)
  })
}

// Start the application
startApp().catch((error) => {
  console.error('Error starting the application:', error)
  process.exit(1) // Exit the process with an error code
})
