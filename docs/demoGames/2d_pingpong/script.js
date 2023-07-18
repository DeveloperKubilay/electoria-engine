editdisplay(1024,720)


var fast = 50;
var maxy = 25;
var ease = 20;


var player1 = new Component({
  name:"player1",
  position:{
    x:100,y:0
  },
  scale:{
    x:25,y:130
  },
  inscreen:true,
  color:"red",
  collision:2
})


var bot = new Component({
  name:"bot",
  position:{
    x:950,y:0
  },
  
  scale:{
    x:25,y:50
  },
  color:"green",
  collision:2
})


var ball = new Component({
  name:"ball",
  position:{
    x:120,y:50
  },
  physic:{
    status:true,
    gravity:0
  },
  scale:{
    x:20,y:20
  },
  layer:50,
  inscreen:true,
  color:"#ddd",
  collision:1,
  stype:"fillarc"
})

keypress = ((key)=>{
  if(key === "W") {
    player1.update({position:{y:"-20"}})
  }else if(key === "S"){
    player1.update({position:{y:"+20"}})
  }
  else if(key === "ARROWUP"){
    player1.update({position:{y:"-20"}})

  }else if(key === "ARROWDOWN"){
    player1.update({position:{y:"+20"}})
  }
})

mousescroll = function(type){
 if(type == "down"){
  player1.update({position:{y:"+40"}})
 }else{
  player1.update({position:{y:"-40"}})
 }
} 

var moveball = {y:0,x:fast}
setInterval(()=>{
  if(ball.get().position.y < 20){
    ball.update({position:{y:20}})
  }
  if(moveball.hasOwnProperty("x")){
    ball.update({physic:{x:moveball.x}})
  }
  if(moveball.hasOwnProperty("y")){
    ball.update({physic:{y:moveball.y}})
  }
},32)


setInterval(()=>{
  bot.update({
    position:{
      y:Math.max(1, Math.min(620, ball.get().position.y))
    }
  })
},ease)

collisionout = ((data,z,location,fside)=>{
 if(data == "ball"){
    if(location == "right") moveball.x = fast; else moveball.x = -fast;
    if(fside.dy > 0){
      moveball.y = Math.max(-1, Math.min(-maxy, fside.dy));
    }else{
      moveball.y = Math.max(1, Math.min(-maxy, fside.dy));
    }
 }
})

physicout= ((data,z)=>{
  if(z.left){
    stopgame()
    setTimeout(()=>reloadgame(),2000) 

  }else if(z.right){
    stopgame()
    setTimeout(()=>reloadgame(),2000) 

  }else if(z.top){
    moveball.y = -moveball.y

  }else if(z.bottom){
    moveball.y = -moveball.y

  }
})