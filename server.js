const express = require('express')
const app = express()
const socketServer = require('./chat/socketServer')
app.use(express.static(__dirname + '/public'))

const server = app.listen(3001)

socketServer(server)

