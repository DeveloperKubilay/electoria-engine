var Playerupdaterdb = new Map()
var Animateupdaterdb = new Map()
var Engine_monitorhz = 0

function connectserver(url,auth){
try{ return io(("ws://"+url),{auth:auth,transports: ['websocket'] });
}catch{return;}
}

function anim(data){
if(!data || !data.name || !data.position || !data.position.hasOwnProperty("x") || !data.position.hasOwnProperty("y"))return;
anime({
  targets: getData(data.name).position,
  x: data.position.x,y: data.position.y,
  duration: data.time || 1000,easing: data.hasOwnProperty("type") ? data.type : 'linear',
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

function Engine_testfps(timestamp) {
  if (timestamp) return function(){
      const liste = [30, 60, 75, 120, 144, 240, 360];
      let eny = liste[0];
      for (let i = 1; i < liste.length; i++) {
        if (Math.abs(liste[i] - timestamp) < Math.abs(eny - timestamp)) {
          eny = liste[i];
      }}
      Engine_monitorhz = eny
      if(Engine_onload.fps == "vsync") Engine_updatefps(Engine_monitorhz)
  }()
  requestAnimationFrame(Engine_testfps);
}
requestAnimationFrame(Engine_testfps);


function require(x){
  fetch(x)
  .then(response => response.text()) // Gelen yanıtı metin olarak alalım
  .then(data => {
    eval(data)
  }).catch(()=>{});
}
function addstyle(url) {
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

async function linkget(x){
  return await fetch(x).then(response => response.text())
}

function getos(){
  const sett = platform
  return {
    name:sett.name,
    version:sett.version,
    os:{
      name:sett.os.family,
      version:sett.os.version,
      architecture: sett.os.architecture
    },
  }
}
