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

const { body, validationResult } = require('express-validator');

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
    // Fetch all stray animals from MongoDB, ordered by created time in descending order
    const allStrayAnimals = await StrayAnimal.find().sort({ createdOn: -1 });
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

// Validate function for creating a new stray animal
// const validateCreateStrayAnimal = [


// ];

// POST create a new stray animal with validation
app.post('/strayAnimals',
  body('name')
  // .not().isEmpty().withMessage('Name is empty')
  .notEmpty().withMessage('Name is empty')
  .isLength({ min: 1, max: 20 }).withMessage('Name must be 1 to 20 characters')
  .matches(/^[\u0E00-\u0E7F\sA-Za-z0-9]+$/).withMessage('Name can only contain Thai and English letters, numbers, and spaces'),
  
  body('picture')
  .notEmpty().withMessage('Image is empty'),
  
  body('type')
  // .not().isEmpty().withMessage('Type is empty')
  .notEmpty().withMessage('Type is empty')
  .isIn(['Dog', 'Cat']).withMessage('Type must be Dog or Cat')
  .isLength({ max: 5 }).withMessage('Type is more than 5 characters'),
  
  body('gender')
  // .not().isEmpty().withMessage('Gender is empty')
  .notEmpty().withMessage('Gender is empty')
  .isIn(['Male', 'Female']).withMessage('Gender must be Male or Female')
  .isLength({ max: 6 }).withMessage('Gender is more than 6 characters'),
  
  body('color')
  // .not().isEmpty().withMessage('Color is empty')
  .notEmpty().withMessage('Color is empty')
  .matches(/^[\u0E00-\u0E7F\sA-Za-z]+$/).withMessage('Color can only contain Thai and English letters and spaces')
  .custom(value => !/\d/.test(value)).withMessage('Color cannot contain numbers'),
  
  body('description')
  .isLength({ max: 500 }).withMessage('Description is more than 500 characters'),


async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({ errorMessages: error.msg }));
    return res.status(400).json( errorMessages );
  }

  // const newStrayAnimal = new StrayAnimal(req.body);
  const newStrayAnimal = new StrayAnimal({
    ...req.body,
    createdOn: new Date(), // Automatically set the createdOn field to the current date and time
  });

  try {
    const savedStrayAnimal = await newStrayAnimal.save();
    res.status(201).json(savedStrayAnimal);
  } catch (err) {
    res.status(400).json({ message: 'Unable to create a new stray animal' });
  }
});

// PUT update a stray animal by ID
app.put('/strayAnimals/:saId', 
  body('name')
    .optional()
    .isLength({ min: 1, max: 20 }).withMessage('Name must be 1 to 20 characters')
    .matches(/^[\u0E00-\u0E7F\sA-Za-z0-9]+$/).withMessage('Name can only contain Thai and English letters, numbers, and spaces'),
  
  body('picture')
    .optional()
    .notEmpty().withMessage('Image is empty'),
  
  body('type')
    .optional()
    .isIn(['Dog', 'Cat']).withMessage('Type must be Dog or Cat')
    .isLength({ max: 5 }).withMessage('Type is more than 5 characters'),
  
  body('gender')
    .optional()
    .isIn(['Male', 'Female']).withMessage('Gender must be Male or Female')
    .isLength({ max: 6 }).withMessage('Gender is more than 6 characters'),
  
  body('color')
    .optional()
    .matches(/^[\u0E00-\u0E7F\sA-Za-z]+$/).withMessage('Color can only contain Thai and English letters and spaces')
    .custom(value => !/\d/.test(value)).withMessage('Color cannot contain numbers'),
  
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description is more than 500 characters'),

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const specificErrors = {};

      errors.array().forEach(error => {
        if (!specificErrors[error.param]) {
          specificErrors[error.param] = error.msg;
        }
      });

      return res.status(400).json(specificErrors);
    }

    try {
      const existingStrayAnimal = await StrayAnimal.findById(req.params.saId);

      if (!existingStrayAnimal) {
        return res.status(404).json({ message: 'Stray animal not found' });
      }

      const updatedFields = {};
      const currentDate = new Date();

      if (req.body.name) {
        updatedFields.name = req.body.name;
      }
      if (req.body.picture) {
        updatedFields.picture = req.body.picture;
      }
      if (req.body.type) {
        updatedFields.type = req.body.type;
      }
      if (req.body.gender) {
        updatedFields.gender = req.body.gender;
      }
      if (req.body.color) {
        updatedFields.color = req.body.color;
      }
      if (req.body.description) {
        updatedFields.description = req.body.description;
      }

      // If there are fields to update, add/update the 'updatedOn' field
      if (Object.keys(updatedFields).length > 0) {
        updatedFields.updatedOn = currentDate;
      }

      const updatedStrayAnimal = await StrayAnimal.findByIdAndUpdate(
        req.params.saId,
        { $set: updatedFields },
        { new: true }
      );

      res.json(updatedStrayAnimal);
    } catch (err) {
      res.status(500).json({ message: 'Error updating stray animal' });
    }
  }
);

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
  console.log(`Server running on port http://localhost:${PORT}`);
});

