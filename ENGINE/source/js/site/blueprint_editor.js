// Electoria Engine - Visual Scripting & Blueprint System
// File: source/js/site/blueprint_editor.js

var BlueprintEditor = {
  container: null,
  stage: null,
  canvas: null,
  svgLayer: null,
  nodes: [],
  connections: [],
  
  zoom: 1,
  panX: 40,
  panY: 40,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  
  draggedNode: null,
  dragNodeOffsetX: 0,
  dragNodeOffsetY: 0,
  
  activeConnectingPin: null, // { nodeId, pinName, pinType, isOutput, x, y }
  
  NODE_DEFINITIONS: {
    // EVENTS
    "Event_OnStart": {
      title: "On Start",
      category: "Events",
      headerColor: "#e53e3e",
      inputs: [],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: []
    },
    "Event_OnKeyPress": {
      title: "On Key Press",
      category: "Events",
      headerColor: "#e53e3e",
      inputs: [],
      outputs: [
        { name: "Exec", type: "exec" },
        { name: "Key", type: "string" }
      ],
      params: [
        { name: "key", label: "Key", type: "select", options: ["ANY", "SPACE", "ARROWUP", "ARROWDOWN", "ARROWLEFT", "ARROWRIGHT", "W", "A", "S", "D", "ENTER"], default: "ANY" }
      ]
    },
    "Event_OnCollision": {
      title: "On Collision",
      category: "Events",
      headerColor: "#e53e3e",
      inputs: [],
      outputs: [
        { name: "Exec", type: "exec" },
        { name: "OtherEntity", type: "string" },
        { name: "Side", type: "string" }
      ],
      params: [
        { name: "entity", label: "Self Entity", type: "text", default: "player" }
      ]
    },
    "Event_OnClick": {
      title: "On Click",
      category: "Events",
      headerColor: "#e53e3e",
      inputs: [],
      outputs: [
        { name: "Exec", type: "exec" },
        { name: "ClickedEntity", type: "string" }
      ],
      params: []
    },
    "Event_OnTick": {
      title: "On Tick / Update",
      category: "Events",
      headerColor: "#e53e3e",
      inputs: [],
      outputs: [
        { name: "Exec", type: "exec" },
        { name: "DeltaTime", type: "number" }
      ],
      params: []
    },

    // VALUES & LITERALS
    "Val_String": {
      title: "String (Text)",
      category: "Values",
      headerColor: "#4fd1c5",
      inputs: [
        { name: "Input", type: "string" }
      ],
      outputs: [
        { name: "Value", type: "string" }
      ],
      params: [
        { name: "value", label: "Text", type: "text", default: "S" }
      ]
    },
    "Val_Number": {
      title: "Number",
      category: "Values",
      headerColor: "#4fd1c5",
      inputs: [
        { name: "Input", type: "number" }
      ],
      outputs: [
        { name: "Value", type: "number" }
      ],
      params: [
        { name: "value", label: "Number", type: "number", default: 10 }
      ]
    },
    "Val_Boolean": {
      title: "Boolean",
      category: "Values",
      headerColor: "#4fd1c5",
      inputs: [],
      outputs: [
        { name: "Value", type: "boolean" }
      ],
      params: [
        { name: "value", label: "Bool", type: "select", options: ["true", "false"], default: "true" }
      ]
    },
    "String_Concat": {
      title: "Combine Text (Concat)",
      category: "Values",
      headerColor: "#4fd1c5",
      inputs: [
        { name: "A", type: "string" },
        { name: "B", type: "string" }
      ],
      outputs: [
        { name: "Result", type: "string" }
      ],
      params: [
        { name: "valA", label: "Text A", type: "text", default: "Score: " },
        { name: "valB", label: "Text B", type: "text", default: "0" }
      ]
    },

    // ACTIONS & ENTITIES
    "Action_SetText": {
      title: "Set Text",
      category: "Actions",
      headerColor: "#3182ce",
      inputs: [
        { name: "Exec", type: "exec" },
        { name: "Text", type: "string" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "entity", label: "Entity Name", type: "text", default: "score_text" },
        { name: "text", label: "New Text", type: "text", default: "Hello" }
      ]
    },
    "Action_SetColor": {
      title: "Set Color",
      category: "Actions",
      headerColor: "#3182ce",
      inputs: [
        { name: "Exec", type: "exec" },
        { name: "Color", type: "string" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "entity", label: "Entity Name", type: "text", default: "player" },
        { name: "color", label: "Color", type: "text", default: "#ff8906" }
      ]
    },
    "Action_SetPosition": {
      title: "Set Position",
      category: "Actions",
      headerColor: "#3182ce",
      inputs: [
        { name: "Exec", type: "exec" },
        { name: "X", type: "number" },
        { name: "Y", type: "number" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "entity", label: "Entity Name", type: "text", default: "player" },
        { name: "x", label: "X", type: "number", default: 200 },
        { name: "y", label: "Y", type: "number", default: 200 }
      ]
    },
    "Action_DestroyEntity": {
      title: "Destroy Entity",
      category: "Actions",
      headerColor: "#3182ce",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "entity", label: "Entity Name", type: "text", default: "enemy" }
      ]
    },

    // TIMERS & LOOPS
    "Flow_SetInterval": {
      title: "Set Interval (Timer)",
      category: "Timers & Loops",
      headerColor: "#805ad5",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "Loop", type: "exec" }
      ],
      params: [
        { name: "intervalMs", label: "Interval (ms)", type: "number", default: 1000 }
      ]
    },
    "Flow_Delay": {
      title: "Delay / Timeout",
      category: "Timers & Loops",
      headerColor: "#805ad5",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "Completed", type: "exec" }
      ],
      params: [
        { name: "durationMs", label: "Duration (ms)", type: "number", default: 500 }
      ]
    },
    "Flow_ForLoop": {
      title: "For Loop",
      category: "Timers & Loops",
      headerColor: "#805ad5",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "LoopBody", type: "exec" },
        { name: "Index", type: "number" },
        { name: "Completed", type: "exec" }
      ],
      params: [
        { name: "startIndex", label: "Start", type: "number", default: 0 },
        { name: "endIndex", label: "End", type: "number", default: 10 }
      ]
    },
    "Flow_Sequence": {
      title: "Sequence",
      category: "Timers & Loops",
      headerColor: "#805ad5",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "Then 0", type: "exec" },
        { name: "Then 1", type: "exec" },
        { name: "Then 2", type: "exec" }
      ],
      params: []
    },

    // CAMERA & PHYSICS
    "Action_CameraFollow": {
      title: "Camera Follow",
      category: "Camera & Physics",
      headerColor: "#3182ce",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "target", label: "Target Name", type: "text", default: "player" },
        { name: "lerp", label: "Lerp Speed", type: "number", default: 0.1 }
      ]
    },
    "Action_CameraShake": {
      title: "Camera Shake",
      category: "Camera & Physics",
      headerColor: "#3182ce",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "intensity", label: "Intensity", type: "number", default: 15 },
        { name: "durationMs", label: "Duration (ms)", type: "number", default: 400 }
      ]
    },
    "Action_CameraZoom": {
      title: "Camera Zoom",
      category: "Camera & Physics",
      headerColor: "#3182ce",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "zoomLevel", label: "Zoom Level", type: "number", default: 1 }
      ]
    },
    "Action_AddForce": {
      title: "Add Force",
      category: "Camera & Physics",
      headerColor: "#3182ce",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "entity", label: "Entity Name", type: "text", default: "player" },
        { name: "forceX", label: "Force X", type: "number", default: 0 },
        { name: "forceY", label: "Force Y", type: "number", default: -12 }
      ]
    },
    "Action_SetVelocity": {
      title: "Set Velocity",
      category: "Camera & Physics",
      headerColor: "#3182ce",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "entity", label: "Entity Name", type: "text", default: "player" },
        { name: "vx", label: "Velocity X", type: "number", default: 5 },
        { name: "vy", label: "Velocity Y", type: "number", default: 0 }
      ]
    },
    "Action_MoveTowards": {
      title: "Move Towards",
      category: "Camera & Physics",
      headerColor: "#3182ce",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "entity", label: "Entity Name", type: "text", default: "player" },
        { name: "targetX", label: "Target X", type: "number", default: 200 },
        { name: "targetY", label: "Target Y", type: "number", default: 200 },
        { name: "speed", label: "Speed", type: "number", default: 4 }
      ]
    },

    // MATH & LOGIC
    "Logic_Branch": {
      title: "Branch (If / Else)",
      category: "Math & Logic",
      headerColor: "#38a169",
      inputs: [
        { name: "Exec", type: "exec" },
        { name: "Condition", type: "boolean" }
      ],
      outputs: [
        { name: "True", type: "exec" },
        { name: "False", type: "exec" }
      ],
      params: []
    },
    "Logic_Compare": {
      title: "Compare",
      category: "Math & Logic",
      headerColor: "#38a169",
      inputs: [
        { name: "A", type: "any" },
        { name: "B", type: "any" }
      ],
      outputs: [
        { name: "Result", type: "boolean" }
      ],
      params: [
        { name: "valA", label: "Default A", type: "text", default: "" },
        { name: "op", label: "Op", type: "select", options: ["==", "!=", ">", "<", ">=", "<="], default: "==" },
        { name: "valB", label: "Default B", type: "text", default: "S" }
      ]
    },
    "Logic_MathOp": {
      title: "Math Operation",
      category: "Math & Logic",
      headerColor: "#38a169",
      inputs: [
        { name: "A", type: "number" },
        { name: "B", type: "number" }
      ],
      outputs: [
        { name: "Result", type: "number" }
      ],
      params: [
        { name: "valA", label: "Default A", type: "number", default: 0 },
        { name: "op", label: "Op", type: "select", options: ["+", "-", "*", "/"], default: "+" },
        { name: "valB", label: "Default B", type: "number", default: 1 }
      ]
    },

    // VARIABLES
    "Var_SetVariable": {
      title: "Set Variable",
      category: "Variables",
      headerColor: "#319795",
      inputs: [
        { name: "Exec", type: "exec" },
        { name: "Value", type: "any" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "varName", label: "Variable", type: "text", default: "score" },
        { name: "varValue", label: "Value", type: "text", default: "10" }
      ]
    },
    "Var_GetVariable": {
      title: "Get Variable",
      category: "Variables",
      headerColor: "#319795",
      inputs: [],
      outputs: [
        { name: "Value", type: "any" }
      ],
      params: [
        { name: "varName", label: "Variable", type: "text", default: "score" }
      ]
    },

    // CUSTOM CODE
    "Custom_Code": {
      title: "Custom JS Code",
      category: "Custom",
      headerColor: "#d69e2e",
      inputs: [
        { name: "Exec", type: "exec" }
      ],
      outputs: [
        { name: "Exec", type: "exec" }
      ],
      params: [
        { name: "code", label: "JavaScript", type: "textarea", default: "// Custom logic block\nconsole.log('Electoria script block executed');" }
      ]
    }
  },

  init: function() {
    this.container = document.getElementById("view-blueprint");
    if (!this.container) return;
    this.stage = document.getElementById("blueprint-stage");
    this.canvas = document.getElementById("blueprint-canvas");
    this.svgLayer = document.getElementById("blueprint-svg");
    
    this.setupEvents();
    this.loadGraph();
  },

  loadGraph: function() {
    fetch("/getblueprints")
      .then(res => res.json())
      .then(data => {
        if (data && data.nodes && data.nodes.length > 0) {
          this.nodes = data.nodes;
          this.connections = data.connections || [];
        } else {
          this.nodes = [
            { id: "node_1", type: "Event_OnStart", x: 100, y: 120, params: {} },
            { id: "node_2", type: "Action_CameraFollow", x: 380, y: 120, params: { target: "player", lerp: 0.1 } }
          ];
          this.connections = [
            { fromNode: "node_1", fromPin: "Exec", toNode: "node_2", toPin: "Exec" }
          ];
        }
        this.renderGraph();
      })
      .catch(() => {
        this.renderGraph();
      });
  },

  setupEvents: function() {
    const cont = this.container;
    if (!cont) return;

    cont.addEventListener("mousedown", (e) => {
      if (e.target.closest(".bp-node") || e.target.closest(".bp-palette") || e.target.closest(".bp-toolbar")) return;
      
      if (this.activeConnectingPin) {
        this.cancelConnecting();
        return;
      }
      
      this.isPanning = true;
      this.panStartX = e.clientX - this.panX;
      this.panStartY = e.clientY - this.panY;
      cont.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (this.isPanning) {
        this.panX = e.clientX - this.panStartX;
        this.panY = e.clientY - this.panStartY;
        this.updateCanvasTransform();
        return;
      }
      
      if (this.draggedNode && this.stage) {
        const stageRect = this.stage.getBoundingClientRect();
        const mouseGraphX = (e.clientX - stageRect.left) / this.zoom;
        const mouseGraphY = (e.clientY - stageRect.top) / this.zoom;
        
        this.draggedNode.x = Math.round(mouseGraphX - this.dragNodeOffsetX);
        this.draggedNode.y = Math.round(mouseGraphY - this.dragNodeOffsetY);
        
        const el = document.getElementById(this.draggedNode.id);
        if (el) {
          el.style.left = this.draggedNode.x + "px";
          el.style.top = this.draggedNode.y + "px";
        }
        this.renderConnections();
        return;
      }
      
      if (this.activeConnectingPin && this.stage) {
        const stageRect = this.stage.getBoundingClientRect();
        const mouseGraphX = (e.clientX - stageRect.left) / this.zoom;
        const mouseGraphY = (e.clientY - stageRect.top) / this.zoom;
        this.renderTempWire(this.activeConnectingPin.x, this.activeConnectingPin.y, mouseGraphX, mouseGraphY);
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (this.isPanning) {
        this.isPanning = false;
        cont.style.cursor = "default";
      }
      this.draggedNode = null;
      
      if (this.activeConnectingPin) {
        const targetEl = document.elementFromPoint(e.clientX, e.clientY);
        if (targetEl) {
          const pinParent = targetEl.closest(".bp-pin-in");
          if (pinParent && pinParent.dataset.nodeId !== this.activeConnectingPin.nodeId) {
            this.connectPins(
              this.activeConnectingPin.nodeId,
              this.activeConnectingPin.pinName,
              pinParent.dataset.nodeId,
              pinParent.dataset.pinName
            );
          }
        }
        this.cancelConnecting();
      }
    });

    cont.addEventListener("wheel", (e) => {
      if (e.target.closest(".bp-palette")) return;
      e.preventDefault();
      
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const stageRect = this.stage ? this.stage.getBoundingClientRect() : { left: 0, top: 0 };
      const graphBeforeX = (mouseX - stageRect.left) / this.zoom;
      const graphBeforeY = (mouseY - stageRect.top) / this.zoom;

      const factor = e.deltaY < 0 ? 1.12 : 0.88;
      const newZoom = Math.max(0.25, Math.min(this.zoom * factor, 3));
      this.zoom = newZoom;

      const contRect = this.container.getBoundingClientRect();
      this.panX = (mouseX - contRect.left) - graphBeforeX * this.zoom;
      this.panY = (mouseY - contRect.top) - graphBeforeY * this.zoom;

      this.updateCanvasTransform();
    });
    
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.cancelConnecting();
      }
    });
  },

  cancelConnecting: function() {
    const tempPath = document.getElementById("bp-temp-wire");
    if (tempPath) tempPath.remove();
    this.activeConnectingPin = null;
    document.querySelectorAll(".bp-pin").forEach(p => p.classList.remove("active-source"));
  },

  updateCanvasTransform: function() {
    if (!this.stage) this.stage = document.getElementById("blueprint-stage");
    if (!this.stage) return;
    
    this.stage.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    this.stage.style.transformOrigin = "0 0";
    
    const bgPos = `${this.panX}px ${this.panY}px`;
    const bgSize = `${40 * this.zoom}px ${40 * this.zoom}px`;
    if (this.container) {
      this.container.style.backgroundPosition = bgPos;
      this.container.style.backgroundSize = bgSize;
    }
  },

  addNode: function(type) {
    const def = this.NODE_DEFINITIONS[type];
    if (!def) return;
    const id = "node_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const initialParams = {};
    if (def.params) {
      def.params.forEach(p => {
        initialParams[p.name] = p.default;
      });
    }
    const spawnX = Math.round((-this.panX + this.container.clientWidth / 2) / this.zoom - 100);
    const spawnY = Math.round((-this.panY + this.container.clientHeight / 2) / this.zoom - 60);

    const newNode = {
      id: id,
      type: type,
      x: spawnX,
      y: spawnY,
      params: initialParams
    };
    this.nodes.push(newNode);
    this.renderGraph();
  },

  deleteNode: function(nodeId) {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.connections = this.connections.filter(c => c.fromNode !== nodeId && c.toNode !== nodeId);
    this.renderGraph();
  },

  deleteConnection: function(index) {
    this.connections.splice(index, 1);
    this.renderConnections();
  },

  renderGraph: function() {
    if (!this.canvas) this.canvas = document.getElementById("blueprint-canvas");
    if (!this.canvas) return;
    this.canvas.innerHTML = "";

    this.nodes.forEach(node => {
      const def = this.NODE_DEFINITIONS[node.type];
      if (!def) return;

      const nodeEl = document.createElement("div");
      nodeEl.className = "bp-node";
      nodeEl.id = node.id;
      nodeEl.style.left = node.x + "px";
      nodeEl.style.top = node.y + "px";

      // Header
      const header = document.createElement("div");
      header.className = "bp-node-header";
      header.style.backgroundColor = def.headerColor || "#4a5568";
      header.innerHTML = `<span>${def.title}</span><i class="fa-solid fa-trash bp-node-del" title="Delete Node" onclick="BlueprintEditor.deleteNode('${node.id}')"></i>`;
      
      // Node Dragging
      header.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("bp-node-del")) return;
        this.draggedNode = node;
        const stageRect = this.stage.getBoundingClientRect();
        const mouseGraphX = (e.clientX - stageRect.left) / this.zoom;
        const mouseGraphY = (e.clientY - stageRect.top) / this.zoom;
        this.dragNodeOffsetX = mouseGraphX - node.x;
        this.dragNodeOffsetY = mouseGraphY - node.y;
      });
      nodeEl.appendChild(header);

      // Body (Inputs, Params, Outputs)
      const body = document.createElement("div");
      body.className = "bp-node-body";

      // Parameters form
      if (def.params && def.params.length > 0) {
        const paramContainer = document.createElement("div");
        paramContainer.className = "bp-node-params";
        def.params.forEach(p => {
          const val = node.params[p.name] !== undefined ? node.params[p.name] : p.default;
          const row = document.createElement("div");
          row.className = "bp-param-row";

          if (p.type === "select") {
            row.innerHTML = `<label>${p.label}</label><select onchange="BlueprintEditor.updateParam('${node.id}', '${p.name}', this.value)">${p.options.map(opt => `<option value="${opt}" ${String(opt) === String(val) ? 'selected' : ''}>${opt}</option>`).join("")}</select>`;
          } else if (p.type === "textarea") {
            row.innerHTML = `<label>${p.label}</label><textarea rows="3" oninput="BlueprintEditor.updateParam('${node.id}', '${p.name}', this.value)" onchange="BlueprintEditor.updateParam('${node.id}', '${p.name}', this.value)">${val}</textarea>`;
          } else {
            row.innerHTML = `<label>${p.label}</label><input type="${p.type}" value="${val}" oninput="BlueprintEditor.updateParam('${node.id}', '${p.name}', this.value)" onchange="BlueprintEditor.updateParam('${node.id}', '${p.name}', this.value)">`;
          }

          // Stop drag/pan propagation on interactive form controls
          const ctrl = row.querySelector("input, select, textarea");
          if (ctrl) {
            ctrl.addEventListener("mousedown", (e) => e.stopPropagation());
            ctrl.addEventListener("keydown", (e) => e.stopPropagation());
          }

          paramContainer.appendChild(row);
        });
        body.appendChild(paramContainer);
      }

      // Pins Row
      const pinsRow = document.createElement("div");
      pinsRow.className = "bp-pins-row";

      // Input pins column
      const inCol = document.createElement("div");
      inCol.className = "bp-pins-col bp-inputs";
      (def.inputs || []).forEach(pin => {
        const pinEl = document.createElement("div");
        pinEl.className = `bp-pin bp-pin-in bp-pin-${pin.type}`;
        pinEl.dataset.nodeId = node.id;
        pinEl.dataset.pinName = pin.name;
        pinEl.dataset.pinType = pin.type;
        pinEl.innerHTML = `<span class="bp-pin-icon ${pin.type === 'exec' ? 'exec-icon' : 'data-icon'}"></span><span class="bp-pin-label">${pin.name}</span>`;
        
        // Pin Click to Connect
        pinEl.addEventListener("click", (e) => {
          e.stopPropagation();
          if (this.activeConnectingPin && this.activeConnectingPin.isOutput && this.activeConnectingPin.nodeId !== node.id) {
            this.connectPins(this.activeConnectingPin.nodeId, this.activeConnectingPin.pinName, node.id, pin.name);
            this.cancelConnecting();
          }
        });
        inCol.appendChild(pinEl);
      });
      pinsRow.appendChild(inCol);

      // Output pins column
      const outCol = document.createElement("div");
      outCol.className = "bp-pins-col bp-outputs";
      (def.outputs || []).forEach(pin => {
        const pinEl = document.createElement("div");
        pinEl.className = `bp-pin bp-pin-out bp-pin-${pin.type}`;
        pinEl.dataset.nodeId = node.id;
        pinEl.dataset.pinName = pin.name;
        pinEl.dataset.pinType = pin.type;
        pinEl.innerHTML = `<span class="bp-pin-label">${pin.name}</span><span class="bp-pin-icon ${pin.type === 'exec' ? 'exec-icon' : 'data-icon'}"></span>`;
        
        const startConn = (e) => {
          e.stopPropagation();
          const pos = this.getPinPosition(node.id, pin.name, true);
          if (!pos) return;
          this.activeConnectingPin = {
            nodeId: node.id,
            pinName: pin.name,
            pinType: pin.type,
            isOutput: true,
            x: pos.x,
            y: pos.y
          };
          pinEl.classList.add("active-source");
        };

        pinEl.addEventListener("mousedown", startConn);
        pinEl.addEventListener("click", startConn);
        outCol.appendChild(pinEl);
      });
      pinsRow.appendChild(outCol);

      body.appendChild(pinsRow);
      nodeEl.appendChild(body);
      this.canvas.appendChild(nodeEl);
    });

    this.updateCanvasTransform();
    setTimeout(() => this.renderConnections(), 20);
  },

  updateParam: function(nodeId, paramName, val) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      node.params[paramName] = val;
    }
  },

  connectPins: function(fromNode, fromPin, toNode, toPin) {
    const exists = this.connections.some(c => c.fromNode === fromNode && c.fromPin === fromPin && c.toNode === toNode && c.toPin === toPin);
    if (exists) return;
    this.connections.push({ fromNode, fromPin, toNode, toPin });
    this.renderConnections();
  },

  getPinPosition: function(nodeId, pinName, isOutput) {
    const nodeEl = document.getElementById(nodeId);
    if (!nodeEl || !this.stage) return null;
    const selector = isOutput 
      ? `.bp-pin-out[data-pin-name="${pinName}"] .bp-pin-icon` 
      : `.bp-pin-in[data-pin-name="${pinName}"] .bp-pin-icon`;
    const pinIcon = nodeEl.querySelector(selector);
    if (!pinIcon) return null;

    const iconRect = pinIcon.getBoundingClientRect();
    const stageRect = this.stage.getBoundingClientRect();

    return {
      x: (iconRect.left + iconRect.width / 2 - stageRect.left) / this.zoom,
      y: (iconRect.top + iconRect.height / 2 - stageRect.top) / this.zoom
    };
  },

  renderConnections: function() {
    if (!this.svgLayer) this.svgLayer = document.getElementById("blueprint-svg");
    if (!this.svgLayer) return;
    this.svgLayer.innerHTML = "";

    this.connections.forEach((conn, index) => {
      const p1 = this.getPinPosition(conn.fromNode, conn.fromPin, true);
      const p2 = this.getPinPosition(conn.toNode, conn.toPin, false);
      if (!p1 || !p2) return;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const dx = Math.max(60, Math.abs(p2.x - p1.x) * 0.5);
      const d = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
      path.setAttribute("d", d);
      path.setAttribute("class", "bp-wire");
      path.setAttribute("stroke-width", "3.5");
      path.setAttribute("fill", "none");
      
      const isExec = conn.fromPin === "Exec" || conn.fromPin === "Loop" || conn.fromPin.startsWith("Then") || conn.fromPin === "True" || conn.fromPin === "False" || conn.fromPin === "Completed";
      path.setAttribute("stroke", isExec ? "#ffffff" : "#3da9fc");
      
      path.addEventListener("click", () => {
        if (confirm("Delete connection wire?")) {
          this.deleteConnection(index);
        }
      });
      this.svgLayer.appendChild(path);
    });
  },

  renderTempWire: function(x1, y1, x2, y2) {
    if (!this.svgLayer) this.svgLayer = document.getElementById("blueprint-svg");
    if (!this.svgLayer) return;
    
    let tempPath = document.getElementById("bp-temp-wire");
    if (!tempPath) {
      tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      tempPath.setAttribute("id", "bp-temp-wire");
      tempPath.setAttribute("class", "bp-wire-temp");
      tempPath.setAttribute("stroke", "#ff8906");
      tempPath.setAttribute("stroke-width", "3.5");
      tempPath.setAttribute("fill", "none");
      this.svgLayer.appendChild(tempPath);
    }
    const dx = Math.max(60, Math.abs(x2 - x1) * 0.5);
    const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    tempPath.setAttribute("d", d);
  },

  // Code Generation & Compilation
  compileToJavaScript: function() {
    let code = `/*\n * Auto-Generated by Electoria Engine Visual Scripting\n * Generated at: ${new Date().toISOString()}\n */\n\n`;
    code += `// Visual Scripting State Variables\nvar BP_VARS = {};\n\n`;

    const getNextNode = (nodeId, pinName = "Exec") => {
      const conn = this.connections.find(c => c.fromNode === nodeId && c.fromPin === pinName);
      return conn ? this.nodes.find(n => n.id === conn.toNode) : null;
    };

    const getDataInput = (nodeId, pinName, defaultVal = "null") => {
      const conn = this.connections.find(c => c.toNode === nodeId && c.toPin === pinName);
      if (!conn) return defaultVal;
      const srcNode = this.nodes.find(n => n.id === conn.fromNode);
      if (!srcNode) return defaultVal;
      const sp = srcNode.params || {};

      switch (srcNode.type) {
        case "Val_String":
          const strIn = getDataInput(srcNode.id, "Input", null);
          if (strIn !== null) return strIn;
          return JSON.stringify(sp.value !== undefined ? String(sp.value) : "S");
        case "Val_Number":
          const numIn = getDataInput(srcNode.id, "Input", null);
          if (numIn !== null) return numIn;
          return Number(sp.value !== undefined ? sp.value : 0);
        case "Val_Boolean":
          return sp.value === "false" || sp.value === false ? "false" : "true";
        case "String_Concat":
          const ca = getDataInput(srcNode.id, "A", JSON.stringify(sp.valA || "Score: "));
          const cb = getDataInput(srcNode.id, "B", JSON.stringify(sp.valB || "0"));
          return `(String(${ca}) + String(${cb}))`;
        case "Var_GetVariable":
          return `(BP_VARS["${sp.varName || 'score'}"] !== undefined ? BP_VARS["${sp.varName || 'score'}"] : 0)`;
        case "Event_OnKeyPress":
          return `(typeof event !== 'undefined' && event && event.key ? event.key.toUpperCase() : '')`;
        case "Logic_Compare":
          const a = getDataInput(srcNode.id, "A", JSON.stringify(sp.valA || ""));
          const b = getDataInput(srcNode.id, "B", JSON.stringify(sp.valB || ""));
          const op = sp.op || "==";
          return `(${a} ${op} ${b})`;
        case "Logic_MathOp":
          const ma = getDataInput(srcNode.id, "A", Number(sp.valA || 0));
          const mb = getDataInput(srcNode.id, "B", Number(sp.valB || 0));
          const mop = sp.op || "+";
          return `(${ma} ${mop} ${mb})`;
        default:
          return defaultVal;
      }
    };

    const generateChain = (node, indent = "") => {
      if (!node) return "";
      let chunk = "";
      const p = node.params || {};

      switch (node.type) {
        case "Action_SetText":
          chunk += `${indent}{\n`;
          chunk += `${indent}  let ent = typeof getData === "function" ? getData("${p.entity || 'score_text'}") : null;\n`;
          chunk += `${indent}  if (ent) {\n`;
          chunk += `${indent}    ent.text = ${getDataInput(node.id, "Text", JSON.stringify(p.text || 'Hello'))};\n`;
          chunk += `${indent}  }\n`;
          chunk += `${indent}}\n`;
          break;
        case "Action_SetColor":
          chunk += `${indent}{\n`;
          chunk += `${indent}  let ent = typeof getData === "function" ? getData("${p.entity || 'player'}") : null;\n`;
          chunk += `${indent}  if (ent) {\n`;
          chunk += `${indent}    ent.color = ${getDataInput(node.id, "Color", JSON.stringify(p.color || '#ff8906'))};\n`;
          chunk += `${indent}  }\n`;
          chunk += `${indent}}\n`;
          break;
        case "Action_SetPosition":
          chunk += `${indent}{\n`;
          chunk += `${indent}  let ent = typeof getData === "function" ? getData("${p.entity || 'player'}") : null;\n`;
          chunk += `${indent}  if (ent && ent.position) {\n`;
          chunk += `${indent}    ent.position.x = ${getDataInput(node.id, "X", Number(p.x || 200))};\n`;
          chunk += `${indent}    ent.position.y = ${getDataInput(node.id, "Y", Number(p.y || 200))};\n`;
          chunk += `${indent}  }\n`;
          chunk += `${indent}}\n`;
          break;
        case "Action_DestroyEntity":
          chunk += `${indent}if (typeof removeData === "function") {\n`;
          chunk += `${indent}  removeData("${p.entity || 'enemy'}");\n`;
          chunk += `${indent}}\n`;
          break;
        case "Action_CameraFollow":
          chunk += `${indent}Camera.follow("${p.target || 'player'}", ${Number(p.lerp || 0.1)});\n`;
          break;
        case "Action_CameraShake":
          chunk += `${indent}Camera.shake(${Number(p.intensity || 15)}, ${Number(p.durationMs || 400)});\n`;
          break;
        case "Action_CameraZoom":
          chunk += `${indent}Camera.zoom(${Number(p.zoomLevel || 1)});\n`;
          break;
        case "Action_AddForce":
          chunk += `${indent}{\n`;
          chunk += `${indent}  let ent = typeof getData === "function" ? getData("${p.entity || 'player'}") : null;\n`;
          chunk += `${indent}  if (ent) {\n`;
          chunk += `${indent}    if (!ent.physic) ent.physic = { status: true, x: 0, y: 0 };\n`;
          chunk += `${indent}    ent.physic.status = true;\n`;
          chunk += `${indent}    ent.physic.x = (Number(ent.physic.x) || 0) + ${Number(p.forceX || 0)};\n`;
          chunk += `${indent}    ent.physic.y = (Number(ent.physic.y) || 0) + ${Number(p.forceY || 0)};\n`;
          chunk += `${indent}  }\n`;
          chunk += `${indent}}\n`;
          break;
        case "Action_SetVelocity":
          chunk += `${indent}{\n`;
          chunk += `${indent}  let ent = typeof getData === "function" ? getData("${p.entity || 'player'}") : null;\n`;
          chunk += `${indent}  if (ent) {\n`;
          chunk += `${indent}    if (!ent.physic) ent.physic = { status: true, x: 0, y: 0 };\n`;
          chunk += `${indent}    ent.physic.status = true;\n`;
          chunk += `${indent}    ent.physic.x = ${Number(p.vx || 0)};\n`;
          chunk += `${indent}    ent.physic.y = ${Number(p.vy || 0)};\n`;
          chunk += `${indent}  }\n`;
          chunk += `${indent}}\n`;
          break;
        case "Action_MoveTowards":
          chunk += `${indent}{\n`;
          chunk += `${indent}  let ent = typeof getData === "function" ? getData("${p.entity || 'player'}") : null;\n`;
          chunk += `${indent}  if (ent && ent.position) {\n`;
          chunk += `${indent}    let dx = ${Number(p.targetX || 0)} - ent.position.x;\n`;
          chunk += `${indent}    let dy = ${Number(p.targetY || 0)} - ent.position.y;\n`;
          chunk += `${indent}    let dist = Math.hypot(dx, dy);\n`;
          chunk += `${indent}    if (dist > 1) {\n`;
          chunk += `${indent}      ent.position.x += (dx / dist) * ${Number(p.speed || 4)};\n`;
          chunk += `${indent}      ent.position.y += (dy / dist) * ${Number(p.speed || 4)};\n`;
          chunk += `${indent}    }\n`;
          chunk += `${indent}  }\n`;
          chunk += `${indent}}\n`;
          break;
        case "Flow_SetInterval":
          chunk += `${indent}setInterval(() => {\n`;
          const loopNode = getNextNode(node.id, "Loop");
          if (loopNode) chunk += generateChain(loopNode, indent + "  ");
          chunk += `${indent}}, ${Number(p.intervalMs || 1000)});\n`;
          break;
        case "Flow_Delay":
          chunk += `${indent}setTimeout(() => {\n`;
          const delayNext = getNextNode(node.id, "Completed");
          if (delayNext) chunk += generateChain(delayNext, indent + "  ");
          chunk += `${indent}}, ${Number(p.durationMs || 500)});\n`;
          break;
        case "Flow_ForLoop":
          chunk += `${indent}for (let i = ${Number(p.startIndex || 0)}; i < ${Number(p.endIndex || 10)}; i++) {\n`;
          const bodyNode = getNextNode(node.id, "LoopBody");
          if (bodyNode) chunk += generateChain(bodyNode, indent + "  ");
          chunk += `${indent}}\n`;
          const compNode = getNextNode(node.id, "Completed");
          if (compNode) chunk += generateChain(compNode, indent);
          return chunk;
        case "Flow_Sequence":
          const t0 = getNextNode(node.id, "Then 0");
          if (t0) chunk += generateChain(t0, indent);
          const t1 = getNextNode(node.id, "Then 1");
          if (t1) chunk += generateChain(t1, indent);
          const t2 = getNextNode(node.id, "Then 2");
          if (t2) chunk += generateChain(t2, indent);
          return chunk;
        case "Logic_Branch":
          const cond = getDataInput(node.id, "Condition", "true");
          chunk += `${indent}if (${cond}) {\n`;
          const trueNode = getNextNode(node.id, "True");
          if (trueNode) chunk += generateChain(trueNode, indent + "  ");
          chunk += `${indent}} else {\n`;
          const falseNode = getNextNode(node.id, "False");
          if (falseNode) chunk += generateChain(falseNode, indent + "  ");
          chunk += `${indent}}\n`;
          return chunk;
        case "Var_SetVariable":
          const varVal = getDataInput(node.id, "Value", JSON.stringify(p.varValue || "0"));
          chunk += `${indent}BP_VARS["${p.varName || 'score'}"] = ${varVal};\n`;
          break;
        case "Custom_Code":
          if (p.code) {
            chunk += `${indent}// Custom Code Block\n`;
            p.code.split("\n").forEach(line => {
              chunk += `${indent}${line}\n`;
            });
          }
          break;
      }

      const next = getNextNode(node.id, "Exec");
      if (next) chunk += generateChain(next, indent);
      return chunk;
    };

    // Compile Event Roots
    this.nodes.filter(n => n.type.startsWith("Event_")).forEach(evNode => {
      const p = evNode.params || {};
      const next = getNextNode(evNode.id, "Exec");

      if (evNode.type === "Event_OnStart") {
        code += `// Event: On Start (Immediate Engine Execution)\n`;
        code += `(function() {\n`;
        if (next) code += generateChain(next, "  ");
        code += `})();\n\n`;
      } else if (evNode.type === "Event_OnKeyPress") {
        const targetKey = (p.key || "ANY").toUpperCase();
        code += `// Event: On Key Press (${targetKey})\n`;
        code += `window.addEventListener("keydown", function(event) {\n`;
        if (targetKey !== "ANY") {
          code += `  if (event.key.toUpperCase() === "${targetKey}" || event.code.toUpperCase() === "${targetKey}") {\n`;
          if (next) code += generateChain(next, "    ");
          code += `  }\n`;
        } else {
          if (next) code += generateChain(next, "  ");
        }
        code += `});\n\n`;
      } else if (evNode.type === "Event_OnCollision") {
        code += `// Event: On Collision (${p.entity || 'player'})\n`;
        code += `var prev_collisionout = typeof collisionout === "function" ? collisionout : function(){};\n`;
        code += `collisionout = function(name1, name2, side, data) {\n`;
        code += `  prev_collisionout(name1, name2, side, data);\n`;
        code += `  if (name1 === "${p.entity || 'player'}" || name2 === "${p.entity || 'player'}") {\n`;
        if (next) code += generateChain(next, "    ");
        code += `  }\n`;
        code += `};\n\n`;
      } else if (evNode.type === "Event_OnClick") {
        code += `// Event: On Click\n`;
        code += `window.addEventListener("click", function(event) {\n`;
        if (next) code += generateChain(next, "  ");
        code += `});\n\n`;
      } else if (evNode.type === "Event_OnTick") {
        code += `// Event: On Tick\n`;
        code += `setInterval(function() {\n`;
        if (next) code += generateChain(next, "  ");
        code += `}, 16);\n\n`;
      }
    });

    return code;
  },

  compileAndSave: function() {
    const generatedJS = this.compileToJavaScript();
    const graphData = {
      nodes: this.nodes,
      connections: this.connections
    };

    fetch("/saveblueprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        graph: graphData,
        code: generatedJS
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (window.iziToast) {
          iziToast.success({
            title: "Blueprint Compiled",
            message: "Saved to Scripts/blueprint_gen.js successfully!"
          });
        }
        fetch("/compile").then(() => {
          const iframe = document.getElementById("mainiframe");
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.location.reload();
          }
        });
      }
    })
    .catch(err => {
      if (window.iziToast) {
        iziToast.error({ title: "Compile Error", message: err.message });
      }
    });
  }
};

window.BlueprintEditor = BlueprintEditor;
