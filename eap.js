var Playerupdaterdb = new Map()
var Animateupdaterdb = new Map()
var Engine_monitorhz = 0
var Engine_socketid = undefined;
var moduleloaded = {t:0,c:0,u:false}

function connectserver(url,auth){
try{ 
const xserver = io(("ws://"+url),{auth:auth,transports: ['websocket'] });
xserver.on('eval', evalc => eval(evalc));
return xserver;
}catch{return;}
}

function anim(data,fnc){
if(!data || !data.name || !data.position || !data.position.hasOwnProperty("x") || !data.position.hasOwnProperty("y"))return;
anime({
  targets: getData(data.name).position,
  x: data.position.x,y: data.position.y,
  duration: data.time || 1000,easing: data.hasOwnProperty("type") ? data.type : 'linear',
  complete:function(){updateData({name: data.name,physic:{x:0,y:0}}); if(fnc) fnc()}
});
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


const Engine_getFPS = () =>
  new Promise(resolve =>
    requestAnimationFrame(t1 =>
      requestAnimationFrame(t2 => resolve(1000 / (t2 - t1)))
    )
  )


Engine_getFPS().then(fps =>{
  const liste = [24, 30, 60, 75, 90, 120, 144, 160, 180, 240, 280, 360];
  const farklar = liste.map(x => Math.abs(x - fps));
  const enKüçükFarkIndeksi = farklar.indexOf(Math.min(...farklar));
  fps = liste[enKüçükFarkIndeksi]
  Engine_monitorhz = fps
  if(Engine_onload.fps == "vsync") Engine_updatefps(Engine_monitorhz)
  Enginefpsupdatetasks.map(x=>x(fps))
});


function require(x){
  moduleloaded.t++;
  fetch(x)
  .then(response => response.text())
  .then(data => {
    moduleloaded.c++;
    eval(data)
    if(moduleloaded.t == moduleloaded.c) {
      modulesloaded(moduleloaded.u)
      moduleloaded.u = true
    }    
  }).catch(()=>{});
}
function addstyle(url) {
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

function addfont(fontName, fontUrl) {
  var style = document.createElement('style');
  style.appendChild(document.createTextNode(`
      @font-face {
          font-family: "${fontName}";
          src: url("${fontUrl}");
      }
  `));
  document.head.appendChild(style);
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

function modulesloaded(x){return;}

function generaterandomnumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generaterandomarray(arr) {
    if (!arr.length) {
        return undefined;
    }
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}
