// userController.js file to handle user authentication.

// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/user');

// const secretKey = 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcwMzQ5MDQ4OSwiaWF0IjoxNzAzNDkwNDg5fQ.AV5L4BbcbQGrjs6f6ZnXDbkAREnJEp0PBiQ8zTzshtM'; // Replace this with a secure random string

// // Get all stray animals
// const getAllUsers = async (req, res) => {
//     try {
//       const allUsers = await Users.find().limit(10);
//       res.json(allUsers);
//     } catch (err) {
//       res.status(500).json({ message: 'Database error' });
//     }
//   };


// const generateToken = (user) => {
//   return jwt.sign({ id: user._id }, secretKey, { expiresIn: '1h' }); // Adjust expiration as needed
// };

// const userLogin = async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const token = generateToken(user);
//     res.status(200).json({ token });
//   } catch (error) {
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// // Implement other authentication functions as needed (e.g., user registration, logout)

// module.exports = { userLogin, getAllUsers };
