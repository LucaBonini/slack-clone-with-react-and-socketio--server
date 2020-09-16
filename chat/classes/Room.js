const moment = require('moment')
class Room {
  constructor(model, roomId, roomTitle, namespace, privateRoom = false){
      this.model = model
      this.roomId = roomId
      this.roomTitle = roomTitle
      this.namespace = namespace
      this.privateRoom = privateRoom
      this.history = [];
  }
  async addMessage(message){
      await new this.model({
        date: moment().unix(),
        username: message.username || 'test',
        namespace: this.namespace,
        room: this.roomTitle,
        text: message.text,
        avatar: message.avatar
      }).save()
  }

  async getHistory() {
    return (await this.model.find({namespace: this.namespace, room: this.roomTitle}))
  }
  clearHistory(){
      this.history = [];
  }
}

module.exports = Room;