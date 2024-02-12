// The main entry point to initialize the Express app and connect all the pieces together.
const express = require('express');

const mongoose = require('mongoose');
const cors = require('cors');
const strayAnimalRoutes = require('./routes/strayAnimalRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();
const multer = require('multer');
// const { uploadImage } = require('./controllers/strayAnimalController'); // Import the image upload controller function
require('dotenv').config({ path: '../.env' });

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://mnwadmin:meowandwoof@meowandwoof.gcedq3t.mongodb.net/meowandwoof', {
  useNewUrlParser: true,
  useUnifiedTopology: true,});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


// Routes
// const strayAnimalRoutes = require('./routes/strayAnimalRoutes');
// const userRoutes = require('./routes/userRoutes');

app.use('/strayAnimals', strayAnimalRoutes);
app.use('/users', userRoutes);


// Error handling middleware for authentication issues
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: 'Unauthorized request' });
  } else {
    next(err);
  }
});


const PORT = process.env.PORT || 8090;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
 