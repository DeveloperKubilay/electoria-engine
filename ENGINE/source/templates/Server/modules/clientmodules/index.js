

console.log("Server Started",Engine_socketid);

const main_c = new Component({
    name: Engine_socketid,
    inscreen: true,
    physic: {
      status: true,
    },
    position:{x:50,y:50},
    scale: {
      x: 50,
      y: 90,
    },
    color:"red",
    collision:2
  });

  keypress = (key) => {
    if (key === "W" || key == "ARROWUP") {
      server.emit("Move",{ y:true });
    } else if (key === "S" || key == "ARROWDOWN") {
      server.emit("Move",{ y:false });
    } else if (key === "A" || key == "ARROWLEFT") {
      server.emit("Move",{ x:false });
    } else if (key === "D" || key == "ARROWRIGHT") {
      server.emit("Move",{ x:true });
    }
  };

  server.on("Move",event=>{
  updateData({name:event.name,physic:event.data})
  })