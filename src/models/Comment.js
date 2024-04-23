// Comment.js
const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StrayAnimal',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  comment: String,
  createdOn: {
    type: Date,
    default: Date.now,
  },
})


module.exports = mongoose.model('Comment', commentSchema)
