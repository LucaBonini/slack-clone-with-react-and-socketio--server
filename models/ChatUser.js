const mongoose = require('mongoose')
const { Schema } = mongoose
const { secretCripto } = require('../config')
const Crypto = require('crypto-js/hmac-sha512');

const chatUserSchema = new Schema({
  username: String,
  password: {
    type: String,
    set: value => value ? Crypto(value, secretCripto).toString() : null,
    get: value => value ? Crypto(value, secretCripto).toString() : null
  },
  namespaces: [
    {
      type: String
    }
  ],
  rooms: [
    {
      type: String
    }
  ],
  token: String,
  avatar: String
})

mongoose.model('chatUser', chatUserSchema)