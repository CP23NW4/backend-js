// The main entry point to initialize the Express app and connect all the pieces together.
const express = require('express')

const mongoose = require('mongoose')
const cors = require('cors')
const strayAnimalRoutes = require('./routes/strayAnimalRoutes')
const userRoutes = require('./routes/userRoutes')
const app = express()
const multer = require('multer')
// const { uploadImage } = require('./controllers/strayAnimalController'); // Import the image upload controller function
require('dotenv').config({ path: '../.env' })

app.use(cors())
app.use(express.json())

// MongoDB connection
mongoose.connect(
  'mongodb+srv://mnwadmin:meowandwoof@meowandwoof.gcedq3t.mongodb.net/meowandwoof',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)

// Routes
app.use('/api/strayAnimals', strayAnimalRoutes)
app.use('/api/users', userRoutes) // Use user routes at '/users'

// Error handling middleware for authentication issues
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: 'Unauthorized request' })
  } else {
    next(err)
  }
})

const PORT = process.env.PORT || 8090
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`)
})

app.get('/', async (req, res) => {
  res.send('Hello')
})

app.get('/api/test', async (req, res) => {
  res.send('Hello2')
})
