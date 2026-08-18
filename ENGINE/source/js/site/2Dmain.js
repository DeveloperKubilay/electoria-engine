var iframe = document.querySelector("#mainiframe")
const CKN_element = document.getElementById("xconsole");
const iframeWindow = iframe.contentWindow;


//Game events
iframeWindow.console.log = telconsoles
iframeWindow.console.erorr = telconsolee
iframeWindow.console.warn = telconsolew


//Console events
console.log = etelconsoles
console.erorr = etelconsolee
console.warn = etelconsolew

var htmlterminal = true;
var latestinput = ""
var selecteditem = ""
var rightbartempfile = ""
var nowpath = ""
var newobjitem = {}

function terminkey(text){
$("#xconsole").append(`
<a style="display:block;margin-left:15px;color:yellow"> $ ${text}</a>
`)
if(text) latestinput = text
if(htmlterminal){
  try{
  var yanıt = iframeWindow.eval(text)
  try{yanıt = JSON.stringify(yanıt)}catch{}
  telconsoles(yanıt)
}catch (erorr){telconsolee(erorr)}
}else{
  try{
    var yanıt = eval(text)
    try{yanıt = JSON.stringify(yanıt)}catch{}
    etelconsoles(yanıt)
  }catch (erorr){etelconsolee(erorr)}
}
if(text == "clear" || text == "cls")  CKN_element.innerHTML = ""
}

function terminalcheck(x){
document.getElementById("xconsole").innerHTML = ""
  if(x){
htmlterminal = false;
  }else{
htmlterminal = true;
  }
}

document.onerror = function(message, source, lineno, colno) {
  etelconsolee(message,`${source.split("/").slice(3).join(",","/")} ${lineno}:${colno}`);
};
iframeWindow.onerror = function(message, source, lineno, colno) {
  telconsolee(message,`${source.split("/").slice(3).join(",","/")} ${lineno}:${colno}`);
};

function etelconsolew(...x){
  if(htmlterminal || x == undefined) return;
  CKN_element.scrollTop = CKN_element.scrollHeight;
  if (Array.isArray(x)) {for (var i = 0; i < x.length; i++) {try { if (typeof x[i] === 'object' &&x[i] !== null) { x[i] = JSON.stringify(x[i]);} } catch {}}}
  $("#xconsole").append(`<a style="display:block;margin-left:15px;color:yellow"> > ${x}</a>`)
}
function etelconsolee(x,...y){
  if(htmlterminal || x == undefined) return;
  CKN_element.scrollTop = CKN_element.scrollHeight;
  if (y) {
    if (Array.isArray(y)) {for (var i = 0; i < y.length; i++) {try { if (typeof y[i] === 'object' && y[i] !== null) { y[i] = JSON.stringify(y[i]); }} catch {}}}
    $("#xconsole").append(`<a style="margin-left:15px;"> > ${y};</a> <a style="color:red;">${x}</a><br>`)
  }else{
    $("#xconsole").append(`<a style="display:block;margin-left:15px;color:red"> > ${x}</a>`)
  }
}


function etelconsoles(...x){
  if(htmlterminal || x == undefined) return;
  CKN_element.scrollTop = CKN_element.scrollHeight;
  if (Array.isArray(x)) {for (var i = 0; i < x.length; i++) {try { if (typeof x[i] === 'object' &&x[i] !== null) { x[i] = JSON.stringify(x[i]);} } catch {}}}
  $("#xconsole").append(`<a style="display:block;word-wrap: break-word;margin-left:15px;color:white"> > ${x}</a>`)
}

function telconsolew(...x){
  if(!htmlterminal || x == undefined) return;
  CKN_element.scrollTop = CKN_element.scrollHeight;
  if (Array.isArray(x)) {for (var i = 0; i < x.length; i++) {try { if (typeof x[i] === 'object' &&x[i] !== null) { x[i] = JSON.stringify(x[i]);} } catch {}}}
  $("#xconsole").append(`<a style="display:block;margin-left:15px;color:yellow"> > ${x}</a>`)
}
function telconsolee(x,...y){
  if(!htmlterminal || x == undefined) return;
  CKN_element.scrollTop = CKN_element.scrollHeight;
  if(y){
    if (Array.isArray(y)) {for (var i = 0; i < y.length; i++) {try { if (typeof y[i] === 'object' && y[i] !== null) { y[i] = JSON.stringify(y[i]); }} catch {}}}
    $("#xconsole").append(`<a style="margin-left:15px;"> > ${y};</a> <a style="color:red;">${x}</a><br>`)
  }else{
    $("#xconsole").append(`<a style="display:block;margin-left:15px;color:red"> > ${x}</a>`)
  }
}
function telconsoles(...x){
  if(!htmlterminal || x == undefined) return;
  CKN_element.scrollTop = CKN_element.scrollHeight;
  if (Array.isArray(x)) {for (var i = 0; i < x.length; i++) {try { if (typeof x[i] === 'object' &&x[i] !== null) { x[i] = JSON.stringify(x[i]);} } catch {}}}
  $("#xconsole").append(`<a style="display:block;word-wrap: break-word;margin-left:15px;color:white"> > ${x}</a>`)
}


setInterval(() => {
  if (typeof iframeWindow === "undefined" || !iframeWindow || !iframeWindow.Engine_allnames) return;
  const lbtb = document.getElementById("lbtb");
  const litems = document.getElementById("litems");
  const testaobValue = iframeWindow.Engine_allnames || [];
  if (lbtb) lbtb.innerHTML = "Entities (" + testaobValue.length + ")";
  if (litems) {
    litems.innerHTML = "";
    testaobValue.forEach((x) => {
      if (selecteditem == x) {
        $("#litems").append(`<a class="itemi" onclick="selectitem('${x}')" id="items-${x}"><i class="fa-solid fa-angle-right"></i> ${x}</a><br>`);
      } else {
        $("#litems").append(`<a class="itemi" onclick="selectitem('${x}')" id="items-${x}">${x}</a><br>`);
      }
    });
  }
}, 1000); 


function selectitem(x){
  selecteditem = x
  document.querySelector(".rightbar").style.border = "3px solid rgba(255, 225, 0)"
  setTimeout(()=>{
    document.querySelector(".rightbar").style.border = ""
  },1000)

     $.ajax({
      url:"/getdata",
      type:"POST",
      data:{
        selecteditem:x
      },
      dataType:"json",
     success: function( data ) { 
      if(data.type == "invalid") { document.querySelector(".rightbar").innerHTML = 
      "This object was created after the game engine started. No such folder was found in the script folder."
     return iziToast.error({
        title: 'Erorr',
        message: 'This object was created after the game engine started. No such folder was found in the script folder.',
      });
    }
        editrightbar(data.file,data.type,data.data)
     }
    })


}


function editrightbar(file, type, tempdata) {
  rightbartempfile = file;
  if (!tempdata) tempdata = {};
  if (!tempdata.position) tempdata.position = {};
  if (!tempdata.scale) tempdata.scale = {};
  if (!tempdata.shadow) tempdata.shadow = {};
  if (!tempdata.physic) tempdata.physic = {};

  const isText = type === "text" || tempdata.type === "text";
  const entityName = tempdata.name || selecteditem || "Entity";
  const entityColor = tempdata.color || (isText ? "#fffffe" : "#ff8906");
  const reverseChecked = tempdata.reverse ? "checked" : "";
  const physicChecked = tempdata.physic.status ? "checked" : "";
  const shadowChecked = tempdata.shadow.status ? "checked" : "";

  document.querySelector(".rightbar").innerHTML = `
    <div class="rightbar-header">
      <h3><i class="fa-solid fa-sliders"></i> Properties</h3>
    </div>
    <div class="rightbar-content">
      <div class="properties-container">
        <!-- Entity Badge Bar -->
        <div class="prop-entity-badge-bar">
          <div class="prop-entity-info">
            <i class="${isText ? 'fa-solid fa-font' : 'fa-solid fa-cube'}"></i>
            <span>${entityName}</span>
          </div>
          <span class="prop-entity-type-badge">${isText ? 'Text' : 'Component'}</span>
        </div>

        <!-- 1. Transform Card -->
        <div class="prop-card">
          <div class="prop-card-header">
            <i class="fa-solid fa-arrows-up-down-left-right"></i> Transform
          </div>
          <div class="prop-card-body">
            <div class="prop-field">
              <label class="prop-label">Entity Name</label>
              <div class="prop-input-wrap">
                <input type="text" value="${tempdata.name || ''}" class="prop-input" id="rtname">
              </div>
            </div>

            <div class="prop-field">
              <label class="prop-label">Position</label>
              <div class="prop-row">
                <div class="prop-input-wrap">
                  <span class="prop-axis-badge x">X</span>
                  <input type="number" value="${tempdata.position.x || 0}" class="prop-input" id="rpox">
                </div>
                <div class="prop-input-wrap">
                  <span class="prop-axis-badge y">Y</span>
                  <input type="number" value="${tempdata.position.y || 0}" class="prop-input" id="rpoy">
                </div>
              </div>
            </div>

            ${!isText ? `
            <div class="prop-field">
              <label class="prop-label">Scale (Size)</label>
              <div class="prop-row">
                <div class="prop-input-wrap">
                  <span class="prop-axis-badge w">W</span>
                  <input type="number" value="${tempdata.scale.x || 50}" class="prop-input" id="rcx">
                </div>
                <div class="prop-input-wrap">
                  <span class="prop-axis-badge h">H</span>
                  <input type="number" value="${tempdata.scale.y || 50}" class="prop-input" id="rcy">
                </div>
              </div>
            </div>
            ` : ''}

            <div class="prop-row">
              <div class="prop-field" style="flex: 1;">
                <label class="prop-label">Rotation (°)</label>
                <div class="prop-input-wrap">
                  <input type="number" value="${tempdata.rotate || 0}" class="prop-input" id="rtrotate">
                </div>
              </div>
              <div class="prop-field" style="flex: 1;">
                <label class="prop-label">Layer (Z)</label>
                <div class="prop-input-wrap">
                  <input type="number" value="${tempdata.layer !== undefined ? tempdata.layer : 10}" class="prop-input" id="rtlayer">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Appearance Card -->
        <div class="prop-card">
          <div class="prop-card-header">
            <i class="fa-solid fa-palette"></i> Appearance
          </div>
          <div class="prop-card-body">
            <div class="prop-field">
              <label class="prop-label">Color</label>
              <div class="prop-color-input-group">
                <input type="color" value="${entityColor.startsWith('#') && entityColor.length === 7 ? entityColor : '#ff8906'}" class="prop-color-picker" id="rtcolor-picker" onchange="document.getElementById('rtcolor').value = this.value">
                <div class="prop-input-wrap">
                  <input type="text" value="${tempdata.color || ''}" class="prop-input" id="rtcolor" oninput="if(this.value.startsWith('#') && this.value.length === 7) document.getElementById('rtcolor-picker').value = this.value">
                </div>
              </div>
            </div>

            ${!isText ? `
            <div class="prop-field">
              <label class="prop-label">Image / Sprite</label>
              <div class="prop-input-wrap">
                <input type="text" value="${tempdata.image || ''}" class="prop-input" id="rtimage" placeholder="filename.png">
              </div>
            </div>
            <input type="hidden" id="rtstype" value="${tempdata.stype || ''}">
            <div class="prop-toggle-row">
              <span class="prop-label">Flip Horizontal (Reverse)</span>
              <label class="toggle">
                <input type="checkbox" id="rtreverse" ${reverseChecked}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            ` : ''}

            <div class="prop-field">
              <label class="prop-label">Opacity (0.0 - 1.0)</label>
              <div class="prop-input-wrap">
                <input type="number" step="0.1" min="0" max="1" value="${tempdata.opacity !== undefined ? tempdata.opacity : 1}" class="prop-input" id="rtopacity">
              </div>
            </div>
          </div>
        </div>

        ${isText ? `
        <!-- 3. Text Properties Card -->
        <div class="prop-card">
          <div class="prop-card-header">
            <i class="fa-solid fa-font"></i> Text Content
          </div>
          <div class="prop-card-body">
            <div class="prop-field">
              <label class="prop-label">Text</label>
              <textarea class="prop-input" id="rttext" style="height: 60px; resize: vertical; padding: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;">${tempdata.text || 'Hello World'}</textarea>
            </div>
            <div class="prop-row">
              <div class="prop-field" style="flex: 1;">
                <label class="prop-label">Font</label>
                <div class="prop-input-wrap">
                  <input type="text" value="${tempdata.font || 'Poppins'}" class="prop-input" id="rtfont">
                </div>
              </div>
              <div class="prop-field" style="flex: 1;">
                <label class="prop-label">Size</label>
                <div class="prop-input-wrap">
                  <input type="text" value="${tempdata.size || '24px'}" class="prop-input" id="rtsize">
                </div>
              </div>
            </div>
          </div>
        </div>
        ` : `
        <!-- 3. Physics & Collision Card -->
        <div class="prop-card">
          <div class="prop-card-header">
            <i class="fa-solid fa-gauge-high"></i> Physics & Collision
          </div>
          <div class="prop-card-body">
            <div class="prop-toggle-row">
              <span class="prop-label">Enable Physics</span>
              <label class="toggle">
                <input type="checkbox" id="rpstatus" ${physicChecked}>
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="prop-field">
              <label class="prop-label">Velocity (Force)</label>
              <div class="prop-row">
                <div class="prop-input-wrap">
                  <span class="prop-axis-badge x">X</span>
                  <input type="number" value="${tempdata.physic.x || 0}" class="prop-input" id="rpx">
                </div>
                <div class="prop-input-wrap">
                  <span class="prop-axis-badge y">Y</span>
                  <input type="number" value="${tempdata.physic.y || 0}" class="prop-input" id="rpy">
                </div>
              </div>
            </div>

            <div class="prop-field">
              <label class="prop-label">Collision Type (0: Off, 1: Solid)</label>
              <div class="prop-input-wrap">
                <input type="number" value="${tempdata.collision !== undefined ? tempdata.collision : 1}" class="prop-input" id="rtcollision">
              </div>
            </div>
          </div>
        </div>
        `}

        <input type="hidden" id="rsstatus" value="${shadowChecked ? 'true' : 'false'}">
        <input type="hidden" id="backgroundposition" value="${tempdata.backgroundposition ? 'true' : 'false'}">
        <input type="hidden" id="reval" value="${tempdata.eval || ''}">
        <input type="hidden" id="ranimate" value='${JSON.stringify(tempdata.animate || [])}'>

        <!-- Save Button -->
        <button onclick="updaterightbar('${tempdata.name || ''}', '${type}')" class="prop-btn-save" id="btn-save-props">
          <i class="fa-solid fa-floppy-disk"></i> Save & Apply Changes
        </button>
      </div>
    </div>
  `;
}

function updaterightbar(originalName, entityType) {
  const saveBtn = document.getElementById("btn-save-props");
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
  }

  const isText = entityType === "text";
  const newName = document.getElementById("rtname") ? document.getElementById("rtname").value.trim() : originalName;

  const output = {
    name: newName,
    layer: document.getElementById("rtlayer") ? Number(document.getElementById("rtlayer").value) : 10,
    position: {
      x: document.getElementById("rpox") ? Number(document.getElementById("rpox").value) : 0,
      y: document.getElementById("rpoy") ? Number(document.getElementById("rpoy").value) : 0
    },
    color: document.getElementById("rtcolor") ? document.getElementById("rtcolor").value : "",
    rotate: document.getElementById("rtrotate") ? Number(document.getElementById("rtrotate").value) : 0,
    opacity: document.getElementById("rtopacity") ? Number(document.getElementById("rtopacity").value) : 1
  };

  if (isText) {
    output.type = "text";
    output.text = document.getElementById("rttext") ? document.getElementById("rttext").value : "Hello World";
    output.font = document.getElementById("rtfont") ? document.getElementById("rtfont").value : "Poppins";
    output.size = document.getElementById("rtsize") ? document.getElementById("rtsize").value : "24px";
  } else {
    output.scale = {
      x: document.getElementById("rcx") ? Number(document.getElementById("rcx").value) : 50,
      y: document.getElementById("rcy") ? Number(document.getElementById("rcy").value) : 50
    };
    output.image = document.getElementById("rtimage") ? document.getElementById("rtimage").value : "";
    output.reverse = document.getElementById("rtreverse") ? document.getElementById("rtreverse").checked : false;
    output.collision = document.getElementById("rtcollision") ? Number(document.getElementById("rtcollision").value) : 1;

    const physicStatus = document.getElementById("rpstatus") ? document.getElementById("rpstatus").checked : false;
    output.physic = {
      status: physicStatus,
      x: document.getElementById("rpx") ? Number(document.getElementById("rpx").value) : 0,
      y: document.getElementById("rpy") ? Number(document.getElementById("rpy").value) : 0
    };

    const animVal = document.getElementById("ranimate") ? document.getElementById("ranimate").value : "";
    if (animVal && animVal.startsWith("[")) {
      try { output.animate = JSON.parse(animVal); } catch (e) {}
    }
  }

  cleanJSON(output);

  // 1. Send update to backend
  fetch("/setdata", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      type: isText ? "Text" : "Component",
      name: originalName,
      data: JSON.stringify(output),
      file: rightbartempfile || "script.js"
    })
  })
  .then(res => res.json())
  .then(() => {
    // 2. Update live iframe entity
    const iframe = document.getElementById("mainiframe");
    if (iframe && iframe.contentWindow && typeof iframe.contentWindow.updateData === "function") {
      iframe.contentWindow.updateData(output);
    }

    // 3. Update Scene View
    if (window.SceneEditor && typeof SceneEditor.loadEntities === "function") {
      SceneEditor.loadEntities();
    }

    // 4. Smooth Button Feedback (Never wipe rightbar!)
    if (saveBtn) {
      saveBtn.classList.add("saved");
      saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Changes Applied!';
      setTimeout(() => {
        saveBtn.classList.remove("saved");
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save & Apply Changes';
      }, 1500);
    }

    if (newName !== originalName) {
      selecteditem = newName;
    }
  })
  .catch(err => {
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save & Apply Changes';
    }
    if (window.iziToast) iziToast.error({ title: "Save Error", message: err.message });
  });
}

function cleanJSON(obj) {
  for (const key in obj) {
    if (obj[key] === '') {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      cleanJSON(obj[key]);
    }
  }
}

getfiles(nowpath);
function getfiles(x,up){
  if(up && nowpath.split("/").length >= 3) nowpath = nowpath.split("/").slice(0,-2).toString().replaceAll(",","/")+"/"
  else nowpath = nowpath+x+"/"
  $.ajax({
    url:"/getfiles",
    type:"POST",
    data:{
      path:nowpath
    },
    dataType:"json",
    success: function( data ) {
      document.getElementById("xfiles").innerHTML = `
      <div class="file" onclick="getfiles('',true)">
      <i class="fa-solid fa-folder" style="color:yellow;font-size: 300%;"></i><br>
      <a style="font-size:25px;">..</a>
    </div>
      `
   data.map((x)=>{
    if(nowpath == "/"+x.file+"/") return;
    if(nowpath.split("/").length == x.file.split("/").length) return;
    fileadd(x.file.split("/").reverse()[0],x.d)
   })
   
  }})
}

const refreshbutton = document.getElementById("rerefresh").style;
var refreshcooldown = false;
function filemanager(type){
  if(type == "home") {
    nowpath = ""
    getfiles("")
  }else if(type == "refresh"){
    var tempnowpath = nowpath;
    nowpath = ""
    getfiles(tempnowpath)
    refreshcooldown = true;
    refreshbutton.color = "yellow"
    setTimeout(()=>{
      refreshcooldown = false
      refreshbuttonn("fix");
    },1000)
  }else if(type == "explorer"){
    $.ajax({
      url:"/getfiles",
      type:"POST",
      data:{
        explorer:nowpath
      },
      dataType:"json"
    }) 
  }else if(type == "remove"){
    Swal.fire({
      title: 'File/Folder name to delete',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Ok',
      background: '#191818',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const cevap = result.value;
        $.ajax({
          url:"/getfiles",
          type:"POST",
          data:{
            remove:nowpath+cevap
          },
          dataType:"json"
        }) 
        setTimeout(()=>filemanager("refresh"),500)
      }
    });
  }else{
    Swal.fire({
      title: 'Folder name to create',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Ok',
      background: '#191818',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const cevap = result.value;
        $.ajax({
          url:"/getfiles",
          type:"POST",
          data:{
            folder:nowpath+cevap
          },
          dataType:"json"
        }) 
        setTimeout(()=>filemanager("refresh"),500)
      }
    });
  }
}
function refreshbuttonn(x){
if(refreshcooldown) return;
if(x == "fix"){
  refreshbutton.color = "#ddd"
}else{
  refreshbutton.color = "rgb(171, 170, 170)"
}}


function openfile(x){
  $.ajax({
    url:"/getfiles",
    type:"POST",
    data:{
      open:nowpath+x
    },
    dataType:"json"
  }) 
}

function fileadd(text,yx){
  if(text == ".vscode") return;
  var icon = `<i class="fa-solid fa-file;font-size: 300%"></i>` //idk file
  var temppath = `onclick="openfile('${text}')"`
  if(yx) {
    icon = `<i class="fa-solid fa-folder" style="color:yellow;font-size: 300%;"></i>`
    temppath = `onclick="getfiles('${text}')"`
   }
  else if(text.split(".").length > 1){
      var ex = text.split(".")[1].toLowerCase()
      if(ex == "sh" || ex == "bat" || ex == "bash" || ex == "ps1") icon = `<i class="fa-solid fa-terminal" style="color:#8c8c90;font-size: 300%;"></i>`
      else if(ex == "md" || ex == "txt") icon = `<i class="fa-solid fa-file-lines" style="color:#f47765;font-size: 300%;"></i>`
      else if(ex == "py") icon = `<i class="fa-brands fa-python" style='color:#346c99;font-size: 300%;'></i>`
      else if(ex == "js") icon = `<i class="fa-brands fa-js" style='color:#f7de1f;font-size: 300%;'></i>`
      else if(ex == "java" || ex == "jar") icon = `<i class="fa-brands fa-java" style='color:#5382a1;font-size: 300%;'></i>`
      else if(ex == "c" || ex == "cpp" || ex == "cc" || ex == "h" || ex == "cxx" || ex == "hpp") icon = `<i class="fa-solid fa-c" style='color:#00589d;font-size: 300%;'></i>`
      else if(ex == "cs") icon = `<i class="fa-solid fa-c" style='color:#863f88;font-size: 300%;'></i>`
      else if(ex == "swift") icon = `<i class="fa-brands fa-swift" style='color:#fe522d;font-size: 300%;'></i>`
      else if(ex == "go") icon = `<i class="fa-brands fa-golang" style='color:#6ad8e6;font-size: 300%;'></i>`
      else if(ex == "rs") icon = `<i class="fa-brands fa-rust" style='color:#8c8c90;font-size: 300%;'></i>`
      else if(ex == "html") icon = `<i class="fa-brands fa-html5" style='color:#f66f00;font-size: 300%;'></i>`
      else if(ex == "css") icon = `<i class="fa-brands fa-css3-alt" style='color:#36b6f1;font-size: 300%;'></i>`
      else if(ex == "php") icon = `<i class="fa-brands fa-php" style='color:#787cb4;font-size: 300%;'></i>`
      else if(ex == "rb" || ex == "kt" || ex == "ts" || ex == "lua" || ex == "dart" || ex == "vb") icon = `<i class="fa-solid fa-file-code" style='color:#3dbb69;font-size: 300%;'></i>`
      else if(ex == "exe" || ex == "deb") icon = `<i class="fa-solid fa-box" style='color:#cfd2fc;font-size: 300%;'></i>`
      else if(ex == "jpg" || ex == "jpeg" || ex == "png" || ex == "gif" || ex == "svg" || ex == "ico") icon = `<i class="fa-solid fa-image" style="color:#e2e5e7;font-size: 300%;"></i>`
      else if(ex == "sql" || ex == "mdb" || ex == "db" || ex == "sqlite" || ex == "yaml" || ex == "json") icon = `<i class="fa-solid fa-database" style='color:#323232;font-size: 300%;'></i>`
      else if(ex == "mp4" || ex == "avi" || ex == "mov" || ex == "mkv") icon = `<i class="fa-solid fa-film" style='color:#fb024a;font-size: 300%;'></i>`
      else if(ex == "mp3" || ex == "wav" || ex == "acc") icon = `<i class="fa-solid fa-music" style='color:#f15d6d;font-size: 300%;'></i>`
      else if(ex == "properties") icon = `<i class="fa-solid fa-gear" style="color:#8C8C90;font-size: 300%;"</i>`
      else icon = `<i class="fa-regular fa-file" style="font-size: 300%;"></i>`
    }else{
      icon = `<i class="fa-regular fa-file" style="font-size: 300%;"></i>`
    }
    $("#xfiles").append(`<div class="file" ${temppath}>
          ${icon}<br><a>${text}</a>
        </div>`)
  }




  function leftopbar(type){
      Swal.fire({
        title: 'Type the name of the object you want to create',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'Ok',
        background: '#191818',
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) { result = result.value
          newobjitem = {name:result,type:type}
          iziToast.info({
            title: 'You selected '+type,
            message: 'Move the mouse anywhere in the middle of the screen and click',
          });
          if(type == "Component"){
          var componenexample = `
           {
            name: "${result}",
            position: {x: 0,y: 0},
            scale: {x: 50,y: 50},
            color:"red"
          }
          `
           newobjitem.slz = false;
        }else if(type == "Text"){
          var componenexample = `
          {
           name: "${result}",
           position: {x: 0,y: 0},
           text:"Hello world!",
           font:"Sans-serif",
           color:"yellow",
           size:"20px"
          }
         `
      }else if(type == "Textbox"){
        var componenexample = `
        {
         name: "${result}",
         position: {x: 0,y: 0},
         placeholder:"Write something",
         removeable:true
        }
       `
      }else if(type == "Video"){
      var componenexample = `
      {
       name: "${result}",
       position: {x: 0,y: 0},
       scale: {x: "20%",y: "20%"},
       autoplay: true,
       muted:true,
       video:"http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
       removeable:true
      }
     `
    }

        newobjitem.data = componenexample
        iframeWindow.eval(`const ${result} = new ${type}(${componenexample});`) 
          iframeWindow.document.body.style.cursor = "move";
        }
      });
  }

  iframeWindow.addEventListener("mousemove",function(data){
    if(newobjitem.name){
      if(newobjitem.slz){
        newobjitem.fx = (data.clientX*(iframeWindow.Engine_canvas.width/iframe.offsetWidth)).toFixed(0)-newobjitem.x
        newobjitem.fy = (data.clientY*(iframeWindow.Engine_canvas.height/iframe.offsetHeight)).toFixed(0)-newobjitem.y

        iframeWindow.eval(`updateData({
            name:"${newobjitem.name}",
            scale:{
            x:${newobjitem.fx},
            y:${newobjitem.fy}
          }})`)
      }else{
        
      newobjitem.x = (data.clientX*(iframeWindow.Engine_canvas.width/iframe.offsetWidth)).toFixed(0)
      newobjitem.y = (data.clientY*(iframeWindow.Engine_canvas.height/iframe.offsetHeight)).toFixed(0)
      iframeWindow.eval(`updateData({
          name:"${newobjitem.name}",
          position:{
          x:${newobjitem.x},
          y:${newobjitem.y}
        }})`)
      }
    }
  })

  function cmv(){
    console.log(newobjitem.data)
    newobjitem.data = newobjitem.data.replaceAll("position: {x: 0,y: 0},",`position:{x:${newobjitem.x},y:${newobjitem.y}},`)
    if(newobjitem.type =="Component") newobjitem.data = newobjitem.data.replaceAll("scale: {x: 50,y: 50},",`scale:{x:${newobjitem.fx},y:${newobjitem.fy}},`)

        
      iframeWindow.document.body.style.cursor = "default";
      $.ajax({
        url:"/setdata",
        type:"POST",
        data:{
      type:newobjitem.type,
      name:newobjitem.name,
      data:newobjitem.data,
      file:"script.js",
      d:true
        },
        dataType:"json"
      })
      iziToast.success({
        title: 'Created '+newobjitem.type
      });
      newobjitem = {}
      if (window.SceneEditor) {
        setTimeout(() => SceneEditor.loadEntities(), 100);
      }
  }

  iframeWindow.addEventListener("click",function(){
    if(newobjitem.name){
      if(newobjitem.slz) return cmv();else {
        if(newobjitem.type =="Component") return newobjitem.slz = true;
        cmv();
      }
    }
  })

function settings(){
  iziToast.warning({
    title: 'This part is not done yet'
  });
}

function openVSCode() {
  fetch("/openvscode")
    .then(r => r.json())
    .then(() => {
      if (window.iziToast) iziToast.success({ title: "VS Code", message: "Opening project in VS Code..." });
    })
    .catch(() => {});
}

// ===================================================
// Panel Resizing & Layout Persistence
// ===================================================
function initPanelResizers() {
  const leftPanel = document.getElementById("leftbar-panel");
  const rightPanel = document.getElementById("rightbar-panel");
  const workspace = document.getElementById("workspace-container");
  const bottomPanel = document.getElementById("bottom-panel");
  const filesPanel = document.getElementById("files-panel");

  const resizerLeft = document.getElementById("resizer-left");
  const resizerRight = document.getElementById("resizer-right");
  const resizerBottom = document.getElementById("resizer-bottom");
  const resizerConsole = document.getElementById("resizer-console");

  // Load Saved Layout
  try {
    const saved = JSON.parse(localStorage.getItem("electoria_panel_layout") || "{}");
    const navHeight = document.querySelector(".navbar") ? document.querySelector(".navbar").offsetHeight : 60;
    if (saved.leftWidth && Number(saved.leftWidth) >= 160 && leftPanel) {
      leftPanel.style.width = Number(saved.leftWidth) + "px";
    }
    if (saved.rightWidth && Number(saved.rightWidth) >= 160 && rightPanel) {
      rightPanel.style.width = Number(saved.rightWidth) + "px";
    }
    if (saved.bottomHeight && Number(saved.bottomHeight) >= 100 && bottomPanel && workspace) {
      const bh = Number(saved.bottomHeight);
      bottomPanel.style.height = bh + "px";
      workspace.style.height = `calc(100% - ${bh + navHeight}px)`;
    }
    if (saved.filesWidth && Number(saved.filesWidth) >= 160 && filesPanel) {
      filesPanel.style.width = Number(saved.filesWidth) + "px";
    }
  } catch (e) {}

  function saveLayout() {
    try {
      const layout = {
        leftWidth: leftPanel ? Math.max(160, leftPanel.offsetWidth) : 280,
        rightWidth: rightPanel ? Math.max(160, rightPanel.offsetWidth) : 280,
        bottomHeight: bottomPanel ? Math.max(100, bottomPanel.offsetHeight) : 200,
        filesWidth: filesPanel ? Math.max(160, filesPanel.offsetWidth) : 350
      };
      localStorage.setItem("electoria_panel_layout", JSON.stringify(layout));
    } catch (e) {}
  }

  // 1. Leftbar Resizer
  if (resizerLeft && leftPanel) {
    let isResizing = false;
    resizerLeft.addEventListener("mousedown", (e) => {
      isResizing = true;
      resizerLeft.classList.add("resizing");
      document.body.style.cursor = "col-resize";
    });
    window.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const newWidth = Math.max(160, Math.min(e.clientX, window.innerWidth * 0.45));
      leftPanel.style.width = newWidth + "px";
      if (window.SceneEditor) SceneEditor.resizeCanvas();
    });
    window.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        resizerLeft.classList.remove("resizing");
        document.body.style.cursor = "default";
        saveLayout();
      }
    });
  }

  // 2. Rightbar Resizer
  if (resizerRight && rightPanel) {
    let isResizing = false;
    resizerRight.addEventListener("mousedown", (e) => {
      isResizing = true;
      resizerRight.classList.add("resizing");
      document.body.style.cursor = "col-resize";
    });
    window.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const newWidth = Math.max(180, Math.min(window.innerWidth - e.clientX, window.innerWidth * 0.45));
      rightPanel.style.width = newWidth + "px";
      if (window.SceneEditor) SceneEditor.resizeCanvas();
    });
    window.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        resizerRight.classList.remove("resizing");
        document.body.style.cursor = "default";
        saveLayout();
      }
    });
  }

  // 3. Bottom Area Resizer
  if (resizerBottom && bottomPanel && workspace) {
    let isResizing = false;
    resizerBottom.addEventListener("mousedown", (e) => {
      isResizing = true;
      resizerBottom.classList.add("resizing");
      document.body.style.cursor = "row-resize";
    });
    window.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const menuHeight = document.querySelector(".navbar") ? document.querySelector(".navbar").offsetHeight : 50;
      const newBottomHeight = Math.max(120, Math.min(window.innerHeight - e.clientY, window.innerHeight * 0.65));
      bottomPanel.style.height = newBottomHeight + "px";
      workspace.style.height = `calc(100% - ${newBottomHeight + menuHeight}px)`;
      if (window.SceneEditor) SceneEditor.resizeCanvas();
    });
    window.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        resizerBottom.classList.remove("resizing");
        document.body.style.cursor = "default";
        saveLayout();
      }
    });
  }

  // 4. Files / Console Resizer
  if (resizerConsole && filesPanel) {
    let isResizing = false;
    resizerConsole.addEventListener("mousedown", (e) => {
      isResizing = true;
      resizerConsole.classList.add("resizing");
      document.body.style.cursor = "col-resize";
    });
    window.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const newWidth = Math.max(160, Math.min(e.clientX, window.innerWidth * 0.75));
      filesPanel.style.width = newWidth + "px";
    });
    window.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        resizerConsole.classList.remove("resizing");
        document.body.style.cursor = "default";
        saveLayout();
      }
    });
  }
}

// ===================================================
// View Switching & Editors Integration
// ===================================================
function switchEditorView(viewName) {
  document.querySelectorAll(".nav-view-tab").forEach(tab => tab.classList.remove("active"));
  const activeTab = document.getElementById("tab-btn-" + viewName);
  if (activeTab) activeTab.classList.add("active");

  document.querySelectorAll(".editor-view-panel").forEach(panel => panel.classList.remove("active"));
  const activePanel = document.getElementById("view-" + viewName);
  if (activePanel) activePanel.classList.add("active");

  if (viewName === "scene" && window.SceneEditor) {
    setTimeout(() => {
      SceneEditor.resizeCanvas();
      SceneEditor.loadEntities();
      SceneEditor.centerViewport();
      SceneEditor.render();
    }, 30);
  } else if (viewName === "blueprint" && window.BlueprintEditor) {
    setTimeout(() => {
      BlueprintEditor.updateCanvasTransform();
      BlueprintEditor.renderGraph();
    }, 30);
  }
}

function BlueprintPaletteSearch(query) {
  query = (query || "").toLowerCase();
  document.querySelectorAll(".bp-pal-item").forEach(item => {
    const text = item.innerText.toLowerCase();
    item.style.display = text.includes(query) ? "flex" : "none";
  });
}

function playGame() {
  const btn = document.getElementById("playicon");
  if (btn) btn.style.opacity = "0.5";

  const bpPanel = document.getElementById("view-blueprint");
  const isBlueprintActive = bpPanel && bpPanel.classList.contains("active");

  if (isBlueprintActive) {
    // 1. In Visual Scripting: Compile Blueprint + Compile Project -> Run in Game View
    let bpPromise = Promise.resolve();
    if (window.BlueprintEditor && typeof BlueprintEditor.compileToJavaScript === "function") {
      const generatedJS = BlueprintEditor.compileToJavaScript();
      const graphData = {
        nodes: BlueprintEditor.nodes,
        connections: BlueprintEditor.connections
      };
      bpPromise = fetch("/saveblueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: graphData, code: generatedJS })
      }).then(res => res.json()).catch(() => {});
    }

    bpPromise.then(() => {
      return fetch("/compile");
    }).then(() => {
      switchEditorView("game");
      const iframe = document.getElementById("mainiframe");
      if (iframe) {
        iframe.src = iframe.src;
      }
      if (btn) btn.style.opacity = "1";
    }).catch(err => {
      if (btn) btn.style.opacity = "1";
      if (window.iziToast) iziToast.error({ title: "Play Error", message: err.message });
    });
  } else {
    // 2. Normal View (Game / Scene): Switch to Game View and reload game
    switchEditorView("game");
    const iframe = document.getElementById("mainiframe");
    if (iframe) {
      iframe.src = iframe.src;
    }
    if (btn) btn.style.opacity = "1";
  }
}

function toggleAspectRatioConstraint() {
  const viewGame = document.getElementById("view-game");
  if (!viewGame) return;

  const isCurrentlyLocked = viewGame.classList.contains("aspect-locked");
  const newLocked = !isCurrentlyLocked;

  applyAspectRatioLock(newLocked);
  localStorage.setItem("electoria_aspect_locked", newLocked ? "true" : "false");
}

function applyAspectRatioLock(locked) {
  const viewGame = document.getElementById("view-game");
  const btn = document.getElementById("btn-aspect-ratio");
  if (!viewGame) return;

  if (locked) {
    viewGame.classList.add("aspect-locked");
    if (btn) btn.classList.add("aspect-active");

    let w = 1024;
    let h = 720;
    if (window.SceneEditor && SceneEditor.viewportWidth > 0 && SceneEditor.viewportHeight > 0) {
      w = SceneEditor.viewportWidth;
      h = SceneEditor.viewportHeight;
    }
    try {
      const iframe = document.getElementById("mainiframe");
      if (iframe && iframe.contentWindow) {
        if (iframe.contentWindow.cwidth && iframe.contentWindow.cheight) {
          w = iframe.contentWindow.cwidth;
          h = iframe.contentWindow.cheight;
        } else if (iframe.contentWindow.Engine_canvas) {
          w = iframe.contentWindow.Engine_canvas.width;
          h = iframe.contentWindow.Engine_canvas.height;
        }
      }
    } catch(e) {}

    viewGame.style.setProperty("--game-res-w", w + "px");
    viewGame.style.setProperty("--game-res-h", h + "px");
    viewGame.style.setProperty("--game-ratio-w", w);
    viewGame.style.setProperty("--game-ratio-h", h);
  } else {
    viewGame.classList.remove("aspect-locked");
    if (btn) btn.classList.remove("aspect-active");
  }
}

// Initialize editors and resizers on load
window.addEventListener("load", () => {
  initPanelResizers();
  if (window.SceneEditor) SceneEditor.init();
  if (window.BlueprintEditor) BlueprintEditor.init();
  const isAspectLocked = localStorage.getItem("electoria_aspect_locked") !== "false";
  applyAspectRatioLock(isAspectLocked);
});

