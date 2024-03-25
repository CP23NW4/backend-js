// Step 1: Generate Verification Token
const crypto = require('crypto')
require('dotenv').config({ path: '../.env' })

function generateVerificationToken() {
  return crypto.randomBytes(20).toString('hex')
}

// Step 2: Send Verification Email
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  // configure email service
  service: 'gmail',
  auth: {
    user: 'mnwhomefinder@gmail.com',
    pass: 'lyyi xmzm iofk sgrq',
  },
})

async function sendVerificationEmail(email, verificationToken) {
  const baseUrl = process.env.BASE_URL // Accessing base URL from environment variables
  const mailOptions = {
    from: ' "mnwhomefinder no-reply" <mnwhomefinder@gmail.com>',
    to: email,
    subject: 'Verify your email address',
    html: `
    <div style=" text-align: center;">
    <img src="https://mnwanimals.blob.core.windows.net/accessories/logo3.png" alt="Logo" style="max-width: 100px; max-height: 100px; margin-top: 20px;"><br>
    <p style="color: black">MEOW & WOOF <br><span style="font-size: 12px; color: black">HOME FINDER</span> </p>
    <b style="font-size: 40px; margin: 0; color: black"> Verify <span style="color: orange;">your email </b><hr style="width:50%;color:gray;">
    <p style="color: black"><center>Please verify your email to secure your account.</center></p>
    <div style="width: 200px; height: 50px; background-color: orange; border: 1px solid orange; border-radius: 20px; line-height: 50px; margin: auto;">
      <b><a href="${baseUrl}/users/verify/${verificationToken}" style="text-decoration: none; color: black; display: inline-block; width: 100%; height: 100%;">
      VERIFY NOW
      </a></b>
    </div>
  <p><center>Or paste the link into your browser: ${baseUrl}/users/verify/${verificationToken} </center></p><hr style="width:50%;color:gray;">
  <p><center>This link will expire in 24 hours.</center></p>
  <p><center>If this wasn't you, please <u href="#" style="color: orange;">Click here.</u></center></p>
  </div>
  `,
  }

  await transporter.sendMail(mailOptions)
}

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
}
