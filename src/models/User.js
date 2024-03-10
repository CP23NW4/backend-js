// User.js file defines the Mongoose model for the User schema.
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  userPicture: {
    type: String,
    default: null,
  },
  name: String,
  idCard: String,
  username: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
  },
  password: String,
  phoneNumber: String,
  DOB: Date,
  role: {
    type: String,
    default: 'general',
  },
  userAddress: {
    postCode: Number,
    tambonThaiShort: String,
    districtThaiShort: String,
    provinceThai: String,
    addressLine1: String,  // for number of house, Urban
    addressLine2: String, // for alley, road etc.
  },
  homePicture: {
    type: String,
    default: null,
  },
  verificationToken: String,
  createdOn: {
    type: Date,
    default: Date.now,
  },
  updatedOn: {
    type: Date,
    default: Date.now,
  },
})

// Hash password before saving to the database
userSchema.pre('save', async function (next) {
  const user = this
  if (!user.isModified('password')) return next()

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(user.password, salt)
  user.password = hash
  next()
})

// Custom method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)
module.exports = User
