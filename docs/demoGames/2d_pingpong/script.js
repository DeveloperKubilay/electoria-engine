editdisplay(1024,720)


var fast = 10;
var ease = 20;


var player1 = new Component({
  name:"player1",
  position:{
    x:100,y:0
  },
  scale:{
    x:25,y:150
  },
  inscreen:true,
  color:"red",
  collision:1
})


var bot = new Component({
  name:"bot",
  position:{
    x:950,y:0
  },
  
  scale:{
    x:25,y:150
  },
  color:"green",
  collision:1
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
    player1.update({position:{y:"-80"}})
  }else if(key === "S"){
    player1.update({position:{y:"+80"}})
  }
  else if(key === "ARROWUP"){
    player1.update({position:{y:"-80"}})

  }else if(key === "ARROWDOWN"){
    player1.update({position:{y:"+80"}})
  }
})

mousescroll = function(type){
 if(type == "down"){
  player1.update({position:{y:"+80"}})
 }else{
  player1.update({position:{y:"-80"}})
 }
} 

var moveball = {y:2,x:fast}
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
},10)


setInterval(()=>{
if(ball.get().scale.y == ball.get().position.y)moveball.y = -moveball.y
bot.update({
    position:{
      y:Math.max(1, Math.min(Engine_canvas.height-bot.get().scale.y, ball.get().position.y))
    }
  })
},ease)

collisionout = ((data,z,location,fside)=>{
 if(data == "ball"){
    if(location == "right") moveball.x = fast; else moveball.x = -fast;
      moveball.y =((100*fside.dy)/-fside.height)/10
 }
})

physicout= ((data,z)=>{
  if(z.left){
    stopgame()
   setTimeout(()=>reloadgame(),1500) 
    sendengine({
      sendvibrate:200,
      changestatusbar:"#ff0000"
    })
  }else if(z.right){
    stopgame()
    setTimeout(()=>reloadgame(),1500) 
    sendengine({
      sendvibrate:200,
      changestatusbar:"#ff0000"
    })
  }else if(z.top){
    moveball.y = -moveball.y

  }else if(z.bottom){
    moveball.y = -moveball.y
  }
})

var latesttouch = 1
touchmove = function(data){
  data = data[0]
 player1.update({position:{y:data.y-latesttouch}})
}
sendengine({
  changescreenstatus:3,
  changestatusbar:"#1e1e1e"
})
