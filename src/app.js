// The main entry point to initialize the Express app and connect all the pieces together.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const strayAnimalRoutes = require('./routes/strayAnimalRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://mnwadmin:meowandwoof@meowandwoof.gcedq3t.mongodb.net/meowandwoof', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/strayAnimals', strayAnimalRoutes);
app.use('/users', userRoutes); // Use user routes at '/users'

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
