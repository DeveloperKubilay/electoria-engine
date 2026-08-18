const settings = require('./settings');
const io = require("socket.io")(settings.PORT);
const kubitdb = require("kubitdb")
const db = new kubitdb(settings.DB_PATH);
const jwt = require('jsonwebtoken');
const fs = require('fs');
const c = require('ansi-colors');
const readline = require('readline');
const util = require('util');

process.stdout.write('\u001b[2J\u001b[0;0H');
process.title = "Electoria Engine Server"
const prompt = c.yellow('Admin> ');
const modules = []
var socketusers = []

if(!db.has("users")) db.set("users",[])
fs.readdirSync('./modules/clientmodules').forEach(file=> modules.push(fs.readFileSync(`./modules/clientmodules/${file}`, 'utf8')))
fs.readdirSync('./modules/servermodules/onload').forEach(file=> require(`./modules/servermodules/onload/${file}`)({io:io,db:db,socketusers:socketusers,modules:modules}))


function createuser(data){
  data.password = jwt.sign(data.password, settings.TOKEN, { algorithm: settings.ALGORITHM });
  db.push("users",data)
}

io.use((socket, next) => {
  var dbget = db.get("users").find(z=>z.name == socket.handshake.auth.name);
  if(dbget) {
    if(dbget.banned) return next(new Error('You are banned'));
    if(jwt.verify(dbget.password, settings.TOKEN, { algorithms: [settings.ALGORITHM] }) == socket.handshake.auth.password) {
      const existingSocketId = socketusers.find(z=>z.name == socket.handshake.auth.name)
      if (existingSocketId) return next(new Error('User already connected'));
      socketusers.push({name:socket.handshake.auth.name,socketid:socket.id}) 
      return next();
    }
    else return next(new Error('Authentication error'));
  }
  createuser(socket.handshake.auth);
  next();
});

function deepCopy(obj) {
  if (Array.isArray(obj)) {return obj.slice().map(deepCopy); }
  else if (typeof obj === 'object' && obj !== null) {return Object.assign({}, ...Object.entries(obj).map(([k, v]) => ({ [k]: deepCopy(v) })));}
  else {return obj;}
}

io.on('connection', (socket) => {
  var Smodules = deepCopy(modules)
  fs.readdirSync('./modules/servermodules/onconnect').forEach(file=> require(`./modules/servermodules/onconnect/${file}`)({
    io:io,socket:socket,db:db,socketusers:socketusers,modules:Smodules
  }))
  Smodules.unshift(`Engine_socketid = "${socket.id}"`)
  Smodules.forEach(file =>  io.to(socket.id).emit("eval",file))
  console.log('A user connected');
  socket.on("disconnect", () => {
     console.log('A user disconnected');
    socketusers = socketusers.filter(user => user.socketid != socket.id)
    socket.disconnect();
   })
});


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log = function(...y) {
    process.stdout.write('\u001b[' + prompt.length + 'D');
    process.stdout.write('\u001b[0K');
    y.map(x=>{
    if(typeof x === 'object') {process.stdout.write(util.inspect(x, { colors: true, depth: null }) + '\n');}
    else {process.stdout.write(x + '\n');}
    })
    
    rl.prompt(true);
};
rl.setPrompt(prompt);
rl.prompt();

function kickuser(xuser,log){
  const Tuser = socketusers.find(z=>z.name === xuser || z.socketid === xuser)
  if(Tuser){
    io.sockets.sockets.forEach((connectedSocket) => {
      if (connectedSocket.id === Tuser.socketid) {
        connectedSocket.disconnect();
        return console.log("✅ "+c.yellowBright(Tuser.name)+" "+c.greenBright("Kicked from the server"));
      }});
    socketusers = socketusers.filter(user => user.name != xuser && user.socketid != xuser)
  }else if(log) return console.log("❌ "+c.redBright("User not found"));
}
function banuser(xuser,ban){
  var username = socketusers.find(z=>z.socketid === xuser)?.name || xuser
  var user = db.get("users").find(z=>z.name === username)
  if(!user) return console.log("❌ "+c.redBright("User not found"));
  user.banned = ban;
  const cv = db.get("users").filter(z=>z.name !== username)
  cv.push(user)
  db.set("users",cv)
  if(ban){
  console.log("✅ "+c.yellowBright(username)+" "+c.greenBright("Banned successfully"));
  return kickuser(xuser)
  } else console.log("✅ "+c.yellowBright(username)+" "+c.greenBright("UnBanned successfully"));
}

rl.on('line', function(line) {
    const argv = line.split(" ")
    if (argv[0] === "exit" || argv[0] === "stop") process.exit();
    else if (argv[0] === "list") console.log(socketusers);
    else if(argv[0] === "clear" || argv[0] === "cls") process.stdout.write('\u001b[2J\u001b[0;0H');
    else if (argv[0] === "ban") return banuser(argv[1],true)
    else if(argv[0] === "unban") return banuser(argv[1],false)
    else if (argv[0] === "kick") return kickuser(argv[1],true);
    else if(argv[0] === "help") console.log(
`${c.blue("Welcome To Electoria Engine Server\n")}
${c.green(`exit & stop`)+" : "+c.yellow("You shut down the server")}
${c.green(`list`)+" : "+c.yellow("You will see people connected to the server")}
${c.green(`clear & cls`)+" : "+c.yellow("Console is cleared")}
${c.green(`kick [user]`)+" : "+c.yellow("You kick the user from the server")}
${c.green(`ban [user]`)+" : "+c.yellow("You ban the user from the server")}
${c.green(`unban [user]`)+" : "+c.yellow("You unban the user from the server")}`)

    rl.prompt();
}).on('close', ()=> process.exit(0));
