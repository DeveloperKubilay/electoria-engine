// Electoria Engine - Scene View & 2D Visual Level Editor
// File: source/js/site/scene_editor.js

var SceneEditor = {
  container: null,
  canvas: null,
  ctx: null,
  
  // Viewport & Transform
  zoom: 1,
  panX: 50,
  panY: 50,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  
  // Game native resolution
  viewportWidth: 1024,
  viewportHeight: 720,
  
  // Tool state: 'select', 'move', 'pan', 'scale'
  currentTool: "select",
  
  // Scene entities loaded from script.js (Source of Truth)
  entities: [],
  selectedEntity: null,

  // History state for Undo / Redo
  history: [],
  historyIndex: -1,
  maxHistory: 30,

  pushHistory: function() {
    const snap = JSON.stringify(this.entities);
    if (this.historyIndex >= 0 && this.history[this.historyIndex] === snap) return;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snap);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
  },

  undo: function() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.applyHistorySnapshot(this.history[this.historyIndex]);
      if (window.iziToast) iziToast.info({ title: "Undo", message: "Restored previous state" });
    }
  },

  redo: function() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.applyHistorySnapshot(this.history[this.historyIndex]);
      if (window.iziToast) iziToast.info({ title: "Redo", message: "Restored state" });
    }
  },

  applyHistorySnapshot: function(jsonStr) {
    try {
      this.entities = JSON.parse(jsonStr);
      if (this.selectedEntity && this.selectedEntity.data) {
        const found = this.entities.find(e => e.data && e.data.name === this.selectedEntity.data.name);
        this.selectedEntity = found || null;
      }
      this.entities.forEach(ent => {
        if (ent && ent.data) this.saveEntityTransform(ent);
      });
    } catch(e) {}
  },
  
  // Gizmo manipulation state
  isDraggingGizmo: false,
  dragStartX: 0,
  dragStartY: 0,
  dragMode: null, // 'move', 'resize-tl', 'resize-tr', 'resize-bl', 'resize-br'
  initialEntityState: null,
  
  // Texture and image cache
  imageCache: new Map(),
  
  // Animation frame id
  animFrameId: null,
  
  init: function() {
    this.container = document.getElementById("view-scene");
    if (!this.container) return;
    this.canvas = document.getElementById("scene-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    
    this.setupEvents();
    this.loadEntities();
    this.centerViewport();
    this.startLoop();
  },

  getIframeWindow: function() {
    try {
      const iframe = document.getElementById("mainiframe");
      return iframe && iframe.contentWindow ? iframe.contentWindow : null;
    } catch (e) {
      return null;
    }
  },
  
  resizeCanvas: function() {
    if (!this.container || !this.canvas) return;
    if (this.container.clientWidth > 0 && this.container.clientHeight > 0) {
      this.canvas.width = this.container.clientWidth;
      this.canvas.height = this.container.clientHeight;
    }
  },
  
  centerViewport: function() {
    if (!this.canvas || this.canvas.width === 0) return;
    this.zoom = Math.min((this.canvas.width * 0.75) / this.viewportWidth, (this.canvas.height * 0.75) / this.viewportHeight, 1);
    this.panX = (this.canvas.width - this.viewportWidth * this.zoom) / 2;
    this.panY = (this.canvas.height - this.viewportHeight * this.zoom) / 2;
    const zoomBadge = document.getElementById("scene-zoom-val");
    if (zoomBadge) zoomBadge.innerText = Math.round(this.zoom * 100) + "%";
  },
  
  setZoom: function(val) {
    this.zoom = Math.max(0.1, Math.min(val, 5));
    const zoomBadge = document.getElementById("scene-zoom-val");
    if (zoomBadge) zoomBadge.innerText = Math.round(this.zoom * 100) + "%";
  },
  
  setTool: function(tool) {
    this.currentTool = tool;
    document.querySelectorAll(".scene-tool-btn").forEach(btn => btn.classList.remove("active"));
    const btn = document.getElementById("tool-" + tool);
    if (btn) btn.classList.add("active");
    if (this.canvas) this.canvas.style.cursor = tool === "pan" ? "grab" : "default";
  },
  
  getImage: function(srcOrId) {
    if (!srcOrId) return null;
    if (this.imageCache.has(srcOrId)) {
      return this.imageCache.get(srcOrId);
    }
    
    const ifw = this.getIframeWindow();
    if (ifw && ifw.document) {
      try {
        const domImg = ifw.document.getElementById(srcOrId);
        if (domImg && domImg.src) {
          this.imageCache.set(srcOrId, domImg);
          return domImg;
        }
      } catch (e) {}
    }
    
    const img = new Image();
    img.src = srcOrId.startsWith("http") || srcOrId.startsWith("./") || srcOrId.startsWith("/") ? srcOrId : `./Images/${srcOrId}`;
    this.imageCache.set(srcOrId, img);
    return img;
  },
  
  loadEntities: function() {
    // Fetch initial static level definitions from script.js via backend
    fetch("/getsceneentities")
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          this.entities = data;
          this.pushHistory();
        } else {
          const ifw = this.getIframeWindow();
          if (ifw && ifw.Engine_allnames && ifw.Engine_allnames.length > 0) {
            const liveList = [];
            ifw.Engine_allnames.forEach(name => {
              let d = null;
              if (typeof ifw.getData === "function") d = ifw.getData(name);
              else if (ifw.Engine_db && ifw.Engine_db.get) d = ifw.Engine_db.get(name);
              if (d) {
                liveList.push({ type: d.type || "component", data: JSON.parse(JSON.stringify(d)) });
              }
            });
            if (liveList.length > 0) {
              this.entities = liveList;
              this.pushHistory();
            }
          }
        }
      })
      .catch(() => {});
  },
  
  worldToScreen: function(wx, wy) {
    return {
      x: wx * this.zoom + this.panX,
      y: wy * this.zoom + this.panY
    };
  },
  
  screenToWorld: function(sx, sy) {
    return {
      x: (sx - this.panX) / this.zoom,
      y: (sy - this.panY) / this.zoom
    };
  },
  
  setupEvents: function() {
    const c = this.canvas;
    if (!c) return;
    
    c.addEventListener("wheel", (e) => {
      e.preventDefault();
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      const worldBefore = this.screenToWorld(mouseX, mouseY);
      
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      this.setZoom(this.zoom * factor);
      
      this.panX = mouseX - worldBefore.x * this.zoom;
      this.panY = mouseY - worldBefore.y * this.zoom;
    });
    
    c.addEventListener("mousedown", (e) => {
      const rect = c.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      
      // Middle or Right click = Pan
      if (e.button === 1 || e.button === 2 || this.currentTool === "pan") {
        this.isPanning = true;
        this.panStartX = sx - this.panX;
        this.panStartY = sy - this.panY;
        c.style.cursor = "grabbing";
        return;
      }
      
      if (e.button === 0) {
        // Check gizmo hit on selected entity first
        if (this.selectedEntity) {
          const hitGizmo = this.checkGizmoHit(sx, sy, this.selectedEntity);
          if (hitGizmo) {
            this.pushHistory();
            this.isDraggingGizmo = true;
            this.dragMode = hitGizmo;
            const world = this.screenToWorld(sx, sy);
            this.dragStartX = world.x;
            this.dragStartY = world.y;
            this.initialEntityState = {
              x: Number(this.selectedEntity.data.position.x || 0),
              y: Number(this.selectedEntity.data.position.y || 0),
              w: Number(this.selectedEntity.data.scale ? this.selectedEntity.data.scale.x : 50),
              h: Number(this.selectedEntity.data.scale ? this.selectedEntity.data.scale.y : 50)
            };
            return;
          }
        }
        
        // Check entity selection in world space
        const world = this.screenToWorld(sx, sy);
        const hit = this.pickEntityAtWorld(world.x, world.y);
        this.selectEntity(hit);
        
        if (hit) {
          this.pushHistory();
          this.isDraggingGizmo = true;
          this.dragMode = "move";
          this.dragStartX = world.x;
          this.dragStartY = world.y;
          this.initialEntityState = {
            x: Number(hit.data.position.x || 0),
            y: Number(hit.data.position.y || 0),
            w: Number(hit.data.scale ? hit.data.scale.x : 50),
            h: Number(hit.data.scale ? hit.data.scale.y : 50)
          };
        }
      }
    });
    
    window.addEventListener("mousemove", (e) => {
      if (!this.container || this.container.offsetParent === null) return;
      const rect = c.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      
      if (this.isPanning) {
        this.panX = sx - this.panStartX;
        this.panY = sy - this.panStartY;
        return;
      }
      
      if (this.isDraggingGizmo && this.selectedEntity && this.initialEntityState) {
        const world = this.screenToWorld(sx, sy);
        const dx = world.x - this.dragStartX;
        const dy = world.y - this.dragStartY;
        const d = this.selectedEntity.data;
        if (!d.position) d.position = { x: 0, y: 0 };
        
        if (this.dragMode === "move") {
          d.position.x = Math.round(this.initialEntityState.x + dx);
          d.position.y = Math.round(this.initialEntityState.y + dy);
        } else if (this.dragMode === "resize-br") {
          if (!d.scale) d.scale = { x: 50, y: 50 };
          d.scale.x = Math.max(10, Math.round(this.initialEntityState.w + dx));
          d.scale.y = Math.max(10, Math.round(this.initialEntityState.h + dy));
        } else if (this.dragMode === "resize-tr") {
          if (!d.scale) d.scale = { x: 50, y: 50 };
          d.scale.x = Math.max(10, Math.round(this.initialEntityState.w + dx));
          d.scale.y = Math.max(10, Math.round(this.initialEntityState.h - dy));
          d.position.y = Math.round(this.initialEntityState.y + dy);
        } else if (this.dragMode === "resize-bl") {
          if (!d.scale) d.scale = { x: 50, y: 50 };
          d.scale.x = Math.max(10, Math.round(this.initialEntityState.w - dx));
          d.scale.y = Math.max(10, Math.round(this.initialEntityState.h + dy));
          d.position.x = Math.round(this.initialEntityState.x + dx);
        } else if (this.dragMode === "resize-tl") {
          if (!d.scale) d.scale = { x: 50, y: 50 };
          d.scale.x = Math.max(10, Math.round(this.initialEntityState.w - dx));
          d.scale.y = Math.max(10, Math.round(this.initialEntityState.h - dy));
          d.position.x = Math.round(this.initialEntityState.x + dx);
          d.position.y = Math.round(this.initialEntityState.y + dy);
        }
        
        // Instant update in running iframe if present
        try {
          const ifw = this.getIframeWindow();
          if (ifw && ifw.updateData) {
            ifw.updateData({
              name: d.name,
              position: { x: d.position.x, y: d.position.y },
              scale: d.scale ? { x: d.scale.x, y: d.scale.y } : undefined
            });
          }
        } catch (err) {}
      }
    });
    
    window.addEventListener("mouseup", () => {
      if (this.isPanning) {
        this.isPanning = false;
        if (this.canvas) this.canvas.style.cursor = this.currentTool === "pan" ? "grab" : "default";
      }
      if (this.isDraggingGizmo) {
        this.isDraggingGizmo = false;
        this.saveEntityTransform(this.selectedEntity);
      }
    });

    // Keyboard Undo (Ctrl+Z) and Redo (Ctrl+Y / Ctrl+Shift+Z)
    window.addEventListener("keydown", (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        this.redo();
      }
    });
    
    c.addEventListener("contextmenu", (e) => e.preventDefault());
  },
  
  pickEntityAtWorld: function(wx, wy) {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const ent = this.entities[i];
      const d = ent.data;
      if (!d || !d.position) continue;
      const x = Number(d.position.x || 0);
      const y = Number(d.position.y || 0);
      const w = Number(d.scale ? d.scale.x : (ent.type === "text" ? 100 : 50));
      const h = Number(d.scale ? d.scale.y : (ent.type === "text" ? 30 : 50));
      
      if (wx >= x && wx <= x + w && wy >= y && wy <= y + h) {
        return ent;
      }
    }
    return null;
  },
  
  checkGizmoHit: function(sx, sy, ent) {
    const d = ent.data;
    if (!d || !d.position) return null;
    const x = Number(d.position.x || 0);
    const y = Number(d.position.y || 0);
    const w = Number(d.scale ? d.scale.x : 50);
    const h = Number(d.scale ? d.scale.y : 50);
    
    const sp = this.worldToScreen(x, y);
    const sw = w * this.zoom;
    const sh = h * this.zoom;
    const handleSize = 8;
    
    // Check corner handles
    const handles = [
      { mode: "resize-tl", x: sp.x, y: sp.y },
      { mode: "resize-tr", x: sp.x + sw, y: sp.y },
      { mode: "resize-bl", x: sp.x, y: sp.y + sh },
      { mode: "resize-br", x: sp.x + sw, y: sp.y + sh }
    ];
    
    for (let hnd of handles) {
      if (Math.abs(sx - hnd.x) <= handleSize && Math.abs(sy - hnd.y) <= handleSize) {
        return hnd.mode;
      }
    }
    
    // Check inside body
    if (sx >= sp.x && sx <= sp.x + sw && sy >= sp.y && sy <= sp.y + sh) {
      return "move";
    }
    return null;
  },
  
  selectEntity: function(ent) {
    this.selectedEntity = ent;
    if (ent && ent.data && typeof selectitem === "function") {
      selectitem(ent.data.name);
    }
  },
  
  saveEntityTransform: function(ent) {
    if (!ent || !ent.data) return;
    
    fetch("/setdata", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        name: ent.data.name,
        type: ent.type === "text" ? "Text" : "Component",
        data: JSON.stringify(ent.data, null, 2),
        file: "script.js"
      })
    }).then(() => {
      if (typeof selectitem === "function") {
        selectitem(ent.data.name);
      }
    });
  },
  
  startLoop: function() {
    const loop = () => {
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  },
  
  render: function() {
    if (!this.container || !this.canvas) return;

    if (this.container.clientWidth > 0 && this.container.clientHeight > 0) {
      if (this.canvas.width !== this.container.clientWidth || this.canvas.height !== this.container.clientHeight) {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
      }
    }

    const ctx = this.ctx || this.canvas.getContext("2d");
    if (!ctx || this.canvas.width === 0 || this.canvas.height === 0) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Clear Canvas
    ctx.fillStyle = "#12111a";
    ctx.fillRect(0, 0, w, h);
    
    // Render Grid
    this.renderGrid();
    
    // Sync viewport resolution with actual game canvas
    const ifw = this.getIframeWindow();
    if (ifw && ifw.Engine_canvas && ifw.Engine_canvas.width > 0 && ifw.Engine_canvas.height > 0) {
      this.viewportWidth = ifw.Engine_canvas.width;
      this.viewportHeight = ifw.Engine_canvas.height;
    }

    // Viewport Screen Bounds
    const vpScreen = this.worldToScreen(0, 0);
    const vpW = this.viewportWidth * this.zoom;
    const vpH = this.viewportHeight * this.zoom;
    
    // Viewport Background
    let bgColor = "#000000";
    if (ifw && ifw.Engine_backgroundcolor) {
      bgColor = ifw.Engine_backgroundcolor;
    }
    ctx.fillStyle = bgColor;
    ctx.fillRect(vpScreen.x, vpScreen.y, vpW, vpH);
    
    // Viewport Background Texture
    if (ifw && ifw.Engine_background) {
      const bgImg = this.getImage(ifw.Engine_background);
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, vpScreen.x, vpScreen.y, vpW, vpH);
      }
    }
    
    // Viewport Border Frame
    ctx.strokeStyle = "#7f5af0";
    ctx.lineWidth = 2;
    ctx.strokeRect(vpScreen.x, vpScreen.y, vpW, vpH);
    
    // Viewport Header Label
    ctx.fillStyle = "#7f5af0";
    ctx.font = "12px Poppins, sans-serif";
    ctx.fillText(`Game Viewport (${this.viewportWidth}x${this.viewportHeight})`, vpScreen.x + 8, vpScreen.y - 8);
    
    // Render All Entities (sorted by layer)
    const sorted = [...this.entities].sort((a, b) => {
      const la = a.data && typeof a.data.layer === "number" ? a.data.layer : 100;
      const lb = b.data && typeof b.data.layer === "number" ? b.data.layer : 100;
      return la - lb;
    });
    
    sorted.forEach(ent => {
      this.renderEntity(ent);
    });
    
    // Render Selection Gizmo on Selected Entity
    if (this.selectedEntity) {
      this.renderGizmo(this.selectedEntity);
    }
  },
  
  renderGrid: function() {
    const ctx = this.ctx;
    const gridSize = 50 * this.zoom;
    const startX = this.panX % gridSize;
    const startY = this.panY % gridSize;
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    for (let x = startX; x < this.canvas.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
    }
    for (let y = startY; y < this.canvas.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
    }
    ctx.stroke();
    
    // World Origin axes
    const origin = this.worldToScreen(0, 0);
    ctx.strokeStyle = "rgba(255, 137, 6, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, this.canvas.height);
    ctx.moveTo(0, origin.y);
    ctx.lineTo(this.canvas.width, origin.y);
    ctx.stroke();
  },
  
  renderEntity: function(ent) {
    const ctx = this.ctx;
    const d = ent.data;
    if (!d || !d.position) return;
    
    const x = Number(d.position.x || 0);
    const y = Number(d.position.y || 0);
    const scaleX = Number(d.scale ? d.scale.x : (ent.type === "text" ? 100 : 50));
    const scaleY = Number(d.scale ? d.scale.y : (ent.type === "text" ? 30 : 50));
    
    const sp = this.worldToScreen(x, y);
    const sw = scaleX * this.zoom;
    const sh = scaleY * this.zoom;
    
    ctx.save();
    
    if (d.opacity) ctx.globalAlpha = d.opacity;
    
    if (d.rotate) {
      ctx.translate(sp.x + sw / 2, sp.y + sh / 2);
      ctx.rotate(Number(d.rotate));
      ctx.translate(-(sp.x + sw / 2), -(sp.y + sh / 2));
    }
    
    if (ent.type === "text" || d.text !== undefined) {
      ctx.font = `${(Number(d.size) || 16) * this.zoom}px ${d.font || 'Poppins, sans-serif'}`;
      ctx.fillStyle = d.color || "#fffffe";
      ctx.fillText(d.text || "Hello World", sp.x, sp.y + sh);
    } else {
      let drawn = false;
      if (d.image) {
        const img = this.getImage(d.image);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, sp.x, sp.y, sw, sh);
          drawn = true;
        }
      }
      
      if (!drawn) {
        ctx.fillStyle = d.color || "#ff8906";
        if (d.type === "arc" || d.shape === "circle") {
          ctx.beginPath();
          ctx.arc(sp.x + sw / 2, sp.y + sh / 2, Math.min(sw, sh) / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(sp.x, sp.y, sw, sh);
        }
      }
    }
    
    // Label tag
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "10px Poppins, sans-serif";
    ctx.fillText(d.name || "Entity", sp.x, sp.y - 4);
    
    ctx.restore();
  },
  
  renderGizmo: function(ent) {
    const ctx = this.ctx;
    const d = ent.data;
    if (!d || !d.position) return;
    
    const x = Number(d.position.x || 0);
    const y = Number(d.position.y || 0);
    const scaleX = Number(d.scale ? d.scale.x : (ent.type === "text" ? 100 : 50));
    const scaleY = Number(d.scale ? d.scale.y : (ent.type === "text" ? 30 : 50));
    
    const sp = this.worldToScreen(x, y);
    const sw = scaleX * this.zoom;
    const sh = scaleY * this.zoom;
    
    // Bounding Box
    ctx.strokeStyle = "#2cb67d";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(sp.x - 2, sp.y - 2, sw + 4, sh + 4);
    ctx.setLineDash([]);
    
    // Corner Resize Handles
    const handles = [
      { x: sp.x - 2, y: sp.y - 2 },
      { x: sp.x + sw + 2, y: sp.y - 2 },
      { x: sp.x - 2, y: sp.y + sh + 2 },
      { x: sp.x + sw + 2, y: sp.y + sh + 2 }
    ];
    
    ctx.fillStyle = "#fffffe";
    ctx.strokeStyle = "#2cb67d";
    ctx.lineWidth = 1.5;
    handles.forEach(h => {
      ctx.fillRect(h.x - 4, h.y - 4, 8, 8);
      ctx.strokeRect(h.x - 4, h.y - 4, 8, 8);
    });
  }
};

window.SceneEditor = SceneEditor;
