// ไฟล์ run: node index.js
// models folder เก็บ db
// routes folder เก็บ crud (ทำ crud แยกไฟล์ปกติ)
// const express = require('express'); <- ต้องใช้ประจำ ทุกไฟล์
// ใน routes.index import file require แล้วก็ต้อง export router ไปที่ file ใหญ่ (add.js)
// model.index ไว้เชื่อม db


// const express = require('express');
// const app = express();
// const cors = require('cors');
// const bodyParser = require('body-parser');
// // const route = require('./routes');    // api
// const port = 8090;
// // const model = require('./models')

// app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // app.use('/', route);
// // Define a route
// app.get('/', (request, response) => {
//   res.send('Hello, Express! you can testå');
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Backend running with port : ${port} !!!`);
// });

// ---------------------------------------------------------
// Example route file
// const express = require('express');
// // const router = express.Router();
// const connectDB = require('./database'); // Import the database connection
// const strayAnimalRoute = require('./routes/strayAnimalRoutes');

// const app = express();
// const port = 8090;
// const route = require('./routes')

// Connect to MongoDB
// connectDB(); // Call the function to establish the database connection

// Include routes
// app.use('/api/strayAnimals', strayAnimalRoute);
// app.use('/', route)


// app.get('/', (request, response) => {
//   res.send('Hello, Express! you can testå');
// });

// Start the server
// const port = process.env.port || 8090
// app.listen(port, () => {
//   console.log(`Backend running with port : http://localhost:${port} !!!`);
// });

// app.listen(port, () => {
//   console.log(`Server is running at http://localhost:${port}`);
// });

// module.exports = router;
// ----------------------------------------
// const express = require('express');
// const mongoose = require('mongoose');

// // Initialize express app
// const app = express();

// // Connect to MongoDB
// mongoose.connect('mongodb+srv://mnwadmin:meowandwoof@meowandwoof.gcedq3t.mongodb.net/', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => {
//     console.log('Connected to MongoDB');
// }).catch((err) => {
//     console.error('Error connecting to MongoDB:', err.message);
// });

// // Other configurations and middleware setup

// // Import and use strayAnimalRoutes
// const strayAnimalRoutes = require('./routes/strayAnimalRoutes');
// app.use('/', strayAnimalRoutes);

// // Start the server
// const PORT = process.env.PORT || 8090;
// app.listen(PORT, () => {
//     console.log(`Server started on port http://localhost:${PORT}`);
// });


// server.js

// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Create Express app
const app = express();
app.use(cors()) // Enable CORS for all routes
app.use(express.json()); // Parse JSON requests

// MongoDB connection
mongoose.connect('mongodb+srv://mnwadmin:meowandwoof@meowandwoof.gcedq3t.mongodb.net/meowandwoof', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Schema for Stray Animal
const strayAnimalSchema = new mongoose.Schema({
  name: String,
  picture: String,
  type: String,
  gender: String,
  color: String,
  description: String,
  ownerId: String,
  createdOn: Date,
  updatedOn: Date,
});

// Create a model based on the schema
const StrayAnimal = mongoose.model('StrayAnimal', strayAnimalSchema, 'strayAnimals');


// Define route to get all stray animals
app.get('/strayAnimals', async (req, res) => {
  try {
    // Fetch all stray animals from MongoDB
    const allStrayAnimals = await StrayAnimal.find();
    res.json(allStrayAnimals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Get animal by ID
app.get('/strayAnimals/:saId', async (req, res) => {
  try {
    const strayAnimalbyId = await StrayAnimal.findById(req.params.saId);
    res.json(strayAnimalbyId);
  } catch (err) {
    res.status(404).json({ message: 'Stray animal not found' });
  }
});


// // POST create a new stray animal
app.post('/strayAnimals', async (req, res) => {
  const newStrayAnimal = new StrayAnimal(req.body); // Use StrayAnimal model
  try {
      const savedStrayAnimal = await newStrayAnimal.save();
      res.status(201).json(savedStrayAnimal);
    } catch (err) {
      res.status(400).json({ message: 'Unable to create a new stray animal' });
    }
  });



// // PUT update a stray animal by ID
app.put('/strayAnimals/:saId', async (req, res) => {
  try {
    const updatedStrayAnimal = await StrayAnimal.findByIdAndUpdate(req.params.saId, req.body, { new: true });
    if (!updatedStrayAnimal) {
      return res.status(404).json({ message: 'Stray animal not found' });
    }
    res.json(updatedStrayAnimal);
  } catch (err) {
    res.status(500).json({ message: 'Error updating stray animal' });
  }
});

// // DELETE a stray animal by ID
app.delete('/strayAnimals/:saId', async (req, res) => {
  try {
    const deletedStrayAnimal = await StrayAnimal.findByIdAndDelete(req.params.saId);

    if (!deletedStrayAnimal) {
      return res.status(404).json({ message: 'Stray animal not found' });
    }

    res.json({ message: 'Stray animal deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting stray animal' });
  }
});


// Start the server
const PORT = process.env.PORT || 8090;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

