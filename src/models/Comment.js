// Comment.js
const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  post: {
    saId: String,
    saName: String,
  },
  user: {
    userId: String,
    username: String,
  },
  text: String,
  createdOn: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Comment', commentSchema)
