// Step 1: Generate Verification Token
const crypto = require('crypto')

function generateVerificationToken() {
  return crypto.randomBytes(20).toString('hex')
}

// Step 2: Send Verification Email
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  // configure email service
  service: 'gmail',
  auth: {
    user: 'adornyourday.bkk@gmail.com',
    pass: 'gs,up;cvofN;^a'
  }
})

async function sendVerificationEmail(email, verificationToken) {
  const mailOptions = {
    from: 'adornyourday.bkk@gmail.com',
    to: email,
    subject: 'Verify your email address',
    text: `Please click on the following link to verify your email address: http://20.2.70.130/users/verify/${verificationToken}`,
    // You can also send an HTML email with a formatted link
  }

  await transporter.sendMail(mailOptions)
}

// Step 3: Verify User Endpoint
// This should be added to your userController.js

async function verifyUser(req, res) {
  try {
    const { token } = req.params

    const user = await User.findOne({ verificationToken: token })

    if (!user) {
      return res
        .status(404)
        .json({ message: 'User not found or already verified' })
    }

    // Mark the user as verified
    user.verified = true
    user.verificationToken = undefined
    await user.save()

    res.status(200).json({ message: 'Email verified successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// // Step 4: Update registerUser function to include verification token generation and email sending

// async function registerUser(req, res) {
//   try {
//     // your existing code...

//     // Generate verification token
//     const verificationToken = generateVerificationToken()

//     // Create a new user object with required fields
//     const newUser = new User({
//       // your existing user object...
//       verificationToken,
//     })

//     await newUser.save()

//     // Send verification email
//     await sendVerificationEmail(newUser.email, verificationToken)

//     res
//       .status(201)
//       .json({
//         message: 'User created successfully! Please verify your email address.',
//       })
//   } catch (error) {
//     res.status(500).json({ message: error.message })
//   }
// }

module.exports = {
    generateVerificationToken,
    sendVerificationEmail,
    verifyUser,
  };
