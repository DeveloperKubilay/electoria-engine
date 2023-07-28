var Playerupdaterdb = new Map()
var Animateupdaterdb = new Map()

function connectserver(url,auth){
try{ return io(("ws://"+url),{auth:auth,transports: ['websocket'] });
}catch{return;}
}

function anim(data){
if(!data || !data.name || !data.position || !data.position.hasOwnProperty("x") || !data.position.hasOwnProperty("y") || !data.time)return;
anime({
  targets: getData(data.name).position,
  x: data.position.x,y: data.position.y,
  duration: data.time,easing: data.hasOwnProperty("type") ? data.type : 'linear',
  complete:function(){updateData({name: data.name,physic:{x:0,y:0}})}
});
}

function playerupdaterserver(set,player,time){
    if(set == true){
        Playerupdaterdb.set(player,setInterval(()=>socket.emit("server", {player:getData(player)}),time || 1))
    }else{
        clearInterval(Playerupdaterdb.get(player))
        Playerupdaterdb.delete(player)
    }
}

function starthammercanvas(){
new Hammer(window).on('pan', function(ev) {
  if (ev.direction == Hammer.DIRECTION_RIGHT) hammercanvas("RIGHT",ev.deltaTime);
  if (ev.direction == Hammer.DIRECTION_LEFT) hammercanvas("LEFT",ev.deltaTime);
  if (ev.direction == Hammer.DIRECTION_UP) hammercanvas("UP",ev.deltaTime);
  if (ev.direction == Hammer.DIRECTION_DOWN ) hammercanvas("DOWN",ev.deltaTime);
});
}
function hammercanvas(location,time){return;}

async function getIP() {
  try {return await(await fetch('https://api.ipify.org')).text();
  } catch (error) {return;}
}

function Animator(ctype,player,array,type,time,loop){
  if(ctype == true){
    var tempanimation = 0;
  Playerupdaterdb.set(player,setInterval(()=>{
    if(tempanimation == array.length) {
      if(!loop) return Animator(false,player)
      tempanimation = 0;
    }
    updateData({
      name: player,
      [type]:array[tempanimation]
    })
    tempanimation++;
  },time || 1000))
 }else{
  clearInterval(Animateupdaterdb.get(player))
  Animateupdaterdb.delete(player)
 }
}
