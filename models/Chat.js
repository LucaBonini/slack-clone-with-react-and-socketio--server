const mongoose = require('mongoose')
const { Schema } = mongoose

const chatSchema = new Schema({
  date: String,
  username: String,
  text: String,
  namespace: String,
  room: String,
  avatar: String
})

mongoose.model('chat', chatSchema)