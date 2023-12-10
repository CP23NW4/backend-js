// // database.js
// const express = require('express');
// const mongoose = require('mongoose');

// const mongoURI = 'mongodb+srv://mnwadmin:meowandwoof@meowandwoof.gcedq3t.mongodb.net/';

// const connectDB = async () => {
//   try {
//     await mongoose.connect(mongoURI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       // useCreateIndex: true,
//       });
//       console.log('MongoDB Connected')
//   } catch (err) {
//     console.error('Error connecting to MongoDB:', err.message);
//     process.exit(1); // Exit process with failure
//   }
// }
// module.exports = connectDB
