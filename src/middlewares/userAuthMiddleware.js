// authMiddleware.js

const jwt = require('jsonwebtoken');

require('dotenv').config({ path: '../.env' });
const secretKey = process.env.SECRET_KEY; // Accessing the secret key from the environment variable}


function authenticateToken(req, res, next) {
    const token = req.header('Authorization');
  
    if (!token) {
      return res.status(401).json({ message: 'Access denied, token is required' });
    }
  
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }
      req.userId = decoded.userId;
      next();
    });
  }
  
  module.exports = {
    authenticateToken,
  };