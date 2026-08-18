// Electoria Engine - 2D Sprite Animation Studio
// File: source/js/site/anim_studio.js

var AnimStudio = {
  modal: null,
  sheetCanvas: null,
  sheetCtx: null,
  previewCanvas: null,
  previewCtx: null,

  currentImage: null,
  imageSrc: "",
  imageName: "",

  // Zoom & View
  zoom: 1.0,

  // Slicing settings
  cols: 4,
  rows: 2,

  // Selection box
  isSelecting: false,
  selectStartX: 0,
  selectStartY: 0,
  selectCurrentX: 0,
  selectCurrentY: 0,
  currentSelection: null,

  // Frames List: [ { image: 'sheet.png', position: {x, y}, scale: {x, y}, time: 5 } ]
  frames: [],

  // Live preview loop
  previewFrameIdx: 0,
  previewTimer: 0,
  fps: 8,
  isPlaying: true,
  animReqId: null,

  init: function() {
    this.modal = document.getElementById("anim-studio-modal");
    this.sheetCanvas = document.getElementById("anim-sheet-canvas");
    if (this.sheetCanvas) this.sheetCtx = this.sheetCanvas.getContext("2d");
    this.previewCanvas = document.getElementById("anim-preview-canvas");
    if (this.previewCanvas) this.previewCtx = this.previewCanvas.getContext("2d");

    this.setupEvents();
    this.startPreviewLoop();
  },

  open: function() {
    if (!this.modal) this.modal = document.getElementById("anim-studio-modal");
    if (!this.modal) return;
    this.modal.style.display = "flex";
    this.isPlaying = true;
    this.loadImagesList();
    this.loadEntitiesList();
    this.startPreviewLoop();
    this.drawPreviewFrame();
    setTimeout(() => {
      if (this.currentImage) this.fitToView();
      this.drawPreviewFrame();
    }, 100);
  },

  close: function() {
    if (!this.modal) return;
    this.modal.style.display = "none";
  },

  loadImagesList: function() {
    const select = document.getElementById("anim-image-select");
    if (!select) return;
    select.innerHTML = "<option value=''>-- Select Sprite Sheet --</option>";

    const added = new Set();
    const addOpt = (imgName) => {
      if (!imgName || added.has(imgName)) return;
      added.add(imgName);
      const opt = document.createElement("option");
      opt.value = imgName;
      opt.innerText = imgName;
      select.appendChild(opt);
    };

    // 1. Fetch from backend /getimages API
    fetch("/getimages")
      .then(res => res.json())
      .then(list => {
        if (Array.isArray(list)) {
          list.forEach(name => addOpt(name));
        }
      })
      .catch(() => {})
      .finally(() => {
        // 2. Also check DOM images inside iframe
        try {
          const iframe = document.getElementById("mainiframe");
          if (iframe && iframe.contentWindow && iframe.contentWindow.document) {
            const imgs = iframe.contentWindow.document.querySelectorAll("#images img");
            imgs.forEach(img => {
              if (img.id && !img.id.includes("Background")) {
                addOpt(img.id);
              }
            });
          }
        } catch (e) {}
      });
  },

  entitiesData: new Map(),

  loadEntitiesList: function() {
    const select = document.getElementById("anim-entity-select");
    if (!select) return;
    select.innerHTML = "";
    this.entitiesData.clear();

    fetch("/getsceneentities")
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          data.forEach(ent => {
            if (ent.data && ent.data.name) {
              this.entitiesData.set(ent.data.name, ent.data);
              const opt = document.createElement("option");
              opt.value = ent.data.name;
              opt.innerText = ent.data.name;
              select.appendChild(opt);
            }
          });

          // Check if current selected entity has existing animation frames
          const activeEnt = select.value;
          if (activeEnt) {
            this.onEntityChanged(activeEnt);
          }
        }
      })
      .catch(() => {});
  },

  onEntityChanged: function(entName) {
    if (!entName) return;
    const entData = this.entitiesData.get(entName);
    if (!entData) return;

    // Restore existing animation frames if present
    if (entData.animate && Array.isArray(entData.animate) && entData.animate.length > 0) {
      this.frames = JSON.parse(JSON.stringify(entData.animate));
      const firstFrame = this.frames[0];
      const imgName = firstFrame.image || entData.image;

      if (firstFrame.time) {
        const fps = Math.max(1, Math.min(Math.round(60 / firstFrame.time), 60));
        this.setFPS(fps);
        const fpsSlider = document.querySelector(".anim-slider");
        if (fpsSlider) fpsSlider.value = this.fps;
      }

      if (imgName) {
        const imgSelect = document.getElementById("anim-image-select");
        if (imgSelect) imgSelect.value = imgName;
        this.selectImage(imgName, () => {
          this.previewFrameIdx = 0;
          this.renderTimeline();
          this.renderSheet();
          this.drawPreviewFrame();
        });
      } else {
        this.previewFrameIdx = 0;
        this.renderTimeline();
        this.renderSheet();
        this.drawPreviewFrame();
      }
    }
  },

  selectImage: function(imgId, callback) {
    if (!imgId) return;
    this.imageName = imgId;

    const targetUrl = "/getimagefile?name=" + encodeURIComponent(imgId);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      this.currentImage = img;
      this.imageSrc = targetUrl;
      this.renderSheet();
      this.fitToView();
      if (typeof callback === "function") callback();
    };
    img.onerror = () => {
      const fb = new Image();
      fb.onload = () => {
        this.currentImage = fb;
        this.imageSrc = fb.src;
        this.renderSheet();
        this.fitToView();
        if (typeof callback === "function") callback();
      };
      fb.src = "./Images/" + imgId;
    };
    img.src = targetUrl;
  },

  setZoom: function(newZoom) {
    this.zoom = Math.max(0.2, Math.min(newZoom, 8.0));
    const stage = document.getElementById("anim-sheet-stage");
    if (stage) {
      stage.style.transform = `scale(${this.zoom})`;
    }
    const badge = document.getElementById("anim-zoom-val");
    if (badge) badge.innerText = Math.round(this.zoom * 100) + "%";
  },

  zoomIn: function() {
    this.setZoom(this.zoom * 1.25);
  },

  zoomOut: function() {
    this.setZoom(this.zoom / 1.25);
  },

  resetZoom: function() {
    this.setZoom(1.0);
  },

  fitToView: function() {
    const wrap = document.getElementById("anim-canvas-wrap");
    if (!wrap || !this.currentImage) {
      this.setZoom(1.0);
      return;
    }
    const imgW = this.currentImage.naturalWidth || this.currentImage.width || 400;
    const imgH = this.currentImage.naturalHeight || this.currentImage.height || 300;
    const wrapW = wrap.clientWidth - 40;
    const wrapH = wrap.clientHeight - 40;

    const scale = Math.min(wrapW / imgW, wrapH / imgH, 1.0);
    this.setZoom(scale > 0 ? scale : 1.0);
  },

  renderSheet: function() {
    this.sheetCanvas = document.getElementById("anim-sheet-canvas");
    if (!this.sheetCanvas || !this.currentImage) return;
    this.sheetCtx = this.sheetCanvas.getContext("2d");

    const img = this.currentImage;
    const w = img.naturalWidth || img.width || 400;
    const h = img.naturalHeight || img.height || 300;

    this.sheetCanvas.width = w;
    this.sheetCanvas.height = h;

    const colsInput = document.getElementById("anim-grid-cols");
    const rowsInput = document.getElementById("anim-grid-rows");
    if (colsInput) this.cols = parseInt(colsInput.value) || 4;
    if (rowsInput) this.rows = parseInt(rowsInput.value) || 2;

    const ctx = this.sheetCtx;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    // Draw Grid overlay if enabled
    const showGrid = document.getElementById("anim-show-grid") ? document.getElementById("anim-show-grid").checked : true;
    if (showGrid && this.cols > 0 && this.rows > 0) {
      const cellW = w / this.cols;
      const cellH = h / this.rows;

      ctx.strokeStyle = "rgba(127, 90, 240, 0.6)";
      ctx.lineWidth = 1.5;
      for (let c = 0; c <= this.cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, h);
        ctx.stroke();
      }
      for (let r = 0; r <= this.rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(w, r * cellH);
        ctx.stroke();
      }
    }

    // Draw active selection box
    if (this.isSelecting || this.currentSelection) {
      const sx = this.isSelecting ? this.selectStartX : this.currentSelection.x;
      const sy = this.isSelecting ? this.selectStartY : this.currentSelection.y;
      const cx = this.isSelecting ? this.selectCurrentX : (this.currentSelection.x + this.currentSelection.w);
      const cy = this.isSelecting ? this.selectCurrentY : (this.currentSelection.y + this.currentSelection.h);

      const x = Math.min(sx, cx);
      const y = Math.min(sy, cy);
      const sw = Math.abs(cx - sx);
      const sh = Math.abs(cy - sy);

      ctx.fillStyle = "rgba(44, 182, 125, 0.35)";
      ctx.fillRect(x, y, sw, sh);
      ctx.strokeStyle = "#2cb67d";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, sw, sh);
    }
  },

  setupEvents: function() {
    this.sheetCanvas = document.getElementById("anim-sheet-canvas");
    const wrap = document.getElementById("anim-canvas-wrap");
    if (!this.sheetCanvas || !wrap) return;

    // Mouse Wheel Zoom
    wrap.addEventListener("wheel", (e) => {
      if (e.ctrlKey || e.metaKey || !e.shiftKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          this.setZoom(this.zoom * 1.15);
        } else {
          this.setZoom(this.zoom / 1.15);
        }
      }
    }, { passive: false });

    // Click grid cell to add it as a frame
    this.sheetCanvas.addEventListener("click", (e) => {
      if (!this.currentImage || e.button !== 0 || this.cols <= 0 || this.rows <= 0) return;
      const rect = this.sheetCanvas.getBoundingClientRect();
      const rx = (e.clientX - rect.left) / this.zoom;
      const ry = (e.clientY - rect.top) / this.zoom;

      const cellW = Math.round(this.sheetCanvas.width / this.cols);
      const cellH = Math.round(this.sheetCanvas.height / this.rows);
      const col = Math.floor(rx / cellW);
      const row = Math.floor(ry / cellH);

      if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
        const fx = col * cellW;
        const fy = row * cellH;
        this.addFrame(fx, fy, cellW, cellH);
        if (window.iziToast) iziToast.info({ title: "Cell Added", message: `Col ${col + 1}, Row ${row + 1}` });
      }
    });
  },

  autoSliceGrid: function() {
    if (!this.currentImage || !this.sheetCanvas) return;
    const colsInput = document.getElementById("anim-grid-cols");
    const rowsInput = document.getElementById("anim-grid-rows");
    this.cols = colsInput ? parseInt(colsInput.value) || 4 : 4;
    this.rows = rowsInput ? parseInt(rowsInput.value) || 2 : 2;

    const w = this.sheetCanvas.width;
    const h = this.sheetCanvas.height;
    const cellW = Math.round(w / this.cols);
    const cellH = Math.round(h / this.rows);

    this.frames = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.frames.push({
          image: this.imageName,
          position: { x: c * cellW, y: r * cellH },
          scale: { x: cellW, y: cellH },
          time: Math.round(60 / this.fps)
        });
      }
    }
    this.previewFrameIdx = 0;
    this.renderTimeline();
    this.renderSheet();
    this.drawPreviewFrame();
    if (window.iziToast) iziToast.success({ title: "Grid Sliced", message: `Generated ${this.frames.length} frames!` });
  },

  addFrame: function(x, y, w, h) {
    if (!this.imageName) return;
    this.frames.push({
      image: this.imageName,
      position: { x: x, y: y },
      scale: { x: w, y: h },
      time: Math.round(60 / this.fps)
    });
    this.renderTimeline();
    this.drawPreviewFrame();
  },

  deleteFrame: function(index) {
    this.frames.splice(index, 1);
    if (this.previewFrameIdx >= this.frames.length) {
      this.previewFrameIdx = 0;
    }
    this.renderTimeline();
    this.drawPreviewFrame();
  },

  clearAllFrames: function() {
    this.frames = [];
    this.previewFrameIdx = 0;
    this.renderTimeline();
    this.drawPreviewFrame();
  },

  renderTimeline: function() {
    const list = document.getElementById("anim-timeline-frames");
    if (!list) return;
    list.innerHTML = "";

    this.frames.forEach((f, idx) => {
      const item = document.createElement("div");
      item.className = "anim-frame-card";
      item.innerHTML = `
        <div class="anim-frame-thumb-wrap">
          <canvas class="anim-frame-thumb" width="${f.scale.x}" height="${f.scale.y}"></canvas>
        </div>
        <div class="anim-frame-info">Frame ${idx + 1} (${f.scale.x}x${f.scale.y})</div>
        <i class="fa-solid fa-trash anim-frame-del" onclick="AnimStudio.deleteFrame(${idx})" title="Delete Frame"></i>
      `;
      const thumbCanvas = item.querySelector("canvas");
      if (thumbCanvas && this.currentImage) {
        const tctx = thumbCanvas.getContext("2d");
        tctx.drawImage(this.currentImage, f.position.x, f.position.y, f.scale.x, f.scale.y, 0, 0, f.scale.x, f.scale.y);
      }
      list.appendChild(item);
    });

    const countBadge = document.getElementById("anim-frame-count");
    if (countBadge) countBadge.innerText = this.frames.length + " Frames";
  },

  drawPreviewFrame: function() {
    this.previewCanvas = document.getElementById("anim-preview-canvas");
    if (!this.previewCanvas || !this.currentImage) return;
    this.previewCtx = this.previewCanvas.getContext("2d");

    if (!this.frames || this.frames.length === 0) {
      this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
      return;
    }

    if (this.previewFrameIdx >= this.frames.length) {
      this.previewFrameIdx = 0;
    }

    const f = this.frames[this.previewFrameIdx];
    if (!f || !f.scale || f.scale.x <= 0 || f.scale.y <= 0) return;

    const fw = f.scale.x;
    const fh = f.scale.y;
    if (this.previewCanvas.width !== fw || this.previewCanvas.height !== fh) {
      this.previewCanvas.width = fw;
      this.previewCanvas.height = fh;
    }
    this.previewCtx.imageSmoothingEnabled = false;
    this.previewCtx.clearRect(0, 0, fw, fh);
    this.previewCtx.drawImage(this.currentImage, f.position.x, f.position.y, fw, fh, 0, 0, fw, fh);
  },

  startPreviewLoop: function() {
    if (this.animReqId) cancelAnimationFrame(this.animReqId);
    let lastTime = performance.now();
    this.previewTimer = 0;

    const loop = (now) => {
      const dt = now - lastTime;
      lastTime = now;

      if (this.isPlaying && this.frames && this.frames.length > 0 && this.currentImage) {
        this.previewTimer += dt;
        const interval = 1000 / Math.max(1, this.fps);
        if (this.previewTimer >= interval) {
          this.previewTimer = this.previewTimer % interval;
          this.previewFrameIdx = (this.previewFrameIdx + 1) % this.frames.length;
          this.drawPreviewFrame();
        }
      }

      this.animReqId = requestAnimationFrame(loop);
    };

    this.animReqId = requestAnimationFrame(loop);
  },

  setFPS: function(val) {
    this.fps = Math.max(1, Math.min(parseInt(val) || 8, 60));
    const badge = document.getElementById("anim-fps-val");
    if (badge) badge.innerText = this.fps + " FPS";
    this.frames.forEach(f => {
      f.time = Math.round(60 / this.fps);
    });
  },

  togglePlay: function() {
    this.isPlaying = !this.isPlaying;
    const btn = document.getElementById("anim-play-btn");
    if (btn) {
      btn.innerHTML = this.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    }
  },

  applyAnimationToEntity: function() {
    const entSelect = document.getElementById("anim-entity-select");
    const entName = entSelect ? entSelect.value : "";
    if (!entName) {
      if (window.iziToast) iziToast.warning({ title: "No Entity", message: "Please select an entity to attach animation." });
      return;
    }
    if (this.frames.length === 0) {
      if (window.iziToast) iziToast.warning({ title: "No Frames", message: "Please slice or add at least 1 frame." });
      return;
    }

    // 1. Update live iframe
    const iframe = document.getElementById("mainiframe");
    if (iframe && iframe.contentWindow && typeof iframe.contentWindow.updateData === "function") {
      iframe.contentWindow.updateData({
        name: entName,
        animate: this.frames,
        animatedata: { val: 0, time: 0 }
      });
    }

    // 2. Persist to script.js
    fetch("/setdata", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        name: entName,
        type: "Component",
        data: JSON.stringify({
          animate: this.frames,
          animatedata: { val: 0, time: 0 },
          scale: { x: this.frames[0].scale.x, y: this.frames[0].scale.y }
        }),
        file: "script.js"
      })
    })
    .then(() => {
      if (this.entitiesData.has(entName)) {
        const d = this.entitiesData.get(entName);
        d.animate = JSON.parse(JSON.stringify(this.frames));
      }
      if (window.iziToast) {
        iziToast.success({
          title: "Animation Saved!",
          message: `Attached ${this.frames.length} frames to '${entName}'.`
        });
      }
      this.close();
    })
    .catch(err => {
      if (window.iziToast) iziToast.error({ title: "Save Error", message: err.message });
    });
  }
};

window.AnimStudio = AnimStudio;
function openAnimationStudio() {
  AnimStudio.open();
}
