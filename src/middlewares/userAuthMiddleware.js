// authMiddleware.js

const jwt = require('jsonwebtoken');

require('dotenv').config({ path: '../.env' });
const secretKey = process.env.SECRET_KEY; // Accessing the secret key from the environment variable}


// function authenticateToken(req, res, next) {
//     const token = req.header('Authorization');
  
//     if (!token) {
//       return res.status(401).json({ message: 'Access denied, token is required' });
//     }
  
//     jwt.verify(token, secretKey, (err, decoded) => {
//       if (err) {
//         return res.status(403).json({ message: 'Invalid token' });
//       }
//       req.userId = decoded.userId;
//       next();
//     });
//   }

function authenticateUser(req, res, next) {
  // Extract token from request headers
  const token = req.headers.authorization;

  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token not provided' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded; // Attach user information to the request object
    next(); // Proceed to the next middleware
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
}
  
  module.exports = {
    authenticateUser,
  };