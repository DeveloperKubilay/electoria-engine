/*
 _____ _           _             _         _____            _            
|  ___| |         | |           (_)       |  ___|          (_)           
| |__ | | ___  ___| |_ ___  _ __ _  __ _  | |__ _ __   __ _ _ _ __   ___ 
|  __|| |/ _ \/ __| __/ _ \| '__| |/ _` | |  __| '_ \ / _` | | '_ \ / _ \
| |___| |  __/ (__| || (_) | |  | | (_| | | |__| | | | (_| | | | | |  __/
\____/|_|\___|\___|\__\___/|_|  |_|\__,_| \____/_| |_|\__, |_|_| |_|\___|
                                                       __/ |             
                                                      |___/              
*/
console.log("Electoria Engine\nEngine Started")
var Engine_db = new Map()
var tempDatabase = new Map()
var Engine_canvas = document.getElementById("canvas")
const Engine_c = Engine_canvas.getContext('2d')
Engine_Components = []
Engine_Texts = []
Engine_Forcepress = []
Engine_background = ""
Engine_allbackgrounds=""
Engine_splitelimit = 1
Engine_backgroundlength = 0
Engine_backgroundlocation = {}
Engine_enablemouse = true
Engine_enablekeyboard = true
Engine_enabletouch = true
Engine_allnames = []
Engine_mouselocation = {}
Engine_database = {}
Engine_autocomponentsound = new Map()
Engine_gamerunning = true
Engine_Virtualshadow = {
   time:0,
   height:5,
   width:5,
   color:"rgba(0, 0, 0, 0.5)"
}
Engine_Virtualshadowitems = []
Engine_stablefps = ""
Engine_backgroundcolor = "black"

editdisplay(window.innerWidth,window.innerHeight);

function editdisplay(x,y){
Engine_canvas.width = x
Engine_canvas.height = y
backgroundupdate()
}
if(Engine_onload.fps != "vsync" && !isNaN(Number(Engine_onload.fps))) Engine_updatefps(Engine_onload.fps)
function Engine_updatefps(x){
   clearInterval(Engine_stablefps)
   Engine_stablefps = setInterval(()=>backgroundupdate(),1000/Number(x))
}
class Text {
 constructor(newdata) {
 if(!newdata || !newdata.name|| !newdata.position || !newdata.position.hasOwnProperty('x') || !newdata.position.hasOwnProperty('y')) return;
 newdata.type = "text"
  if(newdata.shadow){
     if(newdata.shadow.status === true) {newdata.shadow.status = true;}else{newdata.shadow.status = false;}  
     if(!newdata.shadow.x) newdata.shadow.x = "";
     if(!newdata.shadow.y) newdata.shadow.y = "";
     if(!newdata.shadow.blur) newdata.shadow.blur = "";
     if(!newdata.shadow.color) newdata.shadow.color = "";
  }else{
   newdata.shadow = {
        status:false,
        color:"",
        blur:"",
        x:"",
        y:""
     }
  }
 if(newdata.rotate && isNaN(Number(newdata.rotate))) newdata.rotate = 0
 if(newdata.rotate && !isNaN(Number(newdata.rotate))) newdata.rotate = Number(newdata.rotate)* Math.PI / 180
 if(!newdata.layer) newdata.layer = 100
 if(!newdata.size) newdata.size = "30px"
 if(!newdata.font) newdata.font = "Arial"
if(!newdata.opacity) newdata.opacity = 1;
 Engine_db.set(newdata.name,newdata)
 Engine_Texts.push(newdata.name)
 this.name = newdata.name
 if(newdata.eval) {try{eval(newdata.eval+"("+JSON.stringify(newdata)+","+"1"+")");}catch{}}
}
 update(updatedata) {updatedata.name = this.name,updateData(updatedata)}
 remove() {removeData(this.name)}
 get() {return getData(this.name)}
}

class Component {
constructor(newdata) {
if(!newdata || !newdata.name || Engine_splitelimit > Number(Engine_onload.splitelimit)
|| !newdata.position || !newdata.position.hasOwnProperty('x') || !newdata.position.hasOwnProperty('y')) return;
newdata.type = "component";
Engine_splitelimit++;
if(newdata.physic) {
 if(newdata.physic.status === true) {newdata.physic.status = true;}else{newdata.physic.status = false;}
 if(!newdata.physic.x) newdata.physic.x = 0;
 if(!newdata.physic.y) newdata.physic.y = 0;
 if(!newdata.physic.gravity) newdata.physic.gravity = "";
 if(!newdata.physic.xfriction) newdata.physic.xfriction = "";
 if(!newdata.physic.yfriction) newdata.physic.yfriction = "";
}else{
   newdata.physic = {
      status:false,
      x:0,
      y:0,
      gravity:"",
      xfriction:"",
      yfriction:""
   }
}
if(newdata.image && !newdata.hasOwnProperty('rotate')) newdata.rotate = 0
if(newdata.rotate && isNaN(Number(newdata.rotate))) newdata.rotate = 0
if(newdata.rotate && !isNaN(Number(newdata.rotate))) newdata.rotate = Number(newdata.rotate)* Math.PI / 180
if(newdata.shadow){
   if(newdata.shadow.status === true) {newdata.shadow.status = true;}else{newdata.shadow.status = false;}  
   if(!newdata.shadow.x) newdata.shadow.x = "";
   if(!newdata.shadow.y) newdata.shadow.y = "";
   if(!newdata.shadow.blur) newdata.shadow.blur = "";
   if(!newdata.shadow.color) newdata.shadow.color = "";
}else{
   newdata.shadow = {
      status:false,
      color:"",
      blur:"",
      x:"",
      y:""
   }
}
if(newdata.hasOwnProperty('animate')) {newdata.animatedata = {time:0,val:0}}
if(!newdata.stype) newdata.stype = "fillrect"
if(!newdata.layer) newdata.layer = 100
if(!newdata.opacity) newdata.opacity = 1
Engine_db.set(newdata.name,newdata)
Engine_Components.push(newdata.name)
this.name = newdata.name
if(newdata.eval) {try{eval(newdata.eval+"("+JSON.stringify(newdata)+","+"1"+")")}catch{}}
}
update(updatedata) {updatedata.name = this.name,updateData(updatedata)}
remove() {removeData(this.name)}
get() {return getData(this.name)}
}

class Textbox {
   constructor(newdata){
    if(!newdata || !newdata.name || !newdata.position || !newdata.position.hasOwnProperty('x') || !newdata.position.hasOwnProperty('y')) return;
    if(!newdata.scale) newdata.scale = {x:"auto",y:"auto"}
	 var textbox = document.createElement("input");
    textbox.style.position = 'absolute';
    textbox.style.left = newdata.position.x;
    textbox.style.top = newdata.position.y;
    textbox.style.width = newdata.scale.x;
    textbox.style.height = newdata.scale.y;
    textbox.style.zIndex = newdata.layer || "9999";
	 textbox.placeholder = newdata.placeholder || "";
    textbox.id = newdata.name
	 textbox.value = newdata.value || "";
	 textbox.addEventListener("keydown", function(event) {
			if (event.key === "Enter") {
        event.data = event.target.value
       try{ eval(getData(newdata.name).eval || "")}catch{}
		  if(getData(newdata.name).removeable) removeData(newdata.name)
			}
		});
   textbox.addEventListener("focus", () => textboxfocus(newdata.name));
		document.getElementById("screen").appendChild(textbox);
	if(newdata.focus)textbox.focus();
      newdata.type = "textbox"
      Engine_db.set(newdata.name,newdata)
      this.name = newdata.name
   }
   update(updatedata) {updatedata.name = this.name,updateData(updatedata)}
   remove() {removeData(this.name)}
   get() {return getData(this.name)}
}

class Video {
   constructor(newdata){
    if(!newdata || !newdata.name || !newdata.position || !newdata.position.hasOwnProperty('x') || !newdata.position.hasOwnProperty('y')) return;
    if(!newdata.scale) newdata.scale = {x:"auto",y:"auto"}
	 var video = document.createElement('video');
    video.style.position = 'absolute';
    video.style.left = newdata.position.x;
    video.style.top = newdata.position.y;
    video.style.width = newdata.scale.x;
    video.style.height = newdata.scale.y;
    video.style.zIndex = newdata.layer || "9999";
    video.id = newdata.name
    video.src = newdata.video;
    video.muted = newdata.muted || false;
    video.loop = newdata.loop || false;
    video.volume = newdata.volume || 1;
    if(newdata.hasOwnProperty('autoplay')){ video.autoplay = newdata.autoplay}else{newdata.autoplay= true}
   document.querySelector('#screen').appendChild(video);
   video.addEventListener("ended", function() {
     try{ eval(getData(newdata.name).eval || "")}catch{}
      if(getData(newdata.name).removeable) removeData(newdata.name)
    });
      newdata.type = "video"
      Engine_db.set(newdata.name,newdata)
      this.name = newdata.name
   }
   update(updatedata) {updatedata.name = this.name,updateData(updatedata)}
   remove() {removeData(this.name)}
   get() {return getData(this.name)}
}

function updateData(updatedata){
   if(!updatedata || !updatedata.name) return;
   this.data = Engine_db.get(updatedata.name)
   if(!this.data) return;
   if(this.data.type === "textbox" || this.data.type === "video"){
      if(updatedata.position && updatedata.position.hasOwnProperty('x')) this.data.position.x = updatedata.position.x
      if(updatedata.position && updatedata.position.hasOwnProperty('y')) this.data.position.y = updatedata.position.y
      if(updatedata.scale && updatedata.scale.hasOwnProperty('x')) this.data.scale.x = updatedata.scale.x
      if(updatedata.scale && updatedata.scale.hasOwnProperty('y')) this.data.scale.y = updatedata.scale.y
      if(updatedata.hasOwnProperty('layer')) this.data.layer = updatedata.layer
      if(updatedata.hasOwnProperty('eval')) this.data.eval = updatedata.eval
      if(updatedata.hasOwnProperty("removeable")) this.data.removeable = updatedata.removeable
      if(this.data.type === "textbox"){
       if(updatedata.hasOwnProperty('placeholder')) this.data.placeholder = updatedata.placeholder
       if(updatedata.hasOwnProperty('value')) this.data.value = updatedata.value
      }else if(this.data.type === "video"){
       if(updatedata.hasOwnProperty('autoplay')) this.data.autoplay = updatedata.autoplay
       if(updatedata.hasOwnProperty('muted')) this.data.muted = updatedata.muted
       if(updatedata.hasOwnProperty('video')) this.data.video = updatedata.video
       if(updatedata.hasOwnProperty('volume')) this.data.volume = updatedata.volume
       if(updatedata.hasOwnProperty('loop')) this.data.loop = updatedata.loop
      }
      try{
      var obj = document.getElementById(updatedata.name)
      obj.style.position = 'absolute';
      obj.style.left = this.data.position.x;
      obj.style.top = this.data.position.y;
      obj.style.width = this.data.scale.x;
      obj.style.height = this.data.scale.y;
      obj.style.zIndex = this.data.layer;
      if(this.data.type === "textbox"){
         obj.placeholder = this.data.placeholder || "";
         obj.value = this.data.value || "";
      if(updatedata.focus)obj.focus();
      }else if(this.data.type === "video"){
         obj.src = this.data.video;
         obj.autoplay = this.data.autoplay
         obj.muted = this.data.muted
         obj.loop = this.data.loop
         obj.volume = this.data.volume
      }
      }catch{}
      Engine_db.set(this.data.name, this.data)
     return this.data = ""
   }
   if(updatedata.shadow){
      if(updatedata.shadow.status === false) {this.data.shadow.status = false;}
      else if(updatedata.shadow.status === true){this.data.shadow.status = true;}
      if(updatedata.shadow.hasOwnProperty('color')) this.data.shadow.color = Number(updatedata.shadow.color)
      if(updatedata.shadow.hasOwnProperty('blur')) this.data.shadow.blur = Number(updatedata.shadow.blur)
      if(updatedata.shadow.hasOwnProperty('x')) this.data.shadow.x = Number(updatedata.shadow.x)
      if(updatedata.shadow.hasOwnProperty('y')) this.data.shadow.y = Number(updatedata.shadow.y)
    }
    if(updatedata.hasOwnProperty('layer')) this.data.layer = updatedata.layer
    if(updatedata.hasOwnProperty('color')) this.data.color = updatedata.color
    if(updatedata.hasOwnProperty('rotate') && !isNaN(Number(updatedata.rotate))) this.data.rotate = Number(updatedata.rotate) * Math.PI / 180
    if(this.data.type === "text"){
      if(updatedata.hasOwnProperty('size')) this.data.size = updatedata.size
      if(updatedata.hasOwnProperty('font')) this.data.font = updatedata.font
      if(updatedata.hasOwnProperty('text')) this.data.text = updatedata.text
      if(updatedata.text === false) this.data.text = ""
      if(updatedata.position) {
         if(updatedata.position.hasOwnProperty('x')) {
            if(typeof updatedata.position.x === "string" && updatedata.position.x.split("+").length == 2 || 
            typeof updatedata.position.x === "string" && updatedata.position.x.split("-").length == 2) {
              this.data.position.x = this.data.position.x+Number(updatedata.position.x)
            }else this.data.position.x = Number(updatedata.position.x)
         }
         if(updatedata.position.hasOwnProperty('y')) {
            if(typeof updatedata.position.y === "string" && updatedata.position.y.split("+").length == 2 || 
            typeof updatedata.position.y === "string" && updatedata.position.y.split("-").length == 2) {
              this.data.position.y = this.data.position.y+Number(updatedata.position.y)
             }else this.data.position.y = Number(updatedata.position.y)
         }}
    }else if(this.data.type === "component"){
      if(updatedata.hasOwnProperty("collision")) this.data.collision = updatedata.collision
      if(updatedata.inscreen === false || updatedata.inscreen) this.data.inscreen = updatedata.inscreen
      if(updatedata.position){
   if(this.data.inscreen){
      if(updatedata.position) {               
         if(updatedata.position.hasOwnProperty('x')) {
            if(typeof updatedata.position.x === "string" && updatedata.position.x.split("+").length == 2 ||
            typeof updatedata.position.x === "string" && updatedata.position.x.split("-").length == 2) {
              this.data.position.x = this.data.position.x+Number(updatedata.position.x)
            }else this.data.position.x = Number(updatedata.position.x)
         }
         if(updatedata.position.hasOwnProperty('y')) {
            if(typeof updatedata.position.y === "string" && updatedata.position.y.split("+").length == 2 ||
            typeof updatedata.position.y === "string" && updatedata.position.y.split("-").length == 2) {
              this.data.position.y = this.data.position.y+Number(updatedata.position.y)
             }else this.data.position.y = Number(updatedata.position.y)
         }
      }
       if(Math.sign(updatedata.position.x) === -1 &&
       -Number(this.data.position.x) > Number(updatedata.position.x) || 
       Math.sign(updatedata.position.x) === 1 &&
       Number(this.data.position.x)+Number(this.data.scale.x)+Number(updatedata.position.x) > Engine_canvas.width ||
       Math.sign(updatedata.position.y) === -1 &&
       -Number(this.data.position.y) > Number(updatedata.position.y) || 
       Math.sign(updatedata.position.y) === 1 &&
       Number(this.data.position.y)+Number(this.data.scale.y)+Number(updatedata.position.y) > Engine_canvas.height
       ) {
        if(Math.sign(updatedata.position.x) === -1 &&
        -Number(this.data.position.x) > Number(updatedata.position.x)) this.data.position.x = 0
        if(Math.sign(updatedata.position.x) === 1 &&
        Number(this.data.position.x)+Number(this.data.scale.x)+Number(updatedata.position.x) > Engine_canvas.width) {
         this.data.position.x = Engine_canvas.width-Number(this.data.scale.x)
        }
        if(Math.sign(updatedata.position.y) === -1 &&
        -Number(this.data.position.y) > Number(updatedata.position.y)) this.data.position.y = 0
        if(Math.sign(updatedata.position.y) === 1 &&
        Number(this.data.position.y)+Number(this.data.scale.y)+Number(updatedata.position.y) > Engine_canvas.height) {
         this.data.position.y = Engine_canvas.height-Number(this.data.scale.y)
        }
      }
   }else{
      if(updatedata.position) {
        if(updatedata.position.hasOwnProperty('x')) {
            if(typeof updatedata.position.x === "string" && updatedata.position.x.split("+").length == 2 || 
            typeof updatedata.position.x === "string" && updatedata.position.x.split("-").length == 2) {
              this.data.position.x = this.data.position.x+Number(updatedata.position.x)
            }else this.data.position.x = Number(updatedata.position.x)
         }
         if(updatedata.position.hasOwnProperty('y')) {
            if(typeof updatedata.position.y === "string" && updatedata.position.y.split("+").length == 2 || 
            typeof updatedata.position.y === "string" && updatedata.position.y.split("-").length == 2) {
              this.data.position.y = this.data.position.y+Number(updatedata.position.y)
             }else this.data.position.y = Number(updatedata.position.y)
         }}}}
      if(updatedata.scale) {
        if(updatedata.scale.hasOwnProperty('x')) {
          if(typeof updatedata.scale.x === "string" && 
          updatedata.scale.x.split("+").length == 2 || updatedata.scale.x.split("-").length == 2) {
            this.data.scale.x = this.data.scale.x+Number(updatedata.scale.x)
          }else this.data.scale.x = updatedata.scale.x
       }
       if(updatedata.scale.hasOwnProperty('y')) {
          if(typeof updatedata.scale.y === "string" && 
          updatedata.scale.y.split("+").length == 2 || updatedata.scale.y.split("-").length == 2) {
            this.data.scale.y = this.data.scale.y+Number(updatedata.scale.y)
          }else this.data.scale.y = updatedata.scale.y 
    }}
    if(updatedata.physic){
      if(updatedata.physic.status === false) {this.data.physic.status = false;}
      else if(updatedata.physic.status === true){this.data.physic.status = true;}
      if(updatedata.physic.hasOwnProperty('x')) this.data.physic.x = Number(updatedata.physic.x)
      if(updatedata.physic.hasOwnProperty('y')) this.data.physic.y = Number(updatedata.physic.y)
      if(updatedata.physic.hasOwnProperty('gravity')) this.data.physic.gravity = Number(updatedata.physic.gravity)
      if(updatedata.physic.hasOwnProperty('yfriction')) this.data.physic.yfriction = Number(updatedata.physic.yfriction)
      if(updatedata.physic.hasOwnProperty('xfriction')) this.data.physic.xfriction = Number(updatedata.physic.xfriction)
    }
   if(updatedata.hasOwnProperty('animate')) {
      this.data.animate = updatedata.animate
      this.data.animatedata = {time:0,val:0}
   }
   if(updatedata.hasOwnProperty('reverse')) this.data.reverse = updatedata.reverse
   if(updatedata.image == false) {this.data.image = ""}else if(updatedata.image) {
   this.data.image = updatedata.image
   this.data.rotate = 0;
   }
   if(updatedata.stype) this.data.stype = updatedata.stype
   if(this.data.image && this.data.stype){ 
      if(this.data.stype == "fillarc" || this.data.stype == "fa" 
      || this.data.stype == "strokearc" || this.data.stype == "sa" || this.data.stype.split("strokearc").length != 2) this.data.stype = "fr"
   }}
   if(updatedata.hasOwnProperty('opacity')) this.data.opacity = updatedata.opacity
   if(updatedata.hasOwnProperty('eval')) this.data.eval = updatedata.eval
   if(this.data.eval) {try{
    eval(this.data.eval+"("+JSON.stringify(this.data)+","+"2"+")")
   }catch{}}
   Engine_db.set(updatedata.name,this.data)
   this.data = ""
}

 function getData(name){if(!name)return;return Engine_db.get(name)}
 function removeData(name) { if(!name) return;
   try{
   if(Engine_db.get(name).type === "textbox" || Engine_db.get(name).type === "video"){Engine_db.delete(name)
     return document.getElementById(name).remove();
   }}catch{}
   Engine_db.delete(name)
   Engine_Texts = Engine_Texts.filter((z)=> z != name)
   Engine_Components = Engine_Components.filter((z)=> z != name)
   Engine_splitelimit+=-1;
}

try{
Engine_allbackgrounds = document.querySelectorAll("#backgrounds img")
Engine_background = Engine_allbackgrounds[0].id
if(Engine_allbackgrounds.length > 1) {
var Engine_BackgroundInterval = setInterval(()=>{
   Engine_backgroundlength++;
  if(Engine_allbackgrounds.length <=  Engine_backgroundlength) Engine_backgroundlength = 0
   Engine_background = Engine_allbackgrounds[Engine_backgroundlength].id
},Number(Engine_onload.backgroundspeed))
}
}catch{}

function physicengine(data){
if(data.position.y + data.scale.y + data.physic.y >= Engine_canvas.height && data.inscreen || 
data.inscreen && data.position.y + data.physic.y < 0){
     if(Engine_canvas.height- data.position.y - data.scale.y < 0 && data.physic.y < 1 && data.physic.locky == 1) {
      data.physic.y = 0
      }else{data.physic.locky = 1;physicout(data.name,{
         top:data.inscreen && data.position.y + data.physic.y < 0,
         bottom:data.position.y + data.scale.y + data.physic.y >= Engine_canvas.height
      })
       if(data.physic.yfriction) {data.physic.y = -data.physic.y * Number(data.physic.yfriction)
       }else{ data.physic.y = -data.physic.y * Number(Engine_onload.yfriction)};}
}else if(!data.physic.flocky){
data.physic.y += data.physic.gravity || Number(Engine_onload.gravity);
data.physic.locky = false;
physicout(data.name,{flying:true})}
if(data.position.x + data.scale.x + data.physic.x >= Engine_canvas.width && data.inscreen 
|| data.inscreen && data.position.x + data.physic.x < 0){
   physicout(data.name,{
      right:data.position.x + data.scale.x + data.physic.x >= Engine_canvas.width,
      left:data.inscreen && data.position.x + data.physic.x < 0
   })
   if(data.physic.xfriction) {data.physic.x = -data.physic.x * (1-Number(data.physic.xfriction))
   }else{ data.physic.x = -data.physic.x  * (1-Number(Engine_onload.xfriction))};
}else {
   if (data.physic.x > 0.001 && data.physic.x < 1 || data.physic.x < -0.001 && data.physic.x > -1) {
      data.physic.x = 0;
      physicout(data.name,{bounced:true})
    }else{
   if(data.physic.x && data.physic.xfriction) {data.physic.x += data.physic.x * -Number(data.physic.xfriction);}
   else{data.physic.x += data.physic.x * -Number(Engine_onload.xfriction)}
   }
}
data.position.x += data.physic.x;
data.position.y += data.physic.y;
Engine_db.set(data.name,data)
}

function findSide(data, z, tempdata) {
  tempdata.dx = (data.position.x + data.scale.x / 2) - (z.position.x + z.scale.x / 2);
  tempdata.dy = (data.position.y + data.scale.y / 2) - (z.position.y + z.scale.y / 2);
  tempdata.width = (data.scale.x + z.scale.x) / 2;
  tempdata.height = (data.scale.y + z.scale.y) / 2;
  tempdata.crossWidth = tempdata.width * tempdata.dy;
  tempdata.crossHeight = tempdata.height * tempdata.dx;
  tempdata.output = ""
  if (Math.abs(tempdata.dx) <= tempdata.width && Math.abs(tempdata.dy) <= tempdata.height) {
    if (tempdata.crossWidth > tempdata.crossHeight) {tempdata.output = (tempdata.crossWidth > -tempdata.crossHeight) ? 'bottom' : 'left';
    } else { tempdata.output = (tempdata.crossWidth > -tempdata.crossHeight) ? 'right' : 'top';}
  } else if (Math.abs(tempdata.dx) <= tempdata.width) {tempdata.output = tempdata.dx < 0 ? 'right' : 'left';
  } else if (Math.abs(tempdata.dy) <= tempdata.height) {tempdata.output = tempdata.dy < 0 ? 'bottom' : 'top';
  }
  return tempdata
}


function findcollision(data){
   Engine_Components.sort((a, b) => Engine_db.get(b).layer- Engine_db.get(a).layer)
   Engine_Components.map((z,fside) => {
     z = getData(z); if(!z || !z.collision || z.name == data.name) return;
     if (
      data.position.y + data.scale.y >= z.position.y && data.position.y <= z.position.y + z.scale.y &&
      data.position.x + data.scale.x >= z.position.x && data.position.x <= z.position.x + z.scale.x
     ) {
fside = findSide(data,z,{})
if(fside.output == "top"){
   collisionout(data.name,z.name,"top",fside)
   if(data.collision == 3) return;
  if(data.inscreen && data.position.y < 0){
      z.position.y = data.scale.y+1
      return data.position.y = 0 
   }
   if(data.inscreen && z.scale.y+z.position.y > Engine_canvas.height){
      z.position.y = Engine_canvas.height-z.scale.y
      return data.position.y = z.position.y-data.scale.y-1
   }
  if(data.physic && data.physic.status){
      data.physic.y = -data.physic.y * Number(Engine_onload.yfriction)
      data.position.y = z.position.y-data.scale.y
      data.physic.flocky = true
  }else if(data.physic && data.physic.status == false){
      if(data.collision ==2){data.position.y = z.position.y-data.scale.y-(z.physic && z.physic.status && z.physic.y || 0)
      }else{z.position.y = data.position.y+data.scale.y-(z.physic && z.physic.status && z.physic.y || 0)}
   }
}else if(fside.output == "right"){
   collisionout(data.name,z.name,"right",fside)
   if(data.collision == 3) return;
   if(data.inscreen && data.scale.x+z.position.x+z.scale.x > Engine_canvas.width){
      data.position.x = Engine_canvas.width-data.scale.x
      z.position.x = data.position.x-z.scale.x
      if(z.physic && z.physic.status && z.physic.x) z.physic.x = -z.physic.x
   }else if(data.inscreen && z.position.x < 0){
      z.position.x = 0
      data.position.x = z.scale.x
      if(data.physic && data.physic.status && data.physic.x) data.physic.x = -data.physic.x
   }else {
      if(z.physic && z.physic.status && data.physic){
         if(data.physic.x && data.physic.x < 0){
           data.position.x = z.position.x+z.scale.x
          if(z.collision ==2) {z.physic.x = data.physic.x*1.1;}else{data.physic.x = -data.physic.x}
         }else{
         z.position.x = data.position.x-z.scale.x 
         if(data.collision ==2) {data.physic.x = z.physic.x*1.01}else{z.physic.x = -z.physic.x}
      }
      }else{
          data.position.x = z.position.x+z.scale.x
         if(data.physic && data.physic.status && data.physic.x) data.physic.x = -data.physic.x
      }
   }
}else if(fside.output == "bottom"){collisionout(data.name,z.name,"bottom",fside)
}else if(fside.output == "left"){collisionout(data.name,z.name,"left",fside)}
   }else{if(data.physic && data.physic.status){data.physic.flocky = false}}
   });
   Engine_db.set(data.name,data)
}

function animatemanager(data){
   data.animatedata.time++;
   if(data.animate[data.animatedata.val].time < data.animatedata.time) {
   data.animatedata.time = 0;
   data.animatedata.val = data.animatedata.val+1;
   if(data.animatedata.val == data.animate.length) data.animatedata.val = 0;
   }
   Engine_c.drawImage(document.getElementById(data.animate[data.animatedata.val].image),
   data.animate[data.animatedata.val].position.x,
   data.animate[data.animatedata.val].position.y,
   data.animate[data.animatedata.val].scale.x,
   data.animate[data.animatedata.val].scale.y,
   data.position.x, 
   data.position.y,
   data.scale.x, 
   data.scale.y,
   )
   if(data.hasOwnProperty('rotate')) { Engine_c.restore();}
   Engine_db.set(data.name,data)
}

function backgroundupdate(){
   if(Engine_gamerunning) {
   backgroundreset()
   Engine_allnames = Engine_Components.concat(Engine_Texts);
   Engine_allnames.sort((a, b) => Engine_db.get(a).layer - Engine_db.get(b).layer)
   Engine_c.beginPath();
   Engine_c.shadowColor = ""
   Engine_c.shadowOffsetX = ""
   Engine_c.shadowOffsetY = ""
   Engine_c.shadowBlur = ""
   Engine_c.globalAlpha = 1
   Engine_allnames.map((x)=>{
      let data = Engine_db.get(x)
      if(!data) return;
      if(data.physic && data.physic.status != false) physicengine(data)
      if(data.image == false && data.color == false) return;
      if(data.type === "component"){
      if(Engine_onload.onlyonscreen){
      if( 
        data.position.y > Engine_canvas.height ||
        data.position.y+data.scale.y < 0 || 
        data.position.x > Engine_canvas.width||
        data.position.x+data.scale.x < 0
      ) return;}
      if(data.collision)findcollision(data)
   }
      Engine_c.globalAlpha = data.opacity
      if(data.shadow && data.shadow.status != false){
      if(data.shadow.color){Engine_c.shadowColor = data.shadow.color}
      if(data.shadow.blur){Engine_c.shadowBlur = data.shadow.blur}
      if(data.shadow.x){Engine_c.shadowOffsetX = data.shadow.x}
      if(data.shadow.y){Engine_c.shadowOffsetY = data.shadow.y}
      }
      if(data.type == "component" && data.animate && data.animate.length){
         if(!data.hasOwnProperty('rotate')) data.rotate = 0
         if(data.reverse){
            Engine_c.save();
            Engine_c.translate(data.position.x + (data.animate[data.animatedata.val].scale.x / 2),
             data.position.y + (data.animate[data.animatedata.val].scale.y / 2));
            Engine_c.scale(-1, 1);
            Engine_c.rotate(data.rotate);
            Engine_c.translate(-(data.position.x + (data.animate[data.animatedata.val].scale.x / 2)),
             -(data.position.y + (data.animate[data.animatedata.val].scale.y / 2)));   
         }else{
            Engine_c.save();
            Engine_c.translate(data.position.x + (data.scale.x / 2), data.position.y + (data.scale.y / 2));
            Engine_c.rotate(data.rotate);
            Engine_c.translate(-data.position.x - (data.scale.x / 2), -data.position.y - (data.scale.y / 2));
         }
         return animatemanager(data)
      }else if(data.stype && data.hasOwnProperty('rotate') && data.stype != "fillarc" && data.stype != "fa" 
      && data.stype != "strokearc" && data.stype != "sa" && data.stype.split("strokearc").length != 2) {
      Engine_c.save();
      Engine_c.translate(data.position.x + data.scale.x / 2, data.position.y + data.scale.y / 2);
      Engine_c.rotate(data.rotate);
      }else if(data.type == "text" && data.hasOwnProperty('rotate')){
         Engine_c.save();
         Engine_c.translate(data.position.x/2, data.position.y/2);
         Engine_c.rotate(data.rotate);
      }
      if(data.type == "component" && data.image){
      try{if(data.hasOwnProperty('reverse')) {
            Engine_c.scale(-1, 1);
            Engine_c.drawImage(document.getElementById(data.image),-data.scale.x / 2, -data.scale.y / 2, data.scale.x, data.scale.y)
            Engine_c.restore();    
         }else{
            Engine_c.drawImage(document.getElementById(data.image),-data.scale.x / 2, -data.scale.y / 2, data.scale.x, data.scale.y)
            Engine_c.restore();}
       }catch{}}
      else if(data.color !=false) {
      if(data.type == "text"){
         Engine_c.font = String(data.size)+" "+String(data.font);
         Engine_c.fillStyle = data.color || "black"
         Engine_c.fillText(data.text, data.position.x, data.position.y)
         if(data.hasOwnProperty('rotate')) Engine_c.restore();   
      }else {
      if(data.stype == "fillrect" || data.stype == "fr"){
      Engine_c.fillStyle = data.color || "black";
      if(data.hasOwnProperty('rotate')) {
         Engine_c.fillRect(-data.scale.x / 2, -data.scale.y / 2, data.scale.x, data.scale.y);
         Engine_c.restore();       
      }else{Engine_c.fillRect(data.position.x, data.position.y, data.scale.x, data.scale.y);}
      } else if(data.stype == "fillarc" || data.stype == "fa") {
         Engine_c.fillStyle = data.color || "black";
         Engine_c.arc(data.position.x+data.scale.x, data.position.y+data.scale.y-data.scale.x, data.scale.x,0,2*Math.PI);
         Engine_c.fill();
      }else if(data.stype == "strokearc" || data.stype == "sa") {
         Engine_c.strokeStyle = data.color || "black"
         Engine_c.arc(data.position.x+data.scale.x, data.position.y+data.scale.y-data.scale.x, data.scale.x,0, 2*Math.PI);
         Engine_c.stroke();
      }else if(data.stype.split("strokearc").length == 2) {
         Engine_c.strokeStyle = data.color || "black"
         Engine_c.lineWidth = data.stype.split("strokearc")[1];
         Engine_c.arc(data.position.x+data.scale.x, data.position.y+data.scale.y-data.scale.x, data.scale.x,0, 2*Math.PI);
         Engine_c.stroke();
      }else if(data.stype.split("strokerect").length == 2) {
         Engine_c.strokeStyle = data.color || "black"
         Engine_c.lineWidth = data.stype.split("strokerect")[1];
         if(data.hasOwnProperty('rotate')) {
            Engine_c.strokeRect(-data.scale.x / 2, -data.scale.y / 2, data.scale.x, data.scale.y);
            Engine_c.restore();       
         }else{Engine_c.strokeRect(data.position.x, data.position.y, data.scale.x, data.scale.y);}
      }else if(data.stype == "strokerect" || data.stype == "sr") {
         if(data.hasOwnProperty('rotate')) {
         Engine_c.strokeStyle = data.color || "black"
         Engine_c.strokeRect(-data.scale.x / 2, -data.scale.y / 2, data.scale.x, data.scale.y);
         Engine_c.restore();       
      }else{Engine_c.strokeRect(data.position.x, data.position.y, data.scale.x, data.scale.y);}
      }
   }}
   if(data.eval) {try{eval(data.eval+"("+JSON.stringify(data)+","+"3"+")")}catch{}}
   Engine_c.beginPath();
   Engine_c.shadowColor = ""
   Engine_c.shadowOffsetX = ""
   Engine_c.shadowOffsetY = ""
   Engine_c.shadowBlur = ""
   Engine_c.globalAlpha = 1
   })
   }
   if(Engine_onload.fps == "auto") requestAnimationFrame(backgroundupdate)
}

function backgroundmap(data){
   if(!Engine_background) return;
   try{clearInterval(Engine_BackgroundInterval);}catch{}
   if(!Engine_backgroundlocation.x) Engine_backgroundlocation.x = 1
   if(!Engine_backgroundlocation.y) Engine_backgroundlocation.y = 1
   if(!Engine_backgroundlocation.dx) Engine_backgroundlocation.dx = Engine_canvas.width
   if(!Engine_backgroundlocation.dy) Engine_backgroundlocation.dy = Engine_canvas.height
   if(!data){data = {}}
   if(data.hasOwnProperty('right')) Engine_backgroundlocation.right = data.right
   if(data.hasOwnProperty('bottom')) Engine_backgroundlocation.bottom = data.bottom
   if(data.hasOwnProperty('left')) Engine_backgroundlocation.left = data.left
   if(data.hasOwnProperty('top')) Engine_backgroundlocation.top = data.top
   if(data.hasOwnProperty('dx')) Engine_backgroundlocation.dx = data.dx
   if(data.hasOwnProperty('dy')) Engine_backgroundlocation.dy = data.dy
if(Engine_backgroundlocation.bottom < Engine_backgroundlocation.y || Engine_backgroundlocation.right < Engine_backgroundlocation.x)return;
 if(data.hasOwnProperty('x')) {
   if(typeof data.x === "string" && data.x.split("+").length == 2){
      Engine_backgroundlocation.x = Engine_backgroundlocation.x+Number(data.x.split("+")[1])
   }else if(typeof data.x === "string" && data.x.split("-").length == 2){
      Engine_backgroundlocation.x = Engine_backgroundlocation.x-Number(data.x.split("-")[1])
   }else{Engine_backgroundlocation.x = data.x}
 }else{data.x = 0}
 if(data.hasOwnProperty('y')) {
   if(typeof data.y === "string" && data.y.split("+").length == 2){
      Engine_backgroundlocation.y = Engine_backgroundlocation.y+Number(data.y.split("+")[1])
   }else if(typeof data.y === "string" && data.y.split("-").length == 2){
      Engine_backgroundlocation.y = Engine_backgroundlocation.y-Number(data.y.split("-")[1])
   }else{Engine_backgroundlocation.y = data.y}
 }else{data.y = 0}

 if(Engine_backgroundlocation.x <= Engine_backgroundlocation.left) Engine_backgroundlocation.x = Engine_backgroundlocation.left
 if(Engine_backgroundlocation.x >= Engine_backgroundlocation.right-Engine_backgroundlocation.dx)
   Engine_backgroundlocation.x = Engine_backgroundlocation.right-Engine_backgroundlocation.dx

   if(Engine_backgroundlocation.y <= Engine_backgroundlocation.top) Engine_backgroundlocation.y = Engine_backgroundlocation.top
   if(Engine_backgroundlocation.y >= Engine_backgroundlocation.bottom-Engine_backgroundlocation.dy) 
     Engine_backgroundlocation.y = Engine_backgroundlocation.bottom-Engine_backgroundlocation.dy
}

function backgroundreset() {
   if(Engine_background){
   try{
      if(Engine_backgroundlocation.x && Engine_backgroundlocation.y){
         Engine_c.drawImage(document.getElementById(Engine_background),
         Engine_backgroundlocation.x, Engine_backgroundlocation.y,
         Engine_backgroundlocation.dx,Engine_backgroundlocation.dy,
         0, 0,
         Engine_canvas.width, Engine_canvas.height
      );  
      }else{
    Engine_c.drawImage(document.getElementById(Engine_background), 0, 0,Engine_canvas.width,Engine_canvas.height); 
   }}catch{
      if(Engine_backgroundcolor){
         Engine_c.fillStyle = Engine_backgroundcolor
         Engine_c.fillRect(0, 0,Engine_canvas.width,Engine_canvas.height);
        }else{
         Engine_c.clearRect(0, 0,Engine_canvas.width,Engine_canvas.height);
        }   
   }}else {
      if(Engine_backgroundcolor){
       Engine_c.fillStyle = Engine_backgroundcolor
       Engine_c.fillRect(0, 0,Engine_canvas.width,Engine_canvas.height);
      }else{
       Engine_c.clearRect(0, 0,Engine_canvas.width,Engine_canvas.height);
      }
   }
}
function hidecursor(){document.body.style.cursor = "none";}
function showcursor(){document.body.style.cursor = "default";}
function editcursor(x){document.body.style.cursor = x;}
function disablemouse(){hidecursor();Engine_enablemouse = false;Engine_mouselocation = {}}
function enablemouse(){showcursor();Engine_enablemouse = true;Engine_mouselocation = {}}
function getMouselocation(){return Engine_mouselocation}
function disablekeyboard(){Engine_Forcepress=[];Engine_enablekeyboard = false}
function enablekeyboard(){Engine_enablekeyboard = true}
function disabletouch(){Engine_enabletouch = false}
function enabletouch(){Engine_enabletouch = true}
function keydown(key){return;}
function keyup(key){return;}
function keypress(key){return;}
function leftclicked(location,component){return;}
function rightclicked(location,component){return;}
function mousemove(location,component){return;}
function mouseup(location,component){return;}
function mousedown(location,component){return;}
function mousescroll(location,speed){return;}
function touchmove(fingers){return;}
function textboxfocus(name){return;}
function touchstart(fingers){return;}
function touchend(fingers){return;}
function physicout(){return;}
function collisionout(){return;}
function togame(x){return;}
function stopgame(){Engine_gamerunning = false}
function rungame(){Engine_gamerunning = true}
function reloadgame(){location.reload()}
function clipboard(x){return navigator.clipboard.writeText(x);}
function getLanguage(){return navigator.language}
function getPlatform(){
   let tempgp ={
      platform:"IDK",
      fullplatform:navigator.platform
   }
   if(navigator.userAgent.match(/Android/i)){
      tempgp.platform = "Android"
   }else{
      if(navigator.userAgent.includes("Electron")){
      if(navigator.platform == "Win32" || navigator.platform == "Windows"){
         tempgp.platform = "Windows"
       }else if(navigator.platform === "Linux x86_64" || navigator.platform === "Linux i686" || navigator.platform === "Linux armv7l"){
         tempgp.platform = "Linux"
       }else if(navigator.platform === "MacIntel" || navigator.platform === "MacPPC"){
         tempgp.platform = "Macos"
       }
      }else{
         tempgp.platform = "Webbrowser"
      }
   }
   return tempgp
}
function sendengine(x){
   console.log(JSON.stringify({
              toengine: true,
              fullscreen:x.fullscreen,
              center:x.center,
              exit:x.exit,
              appresize: x.appresize && {
                  x:x.appresize && x.appresize.x,
                  y:x.appresize && x.appresize.y,
              },
              changestatusbar:x.changestatusbar,
              sendalertbox:x.sendalertbox,
              changescreenstatus:x.changescreenstatus,
              sendvibrate:x.sendvibrate && Number(x.sendvibrate),
              dbset:x.dbset && x.dbset.length == 2 && [x.dbset[0],x.dbset[1]],
              dbget:x.dbget,
              dbreset:x.dbreset,
              dbdel:x.dbdel,
              startpath:x.startpath
       }))
}

//Inputs
window.addEventListener("keydown",(event)=>{
if(Engine_enablekeyboard == false) return;keydown(event.key.toLocaleUpperCase(),{
key:event.key,alt:event.altKey,shift:event.shiftKey,ctrl:event.ctrlKey})
if(event.key == "Meta" || event.key == "Pause") togame({paused:true})
if(Engine_Forcepress.filter(z=>z.key === event.key).length) {
Engine_Forcepress = Engine_Forcepress.filter(z=>z.key != event.key.toLocaleUpperCase())}
Engine_Forcepress.push({xkey:event.key,key:event.key.toLocaleUpperCase(),alt:event.altKey,shift:event.shiftKey,ctrl:event.ctrlKey})
})
window.addEventListener("keyup",(event)=>{
if(Engine_enablekeyboard == false) return;keyup(event.key.toLocaleUpperCase(),
{key:event.key,alt:event.altKey,shift:event.shiftKey,ctrl:event.ctrlKey})
Engine_Forcepress = Engine_Forcepress.filter(z=>z.key != event.key.toLocaleUpperCase())
})
setInterval(() => Engine_Forcepress.map((x)=> keypress(x.key,{key:x.xkey,alt:x.alt,shift:x.shift,ctrl:x.ctrl}))
, Number(Engine_onload.forcepresstime));

//Mouse
window.addEventListener("wheel", function(event) {
 if (event.deltaY < 0) {mousescroll("up",event.deltaY);} else if (event.deltaY > 0) {mousescroll("down",event.deltaY);}
});
window.addEventListener("click", function (event) {
 if(Engine_enablemouse == false) return;
 Engine_mouselocation = {x:event.clientX,y:event.clientY,lastx:event.clientX,lasty:event.clientY}
 Engine_Components.sort((a, b) => Engine_db.get(b).layer- Engine_db.get(a).layer)
  Engine_Components.map((z) => {
    if(event.clicked) return;
    z = getData(z); if(!z) return;
    if (
      event.clientX/(window.innerWidth/Engine_canvas.width) >= z.position.x &&
      event.clientX/(window.innerWidth/Engine_canvas.width) <= z.position.x + z.scale.x &&
      event.clientY/(window.innerHeight/Engine_canvas.height) >= z.position.y &&
      event.clientY/(window.innerHeight/Engine_canvas.height) <= z.position.y + z.scale.y
    ) {event.clicked = true;
      event.component = {name:z.name,x:event.clientX-z.position.x,y:event.clientY-z.position.y}}
  });
  leftclicked({x:event.clientX,y:event.clientY},event.component|| false)
});

window.addEventListener('mousemove', function (event) {
   if(Engine_enablemouse == false) return;
   Engine_mouselocation = {...Engine_mouselocation,x:event.clientX,y:event.clientY}
    Engine_Components.sort((a, b) => Engine_db.get(b).layer- Engine_db.get(a).layer)
  Engine_Components.map((z) => {
    if(event.clicked) return;
    z = getData(z); if(!z) return;
    if (
      event.clientX/(window.innerWidth/Engine_canvas.width) >= z.position.x &&
      event.clientX/(window.innerWidth/Engine_canvas.width) <= z.position.x + z.scale.x &&
      event.clientY/(window.innerHeight/Engine_canvas.height) >= z.position.y &&
      event.clientY/(window.innerHeight/Engine_canvas.height) <= z.position.y + z.scale.y
    ) {event.clicked = true;
     event.component = {name:z.name,x:event.clientX-z.position.x,y:event.clientY-z.position.y}}
  });
  mousemove({x:event.clientX,y:event.clientY},event.component|| false)
})
window.addEventListener('touchmove', function (event) {
   if(Engine_enabletouch == false) return;
   event.toucheslist = []
   Engine_Components.sort((a, b) => Engine_db.get(b).layer- Engine_db.get(a).layer)
   for(var i=0; i<event.touches.length; i++) {
      Engine_Components.map((z) => {
        if(event.touches[i].clicked) return;
        z = getData(z); if(!z) return;
        if (
          event.touches[i].clientX/(window.innerWidth/Engine_canvas.width) >= z.position.x &&
          event.touches[i].clientX/(window.innerWidth/Engine_canvas.width) <= z.position.x + z.scale.x &&
          event.touches[i].clientY/(window.innerHeight/Engine_canvas.height) >= z.position.y &&
          event.touches[i].clientY/(window.innerHeight/Engine_canvas.height) <= z.position.y + z.scale.y
        ) {
         event.touches[i].clicked = true
         event.touches[i].component = {name:z.name,x:event.touches[i].clientX-z.position.x,y:event.touches[i].clientY-z.position.y};
}})
event.toucheslist.push({
   finger:i+1,
   x:event.touches[i].screenX,y:event.touches[i].screenY,
   component:event.touches[i].component || false})
};touchmove(event.toucheslist)
})
window.addEventListener('touchstart', function (event) {
   if(Engine_enabletouch == false) return;
   event.toucheslist = []
   Engine_Components.sort((a, b) => Engine_db.get(b).layer- Engine_db.get(a).layer)
   for(var i=0; i<event.touches.length; i++) {
      Engine_Components.map((z) => {
        if(event.touches[i].clicked) return;
        z = getData(z); if(!z) return;
        if (
          event.touches[i].clientX/(window.innerWidth/Engine_canvas.width) >= z.position.x &&
          event.touches[i].clientX/(window.innerWidth/Engine_canvas.width) <= z.position.x + z.scale.x &&
          event.touches[i].clientY/(window.innerHeight/Engine_canvas.height) >= z.position.y &&
          event.touches[i].clientY/(window.innerHeight/Engine_canvas.height) <= z.position.y + z.scale.y
        ) {
         event.touches[i].clicked = true
         event.touches[i].component = {name:z.name,x:event.touches[i].clientX-z.position.x,y:event.touches[i].clientY-z.position.y};
}})
event.toucheslist.push({
   finger:i+1,
   x:event.touches[i].screenX,y:event.touches[i].screenY,
   component:event.touches[i].component || false})
};touchstart(event.toucheslist)
})
window.addEventListener('touchend', function (event) {
      if(Engine_enabletouch == false) return;
      event.toucheslist = []
      Engine_Components.sort((a, b) => Engine_db.get(b).layer- Engine_db.get(a).layer)
      for(var i=0; i<event.changedTouches.length; i++) {
         Engine_Components.map((z) => {
           if(event.changedTouches[i].clicked) return;
           z = getData(z); if(!z) return;
           if (
             event.changedTouches[i].clientX/(window.innerWidth/Engine_canvas.width) >= z.position.x &&
             event.changedTouches[i].clientX/(window.innerWidth/Engine_canvas.width) <= z.position.x + z.scale.x &&
             event.changedTouches[i].clientY/(window.innerHeight/Engine_canvas.height) >= z.position.y &&
             event.changedTouches[i].clientY/(window.innerHeight/Engine_canvas.height) <= z.position.y + z.scale.y
           ) {
            event.changedTouches[i].clicked = true
            event.changedTouches[i].component = 
         {name:z.name,x:event.changedTouches[i].clientX-z.position.x,y:event.changedTouches[i].clientY-z.position.y};
   }})
   event.toucheslist.push({
      finger:i+1,
      x:event.changedTouches[i].screenX,y:event.changedTouches[i].screenY,
      component:event.changedTouches[i].component || false})
   };touchend(event.toucheslist)
})
window.addEventListener('mousedown', function (event) {
   if(Engine_enablemouse == false) return;
   Engine_mouselocation = {x:event.clientX,y:event.clientY,lastx:event.clientX,lasty:event.clientY}
   Engine_Components.sort((a, b) => Engine_db.get(b).layer- Engine_db.get(a).layer)
    Engine_Components.map((z) => {
      if(event.clicked) return;
      z = getData(z); if(!z) return;
      if (
        event.clientX/(window.innerWidth/Engine_canvas.width) >= z.position.x &&
        event.clientX/(window.innerWidth/Engine_canvas.width) <= z.position.x + z.scale.x &&
        event.clientY/(window.innerHeight/Engine_canvas.height) >= z.position.y &&
        event.clientY/(window.innerHeight/Engine_canvas.height) <= z.position.y + z.scale.y
      ) {event.clicked = true;
        event.component = {name:z.name,x:event.clientX-z.position.x,y:event.clientY-z.position.y}}
    });
    mousedown({x:event.clientX,y:event.clientY,button:event.buttons},event.component|| false)
})
 window.addEventListener('mouseup', function (event) {
   if(Engine_enablemouse == false) return;
   Engine_mouselocation = {x:event.clientX,y:event.clientY,lastx:event.clientX,lasty:event.clientY}
   Engine_Components.sort((a, b) => Engine_db.get(b).layer- Engine_db.get(a).layer)
    Engine_Components.map((z) => {
      if(event.clicked) return;
      z = getData(z); if(!z) return;
      if (
        event.clientX/(window.innerWidth/Engine_canvas.width) >= z.position.x &&
        event.clientX/(window.innerWidth/Engine_canvas.width) <= z.position.x + z.scale.x &&
        event.clientY/(window.innerHeight/Engine_canvas.height) >= z.position.y &&
        event.clientY/(window.innerHeight/Engine_canvas.height) <= z.position.y + z.scale.y
      ) {event.clicked = true;
        event.component = {name:z.name,x:event.clientX-z.position.x,y:event.clientY-z.position.y}}
    });
    mouseup({x:event.clientX,y:event.clientY,button:event.buttons},event.component|| false)
})
window.addEventListener('contextmenu', function(event) {
   event.preventDefault();
   if(Engine_enablemouse == false) return;
   Engine_mouselocation = {x:event.clientX,y:event.clientY,lastx:event.clientX,lasty:event.clientY}
   Engine_Components.sort((a, b) => Engine_db.get(b).layer- Engine_db.get(a).layer)
    Engine_Components.map((z) => {
      if(event.clicked) return;
      z = getData(z); if(!z) return;
      if (
        event.clientX/(window.innerWidth/Engine_canvas.width) >= z.position.x &&
        event.clientX/(window.innerWidth/Engine_canvas.width) <= z.position.x + z.scale.x &&
        event.clientY/(window.innerHeight/Engine_canvas.height) >= z.position.y &&
        event.clientY/(window.innerHeight/Engine_canvas.height) <= z.position.y + z.scale.y
      ) {event.clicked = true;
        event.component = {name:z.name,x:event.clientX-z.position.x,y:event.clientY-z.position.y}}
    });
    rightclicked({x:event.clientX,y:event.clientY},event.component|| false)
});


//Database
function Enginedataconnect(data){data.Engine_connected = true;Engine_database = data}
sendengine({dbget:true})
async function WaitDatabase(tempwd){if(!tempwd) tempwd = 7
while (!Engine_database.Engine_connected){
   if(tempwd < 1) return false
   tempwd--;
   await new Promise(resolve => setTimeout(resolve, 1000));
}
return true
}
function Database(act,obj,obj2){
   if(act == "get"){
      if(!Engine_database.Engine_connected) return {}
      return Engine_database[obj]
   }
   else if(act == "set" && obj && obj2){
      Engine_database[obj] = Engine_database[obj2]
      return sendengine({dbset:[obj,obj2]})
   }else if(act == "add" && !isNaN(Number(Engine_database[obj])) && !isNaN(Number(obj2))){
      Engine_database[obj] = Engine_database[obj] + obj2
      return sendengine({dbset:[obj,Engine_database[obj] + obj2]})
   }else if(act == "push" && Engine_database[obj] && Engine_database[obj].length){
      Engine_database[obj].push(obj2)
      return sendengine({dbset:[obj,Engine_database[obj]]})
   }else if (act == "delete" || act == "del" || act == "remove" && !obj2){
      return sendengine({dbdel:obj})
   }else if (act == "delete" || act == "del" || act == "remove" && !isNaN(Number(obj2))){
      Engine_database[obj] = Engine_database[obj] - obj2
      return sendengine({dbset:[obj,Engine_database[obj] - obj2]})
   }else if (act == "delete" || act == "del" || act == "remove" && obj2 && obj2.length){
      Engine_database[obj] = Engine_database[obj].filter(z => JSON.stringify(z) !== JSON.stringify(obj2));
      return sendengine({dbset:[obj,Engine_database[obj]]})
   }else if(act == "deleteall" || act == "reset"){
      return sendengine({dbreset:true})
   }
}

//Sound
function componentsound(sound,data,z,area){
data = getData(data)
z = getData(z)
z = Math.sqrt(Math.pow(data.position.x - z.position.x, 2) + Math.pow(data.position.y - z.position.y, 2))*(area || 1.5)
if (z > 1000) {z = 1000;} else if (z < 0) {z = 0;}
sound.volume = z = 1-(z/1000)
}

function autocomponentsound(set,sound,data,z,area){
   if(set == true){Engine_autocomponentsound.set(sound,setInterval(()=>componentsound(sound,data,z,area)))}else{
   clearInterval(Engine_autocomponentsound.get(sound))
   Engine_autocomponentsound.delete(sound)
}}

function autoshaders(set,player){
 if(set == true){Engine_Virtualshadowitems.push(player)}else{Engine_Virtualshadowitems = Engine_Virtualshadowitems.filter(z=>z != player)}
}

if(Engine_onload.autoshaders != 0){
setInterval(()=>{
   Engine_Virtualshadow.time += 1
   if(Engine_Virtualshadow.time == 24) Engine_Virtualshadow.time = 0
   Engine_Virtualshadowitems.map((x)=>{
      x = getData(x)
      if(!x.shadow.color) x.shadow.color = Engine_Virtualshadow.color
     x.shadow.x = -((x.scale.x*Engine_Virtualshadow.width)/100)*((Engine_Virtualshadow.time-12)/12)
     x.shadow.y = ((x.scale.y*Engine_Virtualshadow.height)/100)*Math.abs((Engine_Virtualshadow.time-12))/12
   })
},Engine_onload.autoshaders)
}
