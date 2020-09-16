const mongoose = require('mongoose')
const { secretJwt, env, dbName } = require('../config')
const jwt = require('jsonwebtoken')
const moment = require('moment')
mongoose.connect(`mongodb://localhost:27017/${dbName}`, { 
  useNewUrlParser: true,
  useUnifiedTopology: true
})
mongoose.set('useFindAndModify', false);
require('../models/Chat')
require('../models/ChatUser')
const Chat = mongoose.model('chat')
const ChatUser = mongoose.model('chatUser')
const buildChat = require('./buildChat')
const namespaces = buildChat(Chat)

function updateUsersInRoom(io, namespace, room){
  // Send back the number of users in this room to ALL sockets connected to this room
  io.of(namespace.endpoint).in(room).clients((error, clients)=>{
      io.of(namespace.endpoint).in(room).emit('updateMembers', clients.length)
  })
}

function isValid(token) {
  let res = false
  if (token) {
    try {
      res = jwt.verify(token, secretJwt)
      return !!res
    } catch (error) {
      return false
    }
  }
}

async function getUser(token) {
  let res = false
  if (token) {
    try {
      res = await ChatUser.findOne({ token })
      return res
    } catch (error) {
      return res
    }
  }
}

module.exports = (server) => {
  let io
  if (env === 'production') {
    io = require('socket.io')(server)
  } else {
    io = require('socket.io')(server, {
      handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
      }
    });
    io.origins('*:*')
  }
  io.use((socket, next) => {
    const token = (socket.handshake.headers['authorization'] || '').split(' ')[1]
    if (token) {
      // TODO maybe we can only fetch user by token
      if (isValid(token)) {
        if (!socket.token) socket.token = token
        next()
      } else {
        return next(new Error('authentication error'));
      }
    }
  })

  io.sockets.on('connection', async function(socket) {
    const user = await getUser(socket.token)
    if (!user) {
      socket.emit('errorAuth', {error: 'auth problem'})
      return
    }
    const data = {
      username: user.username,
      avatar: user.avatar,
      nsList: namespaces.filter(ns => user.namespaces.includes(ns.nsTitle)).map(ns => ({id:ns.id, img: ns.img, endpoint: ns.endpoint}))
    }
    socket.emit('userData', data)
  });

  namespaces.forEach(namespace => {
    io.of(namespace.endpoint).on('connection', (nsSocket) => {
      nsSocket.emit('nsRoomLoad', namespace.rooms)

      nsSocket.on('joinRoom', async (roomToJoin, numUserCb) => {
        const roomToLeave = Object.keys(nsSocket.rooms)[1]
        if (roomToLeave) nsSocket.leave(roomToLeave)
        updateUsersInRoom(io, namespace, roomToLeave)
        nsSocket.join(roomToJoin)
        const nsRoom = namespace.rooms.find(room => {
          return room.roomTitle === roomToJoin;
        })
        if (roomToJoin) {
          nsSocket.emit('getHistory', await nsRoom.getHistory())
        }
        updateUsersInRoom(io, namespace, roomToJoin);
      })

      nsSocket.on('newMessageToServer', async (msg) => {
        const fullMsg = {
          date: moment().unix(),
          username: msg.username || 'test',
          namespace: this.namespace,
          room: this.roomTitle,
          text: msg.text,
          avatar: msg.avatar
        }
        const roomTitle = Object.keys(nsSocket.rooms)[1];
        const nsRoom = namespace.rooms.find(room => {
          return room.roomTitle === roomTitle;
        })
        if (nsRoom) {
          await nsRoom.addMessage(fullMsg);
        }
        io.of(namespace.endpoint).to(roomTitle).emit('messageToClients',fullMsg)
      })
    })
  })  
}