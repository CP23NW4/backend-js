// Step 1: Generate Verification Token
const crypto = require('crypto')
const User = require('../models/User')

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
  const mailOptions = {
    from: ' "mnwhomefinder no-reply" <mnwhomefinder@gmail.com>',
    to: email,
    subject: 'Verify your email address',
    html: `
    <div style=" text-align: center;">
    <img src="https://mnwanimals.blob.core.windows.net/users/logo3.png" alt="Logo" style="max-width: 100px; max-height: 100px; margin-top: 20px;"><br>
    <p>MEOW & WOOF <br><span style="font-size: 12px;">HOME FINDER</span> </p>
    <b style="font-size: 40px; margin: 0"> Verify <span style="color: orange;">your email </b><hr style="width:50%;color:gray;">
    <p><center>Please verify your email to secure your account.</center></p>
    <div style="width: 200px; height: 50px; background-color: orange; border: 1px solid orange; border-radius: 20px; line-height: 50px; margin: auto;">
      <b href="http://localhost:8090/api/users/verify/${verificationToken}" style="text-decoration: none; color: black; display: inline-block; width: 100%; height: 100%;">
      VERIFY NOW
      </b>
    </div>
    <p><center>Or paste the link into your browser: http://localhost:8090/api/users/verify/${verificationToken} </center></p><hr style="width:50%;color:gray;">
    <p><center>This link will expire in 24 hours.</center></p>
    <p><center>If this wasn't you, please <u href="#" style="color: orange;">Click here.</u></center></p>
    </div>
  `,
  }

  await transporter.sendMail(mailOptions)
}

// Step 3: Verify User Endpoint
// This should be added to your userController.js

// async function verifyUser(req, res) {
//   console.log('param:', req.params)
//   console.log('body:', req.body)
//   try {
//     // const {
//     //   userPicture, name, idCard, username, email, password, phoneNumber, DOB, role, userAddress, } = req.body


//     const { token } = req.params

//     const user = await User.findOne({ verificationToken: token })
//     console.log('user:', user)

//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: 'User not found or already verified' })
//     }

//      // If user is found, update the user with registration data
//      if (user.registrationData) {
//       Object.assign(user, user.registrationData);
//       user.registrationData = undefined; // Remove registration data after adding to user
//       await user.save();
//     }

//     // Clear verification token
//     user.verificationToken = undefined;
//     await user.save();


//     //  // If the user is already verified, return a message indicating that
//     //  if (user.verified) {
//     //   return res.status(400).json({ message: 'User already verified' });
//     // }

//     // // Mark the user as verified
//     // user.verified = true
//     // user.verificationToken = undefined

//   //  // Update user with additional registration data
//   //  user.name = req.body.name;
//   //  user.username = req.body.username;
//   //  user.password = req.body.password;
//   //  user.phoneNumber = req.body.phoneNumber;
//   //  user.userPicture = req.body.userPicture || null;
//   //  user.idCard = req.body.idCard || null;
//   //  user.DOB = req.body.DOB || null;
//   //  user.role = 'general'; // Default role
//   //  user.userAddress = req.body.userAddress || null;

    
//   //   await user.save()

//     // res.status(200).json({ message: 'Email verified successfully' })
//     res.status(200).json({ message: 'User email verified successfully!', user });
//     // Here you can confirm the registration or perform any other action
//     // For now, let's log a message
//     console.log(`User ${user.email} confirmed registration.`);
//   } catch (error) {
//     res.status(500).json({ message: error.message })
//   }
// }

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  // verifyUser,
}
