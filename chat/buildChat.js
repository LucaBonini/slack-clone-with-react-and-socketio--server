const Namespace =  require('./classes/Namespace');
const Room =  require('./classes/Room');



module.exports = (model) => {
  let namespaces = []
  
  let mainNs = new Namespace(0, 'Main', 'https://upload.wikimedia.org/wikipedia/commons/a/af/Tux.png', '/main')
  let wikiNs = new Namespace(0,'Wiki','https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/103px-Wikipedia-logo-v2.svg.png','/wiki');
  mainNs.addRoom(new Room(model, 0, 'General', 'Main'))
  wikiNs.addRoom(new Room(model, 0,'New Articles','Wiki'));
  wikiNs.addRoom(new Room(model, 1,'Editors','Wiki'));
  
  namespaces.push(mainNs, wikiNs)

  return namespaces
}