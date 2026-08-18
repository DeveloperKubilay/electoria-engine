editdisplay(1024, 720);

var server = connectserver("localhost:3000", {name:"player1",password:"test"});
server.on("connect", () => {
  console.log("connected")
})
server.on("disconnect", (x) => {
  console.log("disconnected")
})
