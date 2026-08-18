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
console.log("Electoria Engine\nEngine Started");

var Engine_db = new Map();
var tempDatabase = new Map();
var Engine_canvas = document.getElementById("canvas");
const Engine_c = Engine_canvas.getContext('2d');
var Engine_Forcepress = [];
var Engine_background = "";
var Engine_allbackgrounds = "";
var Engine_splitelimit = 1;
var Engine_backgroundlength = 0;
var Engine_backgroundlocation = {};
var Engine_enablemouse = true;
var Engine_enablekeyboard = true;
var Engine_enabletouch = true;
var Engine_allnames = [];
var Engine_mouselocation = {};
var Engine_database = {};
var Engine_autocomponentsound = new Map();
var Engine_gamerunning = true;
var Enginefpsupdatetasks = [];
var Engine_Virtualshadow = {
   time: 0,
   height: 5,
   width: 5,
   color: "rgba(0, 0, 0, 0.5)"
};
var Engine_Virtualshadowitems = [];
var Engine_stablefps = "";
var Engine_backgroundcolor = "black";
var Engine_hasbeenstoped_fps = "";
var Engine_hasbeenstoped_tick = "";
var Engine_monitorhz = 0;
var Engine_autofps = typeof Engine_onload !== "undefined" && Engine_onload.fps === "auto";
var Engine_autotick = typeof Engine_onload !== "undefined" && Engine_onload.tickrate === "auto";
var Engine_nowfps = 0;
var Engine_nowtick = 0;

// --- Optimizations & New Features ---
var Engine_layerDirty = true;
var Engine_ImageCache = new Map();
var Engine_lastTickTime = performance.now();
var Engine_deltaTime = 16.667;
var Engine_dtFactor = 1;

// Image Cache Helper
function Engine_getImage(id) {
   if (!id) return null;
   let img = Engine_ImageCache.get(id);
   if (!img) {
      img = document.getElementById(id);
      if (img) Engine_ImageCache.set(id, img);
   }
   return img;
}

// Pre-cache DOM images once loaded
function Engine_initImageCache() {
   try {
      const domImages = document.querySelectorAll("#images img, #backgrounds img");
      domImages.forEach(img => {
         if (img.id) Engine_ImageCache.set(img.id, img);
      });
   } catch (e) {}
}
if (document.readyState === "loading") {
   document.addEventListener("DOMContentLoaded", Engine_initImageCache);
} else {
   Engine_initImageCache();
}

// Dirty-Flag Layer Sorting Helper
function Engine_sortLayers() {
   if (!Engine_layerDirty) return;
   Engine_allnames.sort((a, b) => {
      const da = Engine_db.get(a);
      const db = Engine_db.get(b);
      const la = da && typeof da.layer === "number" ? da.layer : 100;
      const lb = db && typeof db.layer === "number" ? db.layer : 100;
      return la - lb;
   });
   Engine_layerDirty = false;
}

// Spatial Hash Grid for Broadphase Collision Detection (150px cells)
class SpatialHashGrid {
   constructor(cellSize = 150) {
      this.cellSize = cellSize;
      this.grid = new Map();
   }
   clear() {
      this.grid.clear();
   }
   _key(cx, cy) {
      return cx + ":" + cy;
   }
   insert(entity) {
      if (!entity || !entity.position || !entity.scale) return;
      const startX = Math.floor(entity.position.x / this.cellSize);
      const endX = Math.floor((entity.position.x + entity.scale.x) / this.cellSize);
      const startY = Math.floor(entity.position.y / this.cellSize);
      const endY = Math.floor((entity.position.y + entity.scale.y) / this.cellSize);
      for (let x = startX; x <= endX; x++) {
         for (let y = startY; y <= endY; y++) {
            const key = this._key(x, y);
            let list = this.grid.get(key);
            if (!list) {
               list = [];
               this.grid.set(key, list);
            }
            list.push(entity.name);
         }
      }
   }
   getPotentialColliders(entity) {
      if (!entity || !entity.position || !entity.scale) return [];
      const startX = Math.floor(entity.position.x / this.cellSize);
      const endX = Math.floor((entity.position.x + entity.scale.x) / this.cellSize);
      const startY = Math.floor(entity.position.y / this.cellSize);
      const endY = Math.floor((entity.position.y + entity.scale.y) / this.cellSize);
      const candidates = new Set();
      for (let x = startX; x <= endX; x++) {
         for (let y = startY; y <= endY; y++) {
            const list = this.grid.get(this._key(x, y));
            if (list) {
               for (let i = 0; i < list.length; i++) {
                  if (list[i] !== entity.name) candidates.add(list[i]);
               }
            }
         }
      }
      return Array.from(candidates);
   }
}
var Engine_spatialGrid = new SpatialHashGrid(150);

// Global 2D Camera System
var Camera = {
   x: 0,
   y: 0,
   target: null,
   lerpSpeed: 0.1,
   zoomLevel: 1,
   shakeTimer: 0,
   shakeDuration: 0,
   shakeIntensity: 0,
   shakeOffset: { x: 0, y: 0 },
   minX: null,
   minY: null,
   maxX: null,
   maxY: null,
   follow: function(targetName, lerpSpeed = 0.1) {
      this.target = targetName;
      this.lerpSpeed = lerpSpeed;
   },
   shake: function(intensity = 10, durationMs = 500) {
      this.shakeIntensity = intensity;
      this.shakeDuration = durationMs;
      this.shakeTimer = durationMs;
   },
   zoom: function(level = 1) {
      this.zoomLevel = Math.max(0.1, Math.min(level, 10));
   },
   bounds: function(minX, minY, maxX, maxY) {
      this.minX = minX;
      this.minY = minY;
      this.maxX = maxX;
      this.maxY = maxY;
   },
   toWorld: function(screenX, screenY) {
      const cx = Engine_canvas.width / 2;
      const cy = Engine_canvas.height / 2;
      const worldX = (screenX - cx) / this.zoomLevel + this.x + cx - this.shakeOffset.x;
      const worldY = (screenY - cy) / this.zoomLevel + this.y + cy - this.shakeOffset.y;
      return { x: worldX, y: worldY };
   },
   toScreen: function(worldX, worldY) {
      const cx = Engine_canvas.width / 2;
      const cy = Engine_canvas.height / 2;
      const screenX = (worldX - this.x - cx + this.shakeOffset.x) * this.zoomLevel + cx;
      const screenY = (worldY - this.y - cy + this.shakeOffset.y) * this.zoomLevel + cy;
      return { x: screenX, y: screenY };
   },
   update: function(dt = 16.667) {
      if (this.target) {
         const tData = getData(this.target);
         if (tData && tData.position) {
            const targetCenterX = tData.position.x + (tData.scale ? tData.scale.x / 2 : 0) - (Engine_canvas.width / 2);
            const targetCenterY = tData.position.y + (tData.scale ? tData.scale.y / 2 : 0) - (Engine_canvas.height / 2);
            this.x += (targetCenterX - this.x) * this.lerpSpeed;
            this.y += (targetCenterY - this.y) * this.lerpSpeed;
         }
      }
      if (this.minX !== null && this.x < this.minX) this.x = this.minX;
      if (this.maxX !== null && this.x > this.maxX) this.x = this.maxX;
      if (this.minY !== null && this.y < this.minY) this.y = this.minY;
      if (this.maxY !== null && this.y > this.maxY) this.y = this.maxY;
      if (this.shakeTimer > 0) {
         this.shakeTimer -= dt;
         const progress = Math.max(0, this.shakeTimer / this.shakeDuration);
         const currentIntensity = this.shakeIntensity * progress;
         this.shakeOffset.x = (Math.random() * 2 - 1) * currentIntensity;
         this.shakeOffset.y = (Math.random() * 2 - 1) * currentIntensity;
         if (this.shakeTimer <= 0) {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
         }
      } else {
         this.shakeOffset.x = 0;
         this.shakeOffset.y = 0;
      }
   }
};

editdisplay(window.innerWidth, window.innerHeight);

class Text {
   constructor(newdata) {
      if (!newdata || !newdata.name || !newdata.position || !newdata.position.hasOwnProperty('x') || !newdata.position.hasOwnProperty('y')) return;
      newdata.type = "text";
      if (newdata.shadow) {
         newdata.shadow.status = newdata.shadow.status === true;
         if (!newdata.shadow.x) newdata.shadow.x = "";
         if (!newdata.shadow.y) newdata.shadow.y = "";
         if (!newdata.shadow.blur) newdata.shadow.blur = "";
         if (!newdata.shadow.color) newdata.shadow.color = "";
      } else {
         newdata.shadow = {
            status: false,
            color: "",
            blur: "",
            x: "",
            y: ""
         };
      }
      if (newdata.rotate && isNaN(Number(newdata.rotate))) newdata.rotate = 0;
      if (newdata.rotate && !isNaN(Number(newdata.rotate))) newdata.rotate = Number(newdata.rotate) * Math.PI / 180;
      if (!newdata.layer) newdata.layer = 100;
      if (!newdata.size) newdata.size = "30px";
      if (!newdata.font) newdata.font = "Arial";
      if (!newdata.opacity) newdata.opacity = 1;
      Engine_db.set(newdata.name, newdata);
      Engine_allnames.push(newdata.name);
      Engine_layerDirty = true;
      this.name = newdata.name;
      if (newdata.eval) { try { eval(newdata.eval + "(" + JSON.stringify(newdata) + "," + "1" + ")"); } catch {} }
   }
   update(updatedata) { updatedata.name = this.name; updateData(updatedata); }
   remove() { removeData(this.name); }
   get() { return getData(this.name); }
}

class Component {
   constructor(newdata) {
      if (!newdata || !newdata.name || Engine_splitelimit > Number(typeof Engine_onload !== "undefined" ? Engine_onload.splitelimit || 20000 : 20000)
         || !newdata.position || !newdata.position.hasOwnProperty('x') || !newdata.position.hasOwnProperty('y')) return;
      newdata.type = "component";
      Engine_splitelimit++;
      if (newdata.physic) {
         newdata.physic.status = newdata.physic.status === true;
         if (!newdata.physic.x) newdata.physic.x = 0;
         if (!newdata.physic.y) newdata.physic.y = 0;
         if (!newdata.physic.gravity) newdata.physic.gravity = "";
         if (!newdata.physic.xfriction) newdata.physic.xfriction = "";
         if (!newdata.physic.yfriction) newdata.physic.yfriction = "";
      } else {
         newdata.physic = {
            status: false,
            x: 0,
            y: 0,
            gravity: "",
            xfriction: "",
            yfriction: ""
         };
      }
      if (newdata.image && !newdata.hasOwnProperty('rotate')) newdata.rotate = 0;
      if (newdata.rotate && isNaN(Number(newdata.rotate))) newdata.rotate = 0;
      if (newdata.rotate && !isNaN(Number(newdata.rotate))) newdata.rotate = Number(newdata.rotate) * Math.PI / 180;
      if (newdata.shadow) {
         newdata.shadow.status = newdata.shadow.status === true;
         if (!newdata.shadow.x) newdata.shadow.x = "";
         if (!newdata.shadow.y) newdata.shadow.y = "";
         if (!newdata.shadow.blur) newdata.shadow.blur = "";
         if (!newdata.shadow.color) newdata.shadow.color = "";
      } else {
         newdata.shadow = {
            status: false,
            color: "",
            blur: "",
            x: "",
            y: ""
         };
      }
      if (newdata.hasOwnProperty('animate')) { newdata.animatedata = { time: 0, val: 0 }; }
      if (!newdata.stype) newdata.stype = "fillrect";
      if (!newdata.layer) newdata.layer = 100;
      if (!newdata.opacity) newdata.opacity = 1;
      Engine_db.set(newdata.name, newdata);
      Engine_allnames.push(newdata.name);
      Engine_layerDirty = true;
      this.name = newdata.name;
      if (newdata.eval) { try { eval(newdata.eval + "(" + JSON.stringify(newdata) + "," + "1" + ")"); } catch {} }
   }
   update(updatedata) { updatedata.name = this.name; updateData(updatedata); }
   remove() { removeData(this.name); }
   get() { return getData(this.name); }
}

class Textbox {
   constructor(newdata) {
      if (!newdata || !newdata.name || !newdata.position || !newdata.position.hasOwnProperty('x') || !newdata.position.hasOwnProperty('y')) return;
      if (!newdata.scale) newdata.scale = { x: "auto", y: "auto" };
      var textbox = document.createElement("input");
      textbox.style.position = 'absolute';
      if (typeof newdata.position.x === "number") newdata.position.x = newdata.position.x + "px";
      if (typeof newdata.position.y === "number") newdata.position.y = newdata.position.y + "px";
      textbox.style.left = newdata.position.x;
      textbox.style.top = newdata.position.y;
      textbox.style.width = newdata.scale.x;
      textbox.style.height = newdata.scale.y;
      textbox.style.zIndex = newdata.layer || "9999";
      textbox.placeholder = newdata.placeholder || "";
      textbox.id = newdata.name;
      textbox.value = newdata.value || "";
      textbox.addEventListener("keydown", function(event) {
         if (event.key === "Enter") {
            event.data = event.target.value;
            try { eval(getData(newdata.name).eval || ""); } catch {}
            if (getData(newdata.name).removeable) removeData(newdata.name);
         }
      });
      textbox.addEventListener("focus", () => textboxfocus(newdata.name));
      const screenEl = document.getElementById("screen") || document.body;
      screenEl.appendChild(textbox);
      if (newdata.focus) textbox.focus();
      newdata.type = "textbox";
      Engine_db.set(newdata.name, newdata);
      Engine_allnames.push(newdata.name);
      Engine_layerDirty = true;
      this.name = newdata.name;
   }
   update(updatedata) { updatedata.name = this.name; updateData(updatedata); }
   remove() { removeData(this.name); }
   get() { return getData(this.name); }
}

class Video {
   constructor(newdata) {
      if (!newdata || !newdata.name || !newdata.position || !newdata.position.hasOwnProperty('x') || !newdata.position.hasOwnProperty('y')) return;
      if (!newdata.scale) newdata.scale = { x: "auto", y: "auto" };
      var video = document.createElement('video');
      video.style.position = 'absolute';
      if (typeof newdata.position.x === "number") newdata.position.x = newdata.position.x + "px";
      if (typeof newdata.position.y === "number") newdata.position.y = newdata.position.y + "px";
      video.style.left = newdata.position.x;
      video.style.top = newdata.position.y;
      video.style.width = newdata.scale.x;
      video.style.height = newdata.scale.y;
      video.style.zIndex = newdata.layer || "9999";
      video.id = newdata.name;
      video.src = newdata.video;
      video.muted = newdata.muted || false;
      video.loop = newdata.loop || false;
      video.volume = newdata.volume || 1;
      if (newdata.hasOwnProperty('autoplay')) { video.autoplay = newdata.autoplay; } else { video.autoplay = true; }
      const screenEl = document.querySelector('#screen') || document.body;
      screenEl.appendChild(video);
      video.addEventListener("ended", function() {
         try { eval(getData(newdata.name).eval || ""); } catch {}
         if (getData(newdata.name).removeable) removeData(newdata.name);
      });
      newdata.type = "video";
      Engine_db.set(newdata.name, newdata);
      Engine_allnames.push(newdata.name);
      Engine_layerDirty = true;
      this.name = newdata.name;
   }
   update(updatedata) { updatedata.name = this.name; updateData(updatedata); }
   remove() { removeData(this.name); }
   get() { return getData(this.name); }
}

function updateData(updatedata) {
   if (!updatedata || !updatedata.name) return;
   let data = Engine_db.get(updatedata.name);
   if (!data) return;
   if (data.type === "textbox" || data.type === "video") {
      if (updatedata.position && updatedata.position.hasOwnProperty('x')) {
         if (typeof updatedata.position.x === "number") updatedata.position.x = updatedata.position.x + "px";
         data.position.x = updatedata.position.x;
      }
      if (updatedata.position && updatedata.position.hasOwnProperty('y')) {
         if (typeof updatedata.position.y === "number") updatedata.position.y = updatedata.position.y + "px";
         data.position.y = updatedata.position.y;
      }
      if (updatedata.scale && updatedata.scale.hasOwnProperty('x')) data.scale.x = updatedata.scale.x;
      if (updatedata.scale && updatedata.scale.hasOwnProperty('y')) data.scale.y = updatedata.scale.y;
      if (updatedata.hasOwnProperty('layer')) { data.layer = updatedata.layer; Engine_layerDirty = true; }
      if (updatedata.hasOwnProperty('eval')) data.eval = updatedata.eval;
      if (updatedata.hasOwnProperty("removeable")) data.removeable = updatedata.removeable;
      if (data.type === "textbox") {
         if (updatedata.hasOwnProperty('placeholder')) data.placeholder = updatedata.placeholder;
         if (updatedata.hasOwnProperty('value')) data.value = updatedata.value;
      } else if (data.type === "video") {
         if (updatedata.hasOwnProperty('autoplay')) data.autoplay = updatedata.autoplay;
         if (updatedata.hasOwnProperty('muted')) data.muted = updatedata.muted;
         if (updatedata.hasOwnProperty('video')) data.video = updatedata.video;
         if (updatedata.hasOwnProperty('volume')) data.volume = updatedata.volume;
         if (updatedata.hasOwnProperty('loop')) data.loop = updatedata.loop;
      }
      try {
         var obj = document.getElementById(updatedata.name);
         if (obj) {
            obj.style.position = 'absolute';
            obj.style.left = data.position.x;
            obj.style.top = data.position.y;
            obj.style.width = data.scale.x;
            obj.style.height = data.scale.y;
            obj.style.zIndex = data.layer;
            if (data.type === "textbox") {
               obj.placeholder = data.placeholder || "";
               obj.value = data.value || "";
               if (updatedata.focus) obj.focus();
            } else if (data.type === "video") {
               obj.src = data.video;
               obj.autoplay = data.autoplay;
               obj.muted = data.muted;
               obj.loop = data.loop;
               obj.volume = data.volume;
            }
         }
      } catch {}
      Engine_db.set(data.name, data);
      return;
   }
   if (updatedata.shadow) {
      if (updatedata.shadow.status === false) { data.shadow.status = false; }
      else if (updatedata.shadow.status === true) { data.shadow.status = true; }
      if (updatedata.shadow.hasOwnProperty('color')) data.shadow.color = updatedata.shadow.color;
      if (updatedata.shadow.hasOwnProperty('blur')) data.shadow.blur = Number(updatedata.shadow.blur);
      if (updatedata.shadow.hasOwnProperty('x')) data.shadow.x = Number(updatedata.shadow.x);
      if (updatedata.shadow.hasOwnProperty('y')) data.shadow.y = Number(updatedata.shadow.y);
   }
   if (updatedata.hasOwnProperty('layer')) { data.layer = updatedata.layer; Engine_layerDirty = true; }
   if (updatedata.hasOwnProperty('color')) data.color = updatedata.color;
   if (updatedata.hasOwnProperty('rotate') && !isNaN(Number(updatedata.rotate))) data.rotate = Number(updatedata.rotate) * Math.PI / 180;
   if (updatedata.hasOwnProperty("backgroundposition")) data.backgroundposition = updatedata.backgroundposition;
   if (data.type === "text") {
      if (updatedata.hasOwnProperty('size')) data.size = updatedata.size;
      if (updatedata.hasOwnProperty('font')) data.font = updatedata.font;
      if (updatedata.hasOwnProperty('text')) data.text = updatedata.text;
      if (updatedata.text === false) data.text = "";
      if (updatedata.position) {
         if (updatedata.position.hasOwnProperty('x')) {
            if (typeof updatedata.position.x === "string" && (updatedata.position.x.includes("+") || updatedata.position.x.includes("-"))) {
               data.position.x = data.position.x + Number(updatedata.position.x);
            } else data.position.x = Number(updatedata.position.x);
         }
         if (updatedata.position.hasOwnProperty('y')) {
            if (typeof updatedata.position.y === "string" && (updatedata.position.y.includes("+") || updatedata.position.y.includes("-"))) {
               data.position.y = data.position.y + Number(updatedata.position.y);
            } else data.position.y = Number(updatedata.position.y);
         }
      }
   } else if (data.type === "component") {
      if (updatedata.hasOwnProperty('notick')) data.notick = updatedata.notick;
      if (updatedata.hasOwnProperty("collision")) data.collision = updatedata.collision;
      if (updatedata.inscreen === false || updatedata.inscreen) data.inscreen = updatedata.inscreen;
      if (updatedata.position) {
         if (updatedata.position.hasOwnProperty('x')) {
            if (typeof updatedata.position.x === "string" && (updatedata.position.x.includes("+") || updatedata.position.x.includes("-"))) {
               data.position.x = data.position.x + Number(updatedata.position.x);
            } else data.position.x = Number(updatedata.position.x);
         }
         if (updatedata.position.hasOwnProperty('y')) {
            if (typeof updatedata.position.y === "string" && (updatedata.position.y.includes("+") || updatedata.position.y.includes("-"))) {
               data.position.y = data.position.y + Number(updatedata.position.y);
            } else data.position.y = Number(updatedata.position.y);
         }
      }
      if (updatedata.scale) {
         if (updatedata.scale.hasOwnProperty('x')) data.scale.x = Number(updatedata.scale.x);
         if (updatedata.scale.hasOwnProperty('y')) data.scale.y = Number(updatedata.scale.y);
      }
      if (updatedata.physic) {
         if (updatedata.physic.hasOwnProperty('status')) data.physic.status = updatedata.physic.status;
         if (updatedata.physic.hasOwnProperty('x')) {
            if (typeof updatedata.physic.x === "string" && (updatedata.physic.x.includes("+") || updatedata.physic.x.includes("-"))) {
               data.physic.x = data.physic.x + Number(updatedata.physic.x);
            } else data.physic.x = Number(updatedata.physic.x);
         }
         if (updatedata.physic.hasOwnProperty('y')) {
            if (typeof updatedata.physic.y === "string" && (updatedata.physic.y.includes("+") || updatedata.physic.y.includes("-"))) {
               data.physic.y = data.physic.y + Number(updatedata.physic.y);
            } else data.physic.y = Number(updatedata.physic.y);
         }
         if (updatedata.physic.hasOwnProperty('gravity')) data.physic.gravity = Number(updatedata.physic.gravity);
         if (updatedata.physic.hasOwnProperty('xfriction')) data.physic.xfriction = Number(updatedata.physic.xfriction);
         if (updatedata.physic.hasOwnProperty('yfriction')) data.physic.yfriction = Number(updatedata.physic.yfriction);
      }
      if (updatedata.hasOwnProperty('animate')) {
         data.animate = updatedata.animate;
         data.animatedata = { time: 0, val: 0 };
      }
      if (updatedata.hasOwnProperty('reverse')) data.reverse = updatedata.reverse;
      if (updatedata.image === false) { data.image = ""; }
      else if (updatedata.image) {
         data.image = updatedata.image;
         data.rotate = 0;
      }
      if (updatedata.stype) data.stype = updatedata.stype;
      if (data.image && data.stype) {
         if (data.stype === "fillarc" || data.stype === "fa"
            || data.stype === "strokearc" || data.stype === "sa" || data.stype.split("strokearc").length !== 2) data.stype = "fr";
      }
   }
   if (updatedata.hasOwnProperty('opacity')) data.opacity = updatedata.opacity;
   if (updatedata.hasOwnProperty('eval')) data.eval = updatedata.eval;
   if (data.eval) {
      try { eval(data.eval + "(" + JSON.stringify(data) + "," + "2" + ")"); } catch {}
   }
   Engine_db.set(updatedata.name, data);
}

function getData(name) {
   if (!name) return;
   return Engine_db.get(name);
}

function removeData(name) {
   if (!name) return;
   try {
      const obj = Engine_db.get(name);
      if (obj && (obj.type === "textbox" || obj.type === "video")) {
         Engine_db.delete(name);
         const el = document.getElementById(name);
         if (el) el.remove();
         Engine_allnames = Engine_allnames.filter((z) => z !== name);
         Engine_layerDirty = true;
         return;
      }
   } catch {}
   Engine_db.delete(name);
   Engine_allnames = Engine_allnames.filter((z) => z !== name);
   Engine_splitelimit += -1;
   Engine_layerDirty = true;
}

try {
   Engine_allbackgrounds = document.querySelectorAll("#backgrounds img");
   if (Engine_allbackgrounds.length > 0) {
      Engine_background = Engine_allbackgrounds[0].id;
      if (Engine_allbackgrounds.length > 1) {
         var Engine_BackgroundInterval = setInterval(() => {
            Engine_backgroundlength++;
            if (Engine_allbackgrounds.length <= Engine_backgroundlength) Engine_backgroundlength = 0;
            Engine_background = Engine_allbackgrounds[Engine_backgroundlength].id;
         }, Number(typeof Engine_onload !== "undefined" ? Engine_onload.backgroundspeed || 250 : 250));
      }
   }
} catch {}

// Physics with Delta-Time Normalization
function physicengine(data, dtFactor = Engine_dtFactor) {
   if (!data || !data.physic || !data.physic.status) return;

   // Vertical boundaries & gravity
   if (data.position.y + data.scale.y + data.physic.y >= Engine_canvas.height && data.inscreen ||
       data.inscreen && data.position.y + data.physic.y < 0) {
      if (Engine_canvas.height - data.position.y - data.scale.y < 0 && data.physic.y < 1 && data.physic.locky === 1) {
         data.physic.y = 0;
      } else {
         data.physic.locky = 1;
         physicout(data.name, {
            top: data.inscreen && data.position.y + data.physic.y < 0,
            bottom: data.position.y + data.scale.y + data.physic.y >= Engine_canvas.height
         });
         const yFric = data.physic.yfriction !== "" ? Number(data.physic.yfriction) : Number(typeof Engine_onload !== "undefined" ? Engine_onload.yfriction || 0.5 : 0.5);
         data.physic.y = -data.physic.y * yFric;
      }
   } else if (!data.physic.flocky) {
      const grav = data.physic.gravity !== "" ? Number(data.physic.gravity) : Number(typeof Engine_onload !== "undefined" ? Engine_onload.gravity || 0.9 : 0.9);
      data.physic.y += grav * dtFactor;
      data.physic.locky = false;
      physicout(data.name, { flying: true });
   }

   // Horizontal boundaries & friction
   if ((data.position.x + data.scale.x + data.physic.x >= Engine_canvas.width && data.inscreen) ||
       (data.inscreen && data.position.x + data.physic.x < 0)) {
      physicout(data.name, {
         right: data.position.x + data.scale.x + data.physic.x >= Engine_canvas.width,
         left: data.inscreen && data.position.x + data.physic.x < 0
      });
      const xFric = data.physic.xfriction !== "" ? Number(data.physic.xfriction) : Number(typeof Engine_onload !== "undefined" ? Engine_onload.xfriction || 0.08 : 0.08);
      data.physic.x = -data.physic.x * (1 - xFric);
   } else {
      if ((data.physic.x > 0.001 && data.physic.x < 1) || (data.physic.x < -0.001 && data.physic.x > -1)) {
         data.physic.x = 0;
         physicout(data.name, { friction: true });
      } else {
         const xFric = data.physic.xfriction !== "" ? Number(data.physic.xfriction) : Number(typeof Engine_onload !== "undefined" ? Engine_onload.xfriction || 0.08 : 0.08);
         data.physic.x += data.physic.x * -xFric * dtFactor;
      }
   }

   data.position.x += data.physic.x * dtFactor;
   data.position.y += data.physic.y * dtFactor;
   Engine_db.set(data.name, data);
}

function findSide(data, z, tempdata) {
   tempdata.dx = (data.position.x + data.scale.x / 2) - (z.position.x + z.scale.x / 2);
   tempdata.dy = (data.position.y + data.scale.y / 2) - (z.position.y + z.scale.y / 2);
   tempdata.width = (data.scale.x + z.scale.x) / 2;
   tempdata.height = (data.scale.y + z.scale.y) / 2;
   tempdata.crossWidth = tempdata.width * tempdata.dy;
   tempdata.crossHeight = tempdata.height * tempdata.dx;
   tempdata.output = "";
   if (Math.abs(tempdata.dx) <= tempdata.width && Math.abs(tempdata.dy) <= tempdata.height) {
      if (tempdata.crossWidth > tempdata.crossHeight) {
         tempdata.output = (tempdata.crossWidth > -tempdata.crossHeight) ? 'bottom' : 'left';
      } else {
         tempdata.output = (tempdata.crossWidth > -tempdata.crossHeight) ? 'right' : 'top';
      }
   } else if (Math.abs(tempdata.dx) <= tempdata.width) {
      tempdata.output = tempdata.dx < 0 ? 'right' : 'left';
   } else if (Math.abs(tempdata.dy) <= tempdata.height) {
      tempdata.output = tempdata.dy < 0 ? 'bottom' : 'top';
   }
   return tempdata;
}

// Spatial-partitioned collision checking
function findcollision(data) {
   if (!data || !data.collision || !data.position || !data.scale) return;
   const candidates = Engine_spatialGrid.getPotentialColliders(data);

   for (let i = 0; i < candidates.length; i++) {
      let zName = candidates[i];
      let z = getData(zName);
      if (!z || !z.collision || z.name === data.name || !z.position || !z.scale) continue;

      if (
         data.position.y + data.scale.y >= z.position.y &&
         data.position.y <= z.position.y + z.scale.y &&
         data.position.x + data.scale.x >= z.position.x &&
         data.position.x <= z.position.x + z.scale.x
      ) {
         let fside = findSide(data, z, {});
         if (fside.output === "top") {
            collisionout(data.name, z.name, "top", fside);
            if (data.collision === 3) continue;
            if (data.inscreen && data.position.y < 0) {
               z.position.y = data.scale.y + 1;
               data.position.y = 0;
               continue;
            }
            if (data.inscreen && z.scale.y + z.position.y > Engine_canvas.height) {
               z.position.y = Engine_canvas.height - z.scale.y;
               data.position.y = z.position.y - data.scale.y - 1;
               continue;
            }
            if (data.physic && data.physic.status) {
               data.physic.y = -data.physic.y * Number(typeof Engine_onload !== "undefined" ? Engine_onload.yfriction || 0.5 : 0.5);
               data.position.y = z.position.y - data.scale.y;
               if (data.inscreen && data.position.y < 0) {
                  z.position.y = data.scale.y + 1;
                  data.position.y = 0;
                  continue;
               }
               data.physic.flocky = true;
            } else if (data.physic && data.physic.status === false) {
               if (data.collision === 2) {
                  data.position.y = z.position.y - data.scale.y - (z.physic && z.physic.status && z.physic.y || 0);
               } else {
                  z.position.y = data.position.y + data.scale.y - (z.physic && z.physic.status && z.physic.y || 0);
               }
            }
         } else if (fside.output === "right") {
            collisionout(data.name, z.name, "right", fside);
            if (data.collision === 3) continue;
            if (data.inscreen && data.scale.x + z.position.x + z.scale.x > Engine_canvas.width) {
               data.position.x = Engine_canvas.width - data.scale.x;
               z.position.x = data.position.x - z.scale.x;
               if (z.physic && z.physic.status && z.physic.x) z.physic.x = -z.physic.x;
            } else if (data.inscreen && z.position.x < 0) {
               z.position.x = 0;
               data.position.x = z.scale.x;
               if (data.physic && data.physic.status && data.physic.x) data.physic.x = -data.physic.x;
            } else {
               if (z.physic && z.physic.status && data.physic) {
                  if (data.physic.x && data.physic.x < 0) {
                     data.position.x = z.position.x + z.scale.x;
                     if (z.collision === 2) {
                        if (z.physic.x === 0) {
                           var tempdata = z.physic.x;
                           z.physic.x = data.physic.x;
                           data.physic.x = tempdata;
                        } else z.physic.x = data.physic.x * 1.01;
                     } else { data.physic.x = -data.physic.x; }
                  } else {
                     z.position.x = data.position.x - z.scale.x;
                     if (data.collision === 2) {
                        if (z.physic.x === 0) {
                           var tempdata = data.physic.x;
                           data.physic.x = z.physic.x;
                           z.physic.x = tempdata;
                        } else data.physic.x = z.physic.x * 1.01;
                     } else { z.physic.x = -z.physic.x; }
                  }
               } else {
                  data.position.x = z.position.x + z.scale.x;
                  if (data.physic && data.physic.status && data.physic.x) data.physic.x = -data.physic.x;
               }
            }
         } else if (fside.output === "bottom") {
            collisionout(data.name, z.name, "bottom", fside);
         } else if (fside.output === "left") {
            collisionout(data.name, z.name, "left", fside);
         }
      } else {
         if (data.physic && data.physic.status) { data.physic.flocky = false; }
      }
   }
   Engine_db.set(data.name, data);
}

function animatemanager(data) {
   data.animatedata.time++;
   if (data.animate[data.animatedata.val].time < data.animatedata.time) {
      data.animatedata.time = 0;
      data.animatedata.val = data.animatedata.val + 1;
      if (data.animatedata.val === data.animate.length) {
         data.animatedata.val = 0;
         animateout(data.name, data.animate);
      }
   }
   const img = Engine_getImage(data.animate[data.animatedata.val].image);
   if (img) {
      Engine_c.drawImage(
         img,
         data.animate[data.animatedata.val].position.x,
         data.animate[data.animatedata.val].position.y,
         data.animate[data.animatedata.val].scale.x,
         data.animate[data.animatedata.val].scale.y,
         data.position.x,
         data.position.y,
         data.scale.x,
         data.scale.y
      );
   }
   if (data.hasOwnProperty('rotate') || data.reverse) {
      Engine_c.restore();
   }
   Engine_db.set(data.name, data);
}

if (typeof Engine_onload !== "undefined" && Engine_onload.fps !== "auto" && Engine_onload.fps !== "vsync" && !isNaN(Number(Engine_onload.fps))) {
   Engine_updatefps(Engine_onload.fps);
}

function Engine_updatefps(x) {
   clearInterval(Engine_stablefps);
   Engine_stablefps = setInterval(() => backgroundupdate(), 1000 / Number(x));
}

function stopgame() {
   Engine_hasbeenstoped_fps = updateData;
   Engine_hasbeenstoped_tick = nextick;
   nextick = function() {};
   updateData = function() {};
}

function rungame() {
   if (Engine_hasbeenstoped_fps) {
      updateData = Engine_hasbeenstoped_fps;
      nextick = Engine_hasbeenstoped_tick;
      Engine_hasbeenstoped_tick = "";
      Engine_hasbeenstoped_fps = "";
   }
}

function editdisplay(x, y) {
   Engine_canvas.width = x;
   Engine_canvas.height = y;
   backgroundupdate();
}

function nextick() {
   Engine_nowtick++;

   // Compute delta time
   const now = performance.now();
   Engine_deltaTime = Math.min(now - Engine_lastTickTime, 100);
   Engine_lastTickTime = now;
   Engine_dtFactor = Engine_deltaTime / 16.6667;

   // Update layers only when dirty
   Engine_sortLayers();

   // Rebuild spatial grid for collision broadphase
   Engine_spatialGrid.clear();
   for (let i = 0; i < Engine_allnames.length; i++) {
      let data = Engine_db.get(Engine_allnames[i]);
      if (data && data.collision && !data.notick) {
         Engine_spatialGrid.insert(data);
      }
   }

   // Physics & Collision passes
   for (let i = 0; i < Engine_allnames.length; i++) {
      let data = Engine_db.get(Engine_allnames[i]);
      if (!data || data.notick) continue;
      if (data.physic && data.physic.status !== false) physicengine(data, Engine_dtFactor);
      if (data.collision) findcollision(data);
   }

   if (Engine_autotick) requestAnimationFrame(nextick);
}

if (typeof Engine_onload !== "undefined" && !isNaN(Number(Engine_onload.tickrate))) {
   setInterval(nextick, Number(Engine_onload.tickrate));
} else {
   requestAnimationFrame(nextick);
}

setInterval(() => {
   if (typeof Engine_onload !== "undefined" && Engine_onload.fps === "vsync" && Engine_nowfps > Engine_monitorhz) {
      Engine_nowfps = Engine_monitorhz;
   }
   Fpscounter(Engine_nowfps, Engine_nowtick);
   Engine_nowfps = 0;
   Engine_nowtick = 0;
}, 1000);

function backgroundupdate() {
   Engine_nowfps++;
   backgroundreset();

   // Update Camera
   Camera.update(Engine_deltaTime);

   // Camera Viewport Transformation
   Engine_c.save();
   const cx = Engine_canvas.width / 2;
   const cy = Engine_canvas.height / 2;
   Engine_c.translate(cx, cy);
   if (Camera.zoomLevel !== 1) {
      Engine_c.scale(Camera.zoomLevel, Camera.zoomLevel);
   }
   Engine_c.translate(-cx - Camera.x + Camera.shakeOffset.x, -cy - Camera.y + Camera.shakeOffset.y);

   Engine_c.beginPath();
   Engine_c.shadowColor = "";
   Engine_c.shadowOffsetX = 0;
   Engine_c.shadowOffsetY = 0;
   Engine_c.shadowBlur = 0;
   Engine_c.globalAlpha = 1;

   // Sort layers if needed
   Engine_sortLayers();

   // Render objects
   for (let idx = 0; idx < Engine_allnames.length; idx++) {
      let data = Engine_db.get(Engine_allnames[idx]);
      if (!data) continue;
      if (data.image === false && data.color === false) continue;

      // In-screen culling with camera position check
      if (data.type === "component" && typeof Engine_onload !== "undefined" && Engine_onload.onlyonscreen) {
         const screenPos = Camera.toScreen(data.position.x, data.position.y);
         const scaleX = (data.scale ? data.scale.x : 0) * Camera.zoomLevel;
         const scaleY = (data.scale ? data.scale.y : 0) * Camera.zoomLevel;
         if (
            screenPos.y > Engine_canvas.height ||
            screenPos.y + scaleY < 0 ||
            screenPos.x > Engine_canvas.width ||
            screenPos.x + scaleX < 0
         ) continue;
      }

      Engine_c.globalAlpha = data.opacity || 1;
      if (data.shadow && data.shadow.status !== false) {
         if (data.shadow.color) Engine_c.shadowColor = data.shadow.color;
         if (data.shadow.blur) Engine_c.shadowBlur = data.shadow.blur;
         if (data.shadow.x) Engine_c.shadowOffsetX = data.shadow.x;
         if (data.shadow.y) Engine_c.shadowOffsetY = data.shadow.y;
      }

      const hasTransform = (data.hasOwnProperty('rotate') && data.rotate !== 0) || data.reverse;

      if (data.type === "component" && data.animate && data.animate.length) {
         if (!data.hasOwnProperty('rotate')) data.rotate = 0;
         if (hasTransform) {
            Engine_c.save();
            const animScale = data.animate[data.animatedata.val].scale;
            const pivotX = data.position.x + (animScale ? animScale.x / 2 : data.scale.x / 2);
            const pivotY = data.position.y + (animScale ? animScale.y / 2 : data.scale.y / 2);
            Engine_c.translate(pivotX, pivotY);
            if (data.reverse) Engine_c.scale(-1, 1);
            if (data.rotate) Engine_c.rotate(data.rotate);
            Engine_c.translate(-pivotX, -pivotY);
         }
         animatemanager(data);
         continue;
      } else if (hasTransform) {
         Engine_c.save();
         const pivotX = data.type === "text" ? data.position.x / 2 : data.position.x + (data.scale ? data.scale.x / 2 : 0);
         const pivotY = data.type === "text" ? data.position.y / 2 : data.position.y + (data.scale ? data.scale.y / 2 : 0);
         Engine_c.translate(pivotX, pivotY);
         if (data.reverse) Engine_c.scale(-1, 1);
         if (data.rotate) Engine_c.rotate(data.rotate);
      }

      if (data.type === "component" && data.image) {
         try {
            const img = Engine_getImage(data.image);
            if (img) {
               if (hasTransform) {
                  Engine_c.drawImage(img, -data.scale.x / 2, -data.scale.y / 2, data.scale.x, data.scale.y);
                  Engine_c.restore();
               } else {
                  Engine_c.drawImage(img, data.position.x, data.position.y, data.scale.x, data.scale.y);
               }
            }
         } catch {}
      } else if (data.color !== false) {
         if (data.type === "text") {
            Engine_c.font = String(data.size || "30px") + " " + String(data.font || "Arial");
            Engine_c.fillStyle = data.color || "black";
            if (data.text && data.text.includes("\n")) {
               const lines = data.text.split("\n");
               const sizeNum = parseFloat(data.size) || 30;
               for (let i = 0; i < lines.length; i++) {
                  if (hasTransform) {
                     Engine_c.fillText(lines[i], 0, i * sizeNum);
                  } else {
                     Engine_c.fillText(lines[i], data.position.x, data.position.y + i * sizeNum);
                  }
               }
            } else {
               if (hasTransform) {
                  Engine_c.fillText(data.text || "", 0, 0);
               } else {
                  Engine_c.fillText(data.text || "", data.position.x, data.position.y);
               }
            }
            if (hasTransform) Engine_c.restore();
         } else {
            const drawX = hasTransform ? -data.scale.x / 2 : data.position.x;
            const drawY = hasTransform ? -data.scale.y / 2 : data.position.y;
            const stype = data.stype || "fillrect";

            if (stype === "fillrect" || stype === "fr") {
               Engine_c.fillStyle = data.color || "black";
               Engine_c.fillRect(drawX, drawY, data.scale.x, data.scale.y);
            } else if (stype === "fillarc" || stype === "fa") {
               Engine_c.fillStyle = data.color || "black";
               Engine_c.beginPath();
               Engine_c.arc(drawX + data.scale.x / 2, drawY + data.scale.y / 2, data.scale.x / 2, 0, 2 * Math.PI);
               Engine_c.fill();
            } else if (stype === "strokearc" || stype === "sa") {
               Engine_c.strokeStyle = data.color || "black";
               Engine_c.beginPath();
               Engine_c.arc(drawX + data.scale.x / 2, drawY + data.scale.y / 2, data.scale.x / 2, 0, 2 * Math.PI);
               Engine_c.stroke();
            } else if (stype.startsWith("strokearc")) {
               Engine_c.strokeStyle = data.color || "black";
               Engine_c.lineWidth = Number(stype.replace("strokearc", "")) || 1;
               Engine_c.beginPath();
               Engine_c.arc(drawX + data.scale.x / 2, drawY + data.scale.y / 2, data.scale.x / 2, 0, 2 * Math.PI);
               Engine_c.stroke();
            } else if (stype.startsWith("strokerect")) {
               Engine_c.strokeStyle = data.color || "black";
               Engine_c.lineWidth = Number(stype.replace("strokerect", "")) || 1;
               Engine_c.strokeRect(drawX, drawY, data.scale.x, data.scale.y);
            } else if (stype === "strokerect" || stype === "sr") {
               Engine_c.strokeStyle = data.color || "black";
               Engine_c.strokeRect(drawX, drawY, data.scale.x, data.scale.y);
            }
            if (hasTransform) Engine_c.restore();
         }
      }
      if (data.eval) {
         try { eval(data.eval + "(" + JSON.stringify(data) + "," + "3" + ")"); } catch {}
      }
      Engine_c.beginPath();
      Engine_c.shadowColor = "";
      Engine_c.shadowOffsetX = 0;
      Engine_c.shadowOffsetY = 0;
      Engine_c.shadowBlur = 0;
      Engine_c.globalAlpha = 1;
   }

   // Restore Camera Viewport Transformation
   Engine_c.restore();

   if (Engine_autofps) requestAnimationFrame(backgroundupdate);
}

function Engine_findanoddnumber(sayi) {
   if (sayi % 2 === 0) { return sayi + 1; } else { return sayi; }
}

function backgroundmap(data) {
   if (!Engine_background) return;
   try { clearInterval(Engine_BackgroundInterval); } catch {}
   if (!Engine_backgroundlocation.x) Engine_backgroundlocation.x = -1;
   if (!Engine_backgroundlocation.y) Engine_backgroundlocation.y = -1;
   if (!Engine_backgroundlocation.dx) Engine_backgroundlocation.dx = Engine_canvas.width;
   if (!Engine_backgroundlocation.dy) Engine_backgroundlocation.dy = Engine_canvas.height;
   if (!data) { data = {}; }
   if (data.hasOwnProperty('dx')) Engine_backgroundlocation.dx = data.dx;
   if (data.hasOwnProperty('dy')) Engine_backgroundlocation.dy = data.dy;

   if (data.hasOwnProperty('x')) {
      if (typeof data.x === "string" && data.x.split("+").length === 2) {
         Engine_backgroundlocation.x = Engine_backgroundlocation.x - Engine_findanoddnumber(Number(data.x.split("+")[1]));
      } else if (typeof data.x === "string" && data.x.split("-").length === 2) {
         Engine_backgroundlocation.x = Engine_backgroundlocation.x + Engine_findanoddnumber(Number(data.x.split("-")[1]));
      } else { Engine_backgroundlocation.x = -Engine_findanoddnumber(data.x); }
   }
   if (data.hasOwnProperty('y')) {
      if (typeof data.y === "string" && data.y.split("+").length === 2) {
         Engine_backgroundlocation.y = Engine_backgroundlocation.y - Engine_findanoddnumber(Number(data.y.split("+")[1]));
      } else if (typeof data.y === "string" && data.y.split("-").length === 2) {
         Engine_backgroundlocation.y = Engine_backgroundlocation.y + Engine_findanoddnumber(Number(data.y.split("-")[1]));
      } else { Engine_backgroundlocation.y = -Engine_findanoddnumber(data.y); }
   }

   var lockedupdate = false;
   if (Engine_backgroundlocation.y > 0) { Engine_backgroundlocation.y = -1; lockedupdate = true; }
   if (Engine_backgroundlocation.x > 0) { Engine_backgroundlocation.x = -1; lockedupdate = true; }
   if (Engine_backgroundlocation.x < -Engine_backgroundlocation.dx) { Engine_backgroundlocation.x = -Engine_backgroundlocation.dx; lockedupdate = true; }
   if (Engine_backgroundlocation.y < -Engine_backgroundlocation.dy) { Engine_backgroundlocation.y = -Engine_backgroundlocation.dy; lockedupdate = true; }

   if (!lockedupdate) {
      for (let i = 0; i < Engine_allnames.length; i++) {
         let ddata = Engine_db.get(Engine_allnames[i]);
         if (!ddata || !ddata.backgroundposition) continue;
         ddata.position.x += -Number(data.x || 0);
         ddata.position.y += -Number(data.y || 0);
      }
   }
}

function Cbacground(x, y) {
   return {
      x: Engine_backgroundlocation.x + x,
      y: Engine_backgroundlocation.y + y
   };
}

function backgroundreset() {
   if (Engine_background) {
      try {
         const bgImg = Engine_getImage(Engine_background);
         if (bgImg) {
            if (Engine_backgroundlocation.x && Engine_backgroundlocation.y) {
               Engine_c.drawImage(
                  bgImg,
                  Engine_backgroundlocation.x, Engine_backgroundlocation.y,
                  Engine_backgroundlocation.dx + Engine_canvas.width, Engine_backgroundlocation.dy + Engine_canvas.height
               );
            } else {
               Engine_c.drawImage(bgImg, 0, 0, Engine_canvas.width, Engine_canvas.height);
            }
            return;
         }
      } catch {}
   }
   if (Engine_backgroundcolor) {
      Engine_c.fillStyle = Engine_backgroundcolor;
      Engine_c.fillRect(0, 0, Engine_canvas.width, Engine_canvas.height);
   } else {
      Engine_c.clearRect(0, 0, Engine_canvas.width, Engine_canvas.height);
   }
}

function hidecursor() { document.body.style.cursor = "none"; }
function showcursor() { document.body.style.cursor = "default"; }
function editcursor(x) { document.body.style.cursor = x; }
function disablemouse() { hidecursor(); Engine_enablemouse = false; Engine_mouselocation = {}; }
function enablemouse() { showcursor(); Engine_enablemouse = true; Engine_mouselocation = {}; }
function getMouselocation() { return Engine_mouselocation; }
function disablekeyboard() { Engine_Forcepress = []; Engine_enablekeyboard = false; }
function enablekeyboard() { Engine_enablekeyboard = true; }
function disabletouch() { Engine_enabletouch = false; }
function enabletouch() { Engine_enabletouch = true; }
function keydown(key) { return; }
function keyup(key) { return; }
function keypress(key) { return; }
function leftclicked(location, component) { return; }
function rightclicked(location, component) { return; }
function mousemove(location, component) { return; }
function mouseup(location, component) { return; }
function mousedown(location, component) { return; }
function mousescroll(location, speed) { return; }
function touchmove(fingers) { return; }
function textboxfocus(name) { return; }
function touchstart(fingers) { return; }
function touchend(fingers) { return; }
function physicout() { return; }
function animateout() { return; }
function collisionout() { return; }
function Fpscounter() { return; }
function gamepadconnected() {}
function gamepaddisconnect() {}
function gamepadupdate() {}
function togame(x) { return; }

function reloadgame() { location.reload(); }
function clipboard(x) { return navigator.clipboard.writeText(x); }
function getLanguage() { return navigator.language; }
function getPlatform() {
   let tempgp = {
      platform: "IDK",
      fullplatform: navigator.platform
   };
   if (navigator.userAgent.match(/Android/i)) {
      tempgp.platform = "Android";
   } else {
      if (navigator.userAgent.includes("Electron")) {
         if (navigator.platform === "Win32" || navigator.platform === "Windows") {
            tempgp.platform = "Windows";
         } else if (navigator.platform === "Linux x86_64" || navigator.platform === "Linux i686" || navigator.platform === "Linux armv7l") {
            tempgp.platform = "Linux";
         } else if (navigator.platform === "MacIntel" || navigator.platform === "MacPPC") {
            tempgp.platform = "Macos";
         }
      } else {
         tempgp.platform = "Webbrowser";
      }
   }
   return tempgp;
}

function sendengine(x) {
   console.log(JSON.stringify({
      toengine: true,
      fullscreen: x.fullscreen,
      center: x.center,
      exit: x.exit,
      appresize: x.appresize && {
         x: x.appresize && x.appresize.x,
         y: x.appresize && x.appresize.y,
      },
      changestatusbar: x.changestatusbar,
      sendalertbox: x.sendalertbox,
      changescreenstatus: x.changescreenstatus,
      sendvibrate: x.sendvibrate && Number(x.sendvibrate),
      dbset: x.dbset && x.dbset.length === 2 && [x.dbset[0], x.dbset[1]],
      dbget: x.dbget,
      dbreset: x.dbreset,
      dbdel: x.dbdel,
      startpath: x.startpath
   }));
}

// Inputs - Keyboard
window.addEventListener("keydown", (event) => {
   if (Engine_enablekeyboard === false) return;
   keydown(event.key.toLocaleUpperCase(), { key: event.key, alt: event.altKey, shift: event.shiftKey, ctrl: event.ctrlKey });
   if (event.key === "Meta" || event.key === "Pause") togame({ paused: true });
   if (Engine_Forcepress.filter(z => z.key === event.key).length) return;
   Engine_Forcepress.push({ xkey: event.key, key: event.key.toLocaleUpperCase(), alt: event.altKey, shift: event.shiftKey, ctrl: event.ctrlKey });
});

window.addEventListener("keyup", (event) => {
   if (Engine_enablekeyboard === false) return;
   keyup(event.key.toLocaleUpperCase(), { key: event.key, alt: event.altKey, shift: event.shiftKey, ctrl: event.ctrlKey });
   Engine_Forcepress = Engine_Forcepress.filter(z => z.key !== event.key.toLocaleUpperCase());
});

setInterval(() => {
   Engine_Forcepress.forEach((x) => keypress(x.key, { key: x.xkey, alt: x.alt, shift: x.shift, ctrl: x.ctrl }));
}, Number(typeof Engine_onload !== "undefined" ? Engine_onload.forcepresstime || 60 : 60));

// Inputs - Mouse & Touch with Camera World Coordinate Transform
function Engine_findComponentUnderPoint(worldX, worldY) {
   for (let i = Engine_allnames.length - 1; i >= 0; i--) {
      let z = getData(Engine_allnames[i]);
      if (!z || z.type !== "component" || !z.position || !z.scale) continue;
      if (
         worldX >= z.position.x &&
         worldX <= z.position.x + z.scale.x &&
         worldY >= z.position.y &&
         worldY <= z.position.y + z.scale.y
      ) {
         return { name: z.name, x: worldX - z.position.x, y: worldY - z.position.y };
      }
   }
   return false;
}

window.addEventListener("wheel", function(event) {
   if (event.deltaY < 0) { mousescroll("up", event.deltaY); } else if (event.deltaY > 0) { mousescroll("down", event.deltaY); }
});

window.addEventListener("click", function(event) {
   if (Engine_enablemouse === false) return;
   const canvasX = event.clientX / (window.innerWidth / Engine_canvas.width);
   const canvasY = event.clientY / (window.innerHeight / Engine_canvas.height);
   const world = Camera.toWorld(canvasX, canvasY);
   Engine_mouselocation = { x: world.x, y: world.y, screenX: event.clientX, screenY: event.clientY };
   const comp = Engine_findComponentUnderPoint(world.x, world.y);
   leftclicked({ x: world.x, y: world.y, screenX: canvasX, screenY: canvasY }, comp);
});

window.addEventListener('mousemove', function(event) {
   if (Engine_enablemouse === false) return;
   const canvasX = event.clientX / (window.innerWidth / Engine_canvas.width);
   const canvasY = event.clientY / (window.innerHeight / Engine_canvas.height);
   const world = Camera.toWorld(canvasX, canvasY);
   Engine_mouselocation = { x: world.x, y: world.y, screenX: event.clientX, screenY: event.clientY };
   const comp = Engine_findComponentUnderPoint(world.x, world.y);
   mousemove({ x: world.x, y: world.y, screenX: canvasX, screenY: canvasY }, comp);
});

window.addEventListener('mousedown', function(event) {
   if (Engine_enablemouse === false) return;
   const canvasX = event.clientX / (window.innerWidth / Engine_canvas.width);
   const canvasY = event.clientY / (window.innerHeight / Engine_canvas.height);
   const world = Camera.toWorld(canvasX, canvasY);
   Engine_mouselocation = { x: world.x, y: world.y, screenX: event.clientX, screenY: event.clientY };
   const comp = Engine_findComponentUnderPoint(world.x, world.y);
   mousedown({ x: world.x, y: world.y, screenX: canvasX, screenY: canvasY, button: event.buttons }, comp);
});

window.addEventListener('mouseup', function(event) {
   if (Engine_enablemouse === false) return;
   const canvasX = event.clientX / (window.innerWidth / Engine_canvas.width);
   const canvasY = event.clientY / (window.innerHeight / Engine_canvas.height);
   const world = Camera.toWorld(canvasX, canvasY);
   Engine_mouselocation = { x: world.x, y: world.y, screenX: event.clientX, screenY: event.clientY };
   const comp = Engine_findComponentUnderPoint(world.x, world.y);
   mouseup({ x: world.x, y: world.y, screenX: canvasX, screenY: canvasY, button: event.buttons }, comp);
});

window.addEventListener('contextmenu', function(event) {
   event.preventDefault();
   if (Engine_enablemouse === false) return;
   const canvasX = event.clientX / (window.innerWidth / Engine_canvas.width);
   const canvasY = event.clientY / (window.innerHeight / Engine_canvas.height);
   const world = Camera.toWorld(canvasX, canvasY);
   Engine_mouselocation = { x: world.x, y: world.y, screenX: event.clientX, screenY: event.clientY };
   const comp = Engine_findComponentUnderPoint(world.x, world.y);
   rightclicked({ x: world.x, y: world.y, screenX: canvasX, screenY: canvasY }, comp);
});

window.addEventListener('touchstart', function(event) {
   if (Engine_enabletouch === false) return;
   let toucheslist = [];
   for (let i = 0; i < event.touches.length; i++) {
      const canvasX = event.touches[i].clientX / (window.innerWidth / Engine_canvas.width);
      const canvasY = event.touches[i].clientY / (window.innerHeight / Engine_canvas.height);
      const world = Camera.toWorld(canvasX, canvasY);
      const comp = Engine_findComponentUnderPoint(world.x, world.y);
      toucheslist.push({ finger: i + 1, x: world.x, y: world.y, screenX: canvasX, screenY: canvasY, component: comp });
   }
   touchstart(toucheslist);
});

window.addEventListener('touchmove', function(event) {
   if (Engine_enabletouch === false) return;
   let toucheslist = [];
   for (let i = 0; i < event.touches.length; i++) {
      const canvasX = event.touches[i].clientX / (window.innerWidth / Engine_canvas.width);
      const canvasY = event.touches[i].clientY / (window.innerHeight / Engine_canvas.height);
      const world = Camera.toWorld(canvasX, canvasY);
      const comp = Engine_findComponentUnderPoint(world.x, world.y);
      toucheslist.push({ finger: i + 1, x: world.x, y: world.y, screenX: canvasX, screenY: canvasY, component: comp });
   }
   touchmove(toucheslist);
});

window.addEventListener('touchend', function(event) {
   if (Engine_enabletouch === false) return;
   let toucheslist = [];
   for (let i = 0; i < event.changedTouches.length; i++) {
      const canvasX = event.changedTouches[i].clientX / (window.innerWidth / Engine_canvas.width);
      const canvasY = event.changedTouches[i].clientY / (window.innerHeight / Engine_canvas.height);
      const world = Camera.toWorld(canvasX, canvasY);
      const comp = Engine_findComponentUnderPoint(world.x, world.y);
      toucheslist.push({ finger: i + 1, x: world.x, y: world.y, screenX: canvasX, screenY: canvasY, component: comp });
   }
   touchend(toucheslist);
});

// Database
function Enginedataconnect(data) { data.Engine_connected = true; Engine_database = data; }
sendengine({ dbget: true });

async function WaitDatabase(tempwd = 7) {
   while (!Engine_database.Engine_connected) {
      if (tempwd < 1) return false;
      tempwd--;
      await new Promise(resolve => setTimeout(resolve, 1000));
   }
   return true;
}

function Database(act, obj, obj2) {
   if (act === "get") {
      return Engine_database[obj];
   } else if (act === "set" && obj && obj2) {
      Engine_database[obj] = obj2;
      return sendengine({ dbset: [obj, obj2] });
   } else if (act === "add" && !isNaN(Number(Engine_database[obj] || 0)) && !isNaN(Number(obj2))) {
      Engine_database[obj] = (Engine_database[obj] || 0) + obj2;
      return sendengine({ dbset: [obj, Engine_database[obj]] });
   } else if (act === "push" && Engine_database[obj] && Engine_database[obj].length) {
      Engine_database[obj].push(obj2);
      return sendengine({ dbset: [obj, Engine_database[obj]] });
   } else if ((act === "delete" || act === "del" || act === "remove") && !obj2) {
      return sendengine({ dbdel: obj });
   } else if ((act === "delete" || act === "del" || act === "remove") && !isNaN(Number(obj2))) {
      Engine_database[obj] = Engine_database[obj] - obj2;
      return sendengine({ dbset: [obj, Engine_database[obj]] });
   } else if ((act === "delete" || act === "del" || act === "remove") && obj2 && obj2.length) {
      Engine_database[obj] = Engine_database[obj].filter(z => JSON.stringify(z) !== JSON.stringify(obj2));
      return sendengine({ dbset: [obj, Engine_database[obj]] });
   } else if (act === "deleteall" || act === "reset") {
      return sendengine({ dbreset: true });
   }
}

// Sound
function componentsound(sound, data, z, area) {
   data = getData(data);
   z = getData(z);
   if (!data || !z || !data.position || !z.position) return;
   let dist = Math.sqrt(Math.pow(data.position.x - z.position.x, 2) + Math.pow(data.position.y - z.position.y, 2)) * (area || 1.5);
   if (dist > 1000) { dist = 1000; } else if (dist < 0) { dist = 0; }
   if (sound) sound.volume = 1 - (dist / 1000);
}

function autocomponentsound(set, sound, data, z, area) {
   if (set === true) {
      Engine_autocomponentsound.set(sound, setInterval(() => componentsound(sound, data, z, area), 50));
   } else {
      clearInterval(Engine_autocomponentsound.get(sound));
      Engine_autocomponentsound.delete(sound);
   }
}

function autoshaders(set, player) {
   if (set === true) {
      Engine_Virtualshadowitems.push(player);
   } else {
      Engine_Virtualshadowitems = Engine_Virtualshadowitems.filter(z => z !== player);
   }
}

if (typeof Engine_onload !== "undefined" && Engine_onload.autoshaders !== 0) {
   setInterval(() => {
      Engine_Virtualshadow.time += 1;
      if (Engine_Virtualshadow.time === 24) Engine_Virtualshadow.time = 0;
      Engine_Virtualshadowitems.forEach((x) => {
         x = getData(x);
         if (!x || !x.shadow || !x.scale) return;
         if (!x.shadow.color) x.shadow.color = Engine_Virtualshadow.color;
         x.shadow.x = -((x.scale.x * Engine_Virtualshadow.width) / 100) * ((Engine_Virtualshadow.time - 12) / 12);
         x.shadow.y = ((x.scale.y * Engine_Virtualshadow.height) / 100) * Math.abs((Engine_Virtualshadow.time - 12)) / 12;
      });
   }, Number(typeof Engine_onload !== "undefined" ? Engine_onload.autoshaders || 60000 : 60000));
}

// Gamepad
window.addEventListener("gamepadconnected", (event) => gamepadconnected({
   id: event.gamepad.index,
   name: event.gamepad.id,
   axes: event.gamepad.axes,
   buttons: event.gamepad.buttons,
   vibration: !!event.gamepad.vibrationActuator
}, event.gamepad));

window.addEventListener("gamepaddisconnected", (event) => gamepaddisconnect({
   id: event.gamepad.index,
   name: event.gamepad.id
}, event.gamepad));

setInterval(() => {
   const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
   for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp) {
         gamepadupdate({
            id: gp.index,
            name: gp.id,
            axes: gp.axes,
            buttons: gp.buttons
         });
      }
   }
}, Number(typeof Engine_onload !== "undefined" ? Engine_onload.gamepadpressinterval || 30 : 30));

function gamepadvibrate(id, duration, left, right) {
   const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
   let targetGamepads = [];
   if (right !== undefined) {
      if (gamepads[id]) targetGamepads = [gamepads[id]];
   } else {
      right = left;
      left = duration;
      duration = id;
      targetGamepads = Array.from(gamepads).filter(Boolean);
   }
   targetGamepads.forEach((gamepad) => {
      if (gamepad && gamepad.vibrationActuator) {
         try {
            gamepad.vibrationActuator.playEffect("dual-rumble", {
               startDelay: 0,
               duration: duration ? duration : 100,
               weakMagnitude: left > 1 ? 1 : left < 0 ? 0 : left,
               strongMagnitude: right > 1 ? 1 : right < 0 ? 0 : right,
            });
         } catch {}
      }
   });
}
