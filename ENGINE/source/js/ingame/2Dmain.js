const path = require('path').join;
const Rpath = require("path");
const exec = require('child_process').exec;
const fs = require('fs');
const fse = require('fs-extra');
const rimraf = require("rimraf");
const express = require("express");
const bodyParser = require('body-parser');
const json5 = require('json5');
const app = express();
const glob = require("glob").globSync;
const axios = require('axios');

// Helper to extract balanced object literals { ... }
function extractBalancedObject(str, startIndex) {
  let open = 0;
  let start = -1;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '{') {
      if (open === 0) start = i;
      open++;
    } else if (str[i] === '}') {
      open--;
      if (open === 0 && start !== -1) {
        return str.substring(start, i + 1);
      }
    }
  }
  return null;
}

module.exports = function(name, dirname, __engine) {
  function gotofocus(refresh) {
    if (__engine) {
      __engine.setAlwaysOnTop(true);
      __engine.show();
      __engine.setAlwaysOnTop(false);
      __engine.focus();
      if (refresh) __engine.loadURL("http://localhost:8819");
    }
  }

  var gamedir = path(dirname, "./games/" + name);
  var source = path(dirname, "./source");

  const server = require('http').createServer(app);
  const io = require('socket.io')(server);
  server.listen(8819);

  app.set('view engine', 'ejs');
  app.use(express.static(source));
  app.use(express.static(gamedir));
  app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
  app.use(bodyParser.json({ limit: '50mb' }));
  app.set('views', path(source, "./pages/ingame"));

  app.use((req, res, next) => {
    res.locals.modernUI = true;
    res.locals.gameName = name;
    next();
  });

  app.get("/gotofocus", function(req, res) {
    gotofocus(true);
    res.end();
  });

  app.get("/", function(req, res) {
    res.render("2Dmain.ejs", { gameName: name });
  });

  app.get("/openvscode", function(req, res) {
    exec("code .", { cwd: gamedir });
    res.json({ success: true });
  });

  app.get("/getimages", function(req, res) {
    var list = [];
    var imagesFolder = path(gamedir, "./Images");
    if (fs.existsSync(imagesFolder)) {
      try {
        var files = glob(path(imagesFolder, "**/*.*").replace(/\\/g, "/"));
        files.forEach(f => {
          if (fs.statSync(f).isFile()) {
            var base = Rpath.basename(f);
            if (!list.includes(base)) list.push(base);
          }
        });
      } catch (e) {}
    }
    res.json(list);
  });

  app.get("/getimagefile", function(req, res) {
    var filename = req.query.name;
    if (!filename) return res.status(404).end();
    var filePath = path(gamedir, "./Images", filename);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    var imagesFolder = path(gamedir, "./Images");
    if (fs.existsSync(imagesFolder)) {
      var all = fs.readdirSync(imagesFolder);
      var found = all.find(f => f.toLowerCase() === filename.toLowerCase());
      if (found) {
        return res.sendFile(path(imagesFolder, found));
      }
    }
    res.status(404).end();
  });

  app.get("/live", function(req, res) {
    if (!fs.existsSync(path(gamedir, "./ingame.html"))) return res.redirect("/compile");
    res.sendFile(path(gamedir, "./ingame.html"));
  });

  if (global.isserver) {
    app.get("/downloadaszip", function(req, res) {
      res.download(path(dirname, "./builds/build_" + name, "output.zip"));
    });
  }

  // Regex-based Compiler
  app.get("/compile", function(req, res) {
    var text = "";
    var ingamePath = path(gamedir, "./ingame.html");
    if (fs.existsSync(ingamePath)) {
      try {
        text = fs.readFileSync(ingamePath).toString();
      } catch {}
    }

    var bgList = [];
    var bgFolder = path(gamedir, "./Images/Background");
    if (fs.existsSync(bgFolder)) {
      try {
        fs.readdirSync(bgFolder).forEach((x) => {
          if (fs.statSync(path(bgFolder, x)).isFile()) {
            bgList.push(`<img id="${x}" src="./Images/Background/${x}" style="display:none">`);
          }
        });
      } catch {}
    }

    var imgList = [];
    var imagesRoot = Rpath.resolve(gamedir, "Images").replace(/\\/g, "/");
    var allImgFiles = glob(path(gamedir, "./Images/**").replace(/\\/g, "/"));
    allImgFiles.forEach((file) => {
      if (fs.statSync(file).isFile() && !file.includes("Background")) {
        var normFile = Rpath.resolve(file).replace(/\\/g, "/");
        var base = Rpath.basename(file);
        var rel = "./Images/" + normFile.substring(imagesRoot.length + 1);
        imgList.push(`<img id="${base}" src="${rel}" style="display:none">`);
      }
    });

    var scriptList = [];
    var scriptsRoot = Rpath.resolve(gamedir, "Scripts").replace(/\\/g, "/");
    var allScriptFiles = glob(path(gamedir, "./Scripts/**/*.js").replace(/\\/g, "/"));
    allScriptFiles.sort((a, b) => {
      if (a.endsWith("script.js")) return -1;
      if (b.endsWith("script.js")) return 1;
      if (a.endsWith("blueprint_gen.js")) return 1;
      if (b.endsWith("blueprint_gen.js")) return -1;
      return a.localeCompare(b);
    });

    allScriptFiles.forEach((file) => {
      if (fs.statSync(file).isFile()) {
        var normFile = Rpath.resolve(file).replace(/\\/g, "/");
        var rel = "./Scripts/" + normFile.substring(scriptsRoot.length + 1);
        scriptList.push(`<script src="${rel}"></script>`);
      }
    });

    var output = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#0f0e17">
    <meta name="description" content="Game created with Electoria Engine">
    <meta name="author" content="${name}">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <title>${name}</title>
    <style>
      body { font-family: 'Poppins', sans-serif; overflow: hidden; margin: 0; padding: 0; background: #000; }
      #screen { position: fixed; height: 100%; width: 100%; top: 0; left: 0; }
      canvas { display: block; }
    </style>
</head>
<body>
<div id='backgrounds'>
${bgList.join("\n")}
</div>
<div id='images'>
${imgList.join("\n")}
</div>
<div id='screen'>
<canvas id="canvas" style="position:fixed;height:100%;width:100%;top:0%;left:0%;"></canvas>
</div>
<script src="./onload.js"></script>
<script src="./Engine/engine.js"></script>
<script src="./Engine/eap.js"></script>
<div id='scripts'>
${scriptList.join("\n")}
</div>
</body>
</html>`;

    fs.writeFileSync(ingamePath, output);
    res.redirect("/");
  });

  // Get Data for Properties Inspector
  app.post("/getdata", function(req, res) {
    var item = req.body.selecteditem;
    var found = false;
    var allScripts = glob(path(gamedir, "./Scripts/**/*.js").replace(/\\/g, "/"));
    
    for (var file of allScripts) {
      try {
        var source = fs.readFileSync(file).toString();
        // Check Component
        let compRegex = /(?:new\s+)?Component\s*\(/gi;
        let match;
        while ((match = compRegex.exec(source)) !== null) {
          let rawObj = extractBalancedObject(source, match.index);
          if (rawObj) {
            try {
              let comp = json5.parse(rawObj);
              if (comp.name === item) {
                return res.send({ data: comp, type: "component", file: file, success: true });
              }
            } catch {}
          }
        }
        // Check Text
        let textRegex = /(?:new\s+)?Text\s*\(/gi;
        while ((match = textRegex.exec(source)) !== null) {
          let rawObj = extractBalancedObject(source, match.index);
          if (rawObj) {
            try {
              let txt = json5.parse(rawObj);
              if (txt.name === item) {
                return res.send({ data: txt, type: "text", file: file, success: true });
              }
            } catch {}
          }
        }
      } catch {}
    }
    res.send({ type: "invalid", success: false });
  });

  // Set Data from Properties Inspector or Gizmo or Animation Studio
  app.post("/setdata", function(req, res) {
    var item = req.body;
    if (!item || !item.name) return res.json({ success: false });
    
    var targetFile = item.file;
    if (!targetFile || !fs.existsSync(targetFile)) {
      targetFile = path(gamedir, "./Scripts/script.js");
      if (!fs.existsSync(path(gamedir, "./Scripts"))) {
        fse.ensureDirSync(path(gamedir, "./Scripts"));
      }
    }
    if (!fs.existsSync(targetFile)) {
      fs.writeFileSync(targetFile, "");
    }

    var source = fs.readFileSync(targetFile).toString();
    var objPattern = new RegExp(`(?:(?:const|let|var)\\s+${item.name}\\s*=\\s*new\\s+(?:Component|Text)\\s*\\([\\s\\S]*?\\);?)|(?:new\\s+(?:Component|Text)\\s*\\([\\s\\S]*?\\))`, 'g');
    var replaced = false;

    var newSource = source.replace(objPattern, function(match) {
      try {
        var contentMatch = match.match(/new\s+(?:Component|Text)\s*\(([\s\S]*)\)/);
        if (contentMatch) {
          var parsed = json5.parse(contentMatch[1]);
          if (parsed.name === item.name || match.includes(`${item.name} =`)) {
            replaced = true;
            var updatedObj = typeof item.data === 'string' ? json5.parse(item.data) : item.data;
            var merged = Object.assign({}, parsed, updatedObj);
            merged.name = item.name;
            var itemType = (item.type === "text" || merged.type === "text") ? "Text" : "Component";
            return `const ${item.name} = new ${itemType}(${JSON.stringify(merged, null, 2)});`;
          }
        }
      } catch {}
      return match;
    });

    if (!replaced) {
      var itemType = item.type === "text" ? "Text" : "Component";
      var parsedData = typeof item.data === 'string' ? json5.parse(item.data) : item.data;
      parsedData.name = item.name;
      newSource += `\n\nconst ${item.name} = new ${itemType}(${JSON.stringify(parsedData, null, 2)});`;
    }

    fs.writeFileSync(targetFile, newSource);
    res.json({ success: true });
  });

  // Get All Scene Entities for Scene View (100% Robust)
  app.get("/getsceneentities", function(req, res) {
    var entities = [];
    var allScripts = glob(path(gamedir, "./Scripts/**/*.js").replace(/\\/g, "/"));

    allScripts.forEach((file) => {
      try {
        var source = fs.readFileSync(file).toString();
        // Components
        let compRegex = /(?:new\s+)?Component\s*\(/gi;
        let match;
        while ((match = compRegex.exec(source)) !== null) {
          let rawObj = extractBalancedObject(source, match.index);
          if (rawObj) {
            try {
              let comp = json5.parse(rawObj);
              if (comp && comp.name) {
                entities.push({ type: "component", data: comp, file: file });
              }
            } catch {}
          }
        }
        // Text
        let textRegex = /(?:new\s+)?Text\s*\(/gi;
        while ((match = textRegex.exec(source)) !== null) {
          let rawObj = extractBalancedObject(source, match.index);
          if (rawObj) {
            try {
              let txt = json5.parse(rawObj);
              if (txt && txt.name) {
                entities.push({ type: "text", data: txt, file: file });
              }
            } catch {}
          }
        }
      } catch {}
    });

    res.json(entities);
  });

  // Blueprint Routes (Save / Load Graph and Compiled JS)
  app.get("/getblueprints", function(req, res) {
    var bpPath = path(gamedir, "./blueprints.json");
    if (fs.existsSync(bpPath)) {
      try {
        var data = JSON.parse(fs.readFileSync(bpPath).toString());
        return res.json(data);
      } catch (e) {
        return res.json({ nodes: [], connections: [] });
      }
    }
    res.json({ nodes: [], connections: [] });
  });

  app.post("/saveblueprints", function(req, res) {
    try {
      var graphData = req.body.graph || { nodes: [], connections: [] };
      var compiledCode = req.body.code || "// Blueprint Compiled Code\n";

      // Save Graph JSON
      fs.writeFileSync(path(gamedir, "./blueprints.json"), JSON.stringify(graphData, null, 2));

      // Save Compiled JS
      fse.ensureDirSync(path(gamedir, "./Scripts"));
      fs.writeFileSync(path(gamedir, "./Scripts/blueprint_gen.js"), compiledCode);

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  function openexplorer(type, x, pathh) {
    if (global.isserver) return;
    if (!pathh) pathh = gamedir;
    if (process.platform === 'darwin') {
      exec(`open "${x.split("/").reverse()[0]}"`, { cwd: path(pathh, x.replace(x.split("/").reverse()[0], "")) });
    } else if (process.platform === 'linux') {
      exec(`xdg-open "${x.split("/").reverse()[0]}"`, { cwd: path(pathh, x.replace(x.split("/").reverse()[0], "")) });
    }
    if (type === "dir") {
      if (process.platform === 'win32') {
        exec(`explorer.exe "${path(pathh, x)}"`);
      }
    } else {
      exec(`start "" "${x.split("/").reverse()[0]}"`, { cwd: path(pathh, x.replace(x.split("/").reverse()[0], "")) });
    }
  }

  app.post("/getfiles", function(req, res) {
    if (req.body.explorer) {
      openexplorer("dir", req.body.explorer);
    } else if (req.body.folder) {
      fs.mkdirSync(path(gamedir, req.body.folder));
    } else if (req.body.remove) {
      rimraf.rimrafSync(path(gamedir, req.body.remove));
    } else if (req.body.open) {
      openexplorer("file", req.body.open);
    } else if (req.body.path) {
      var files = [];
      try {
        fs.readdirSync(path(gamedir, req.body.path)).forEach((x) => {
          if (fs.statSync(path(gamedir, req.body.path, x)).isDirectory()) {
            files.push({ d: true, file: x });
          } else {
            files.push({ file: x });
          }
        });
        files.sort((a, b) => {
          if (a.d && !b.d) return -1;
          if (!a.d && b.d) return 1;
          return 0;
        });
      } catch {}
      res.send(files);
    }
  });

  io.on('connection', (socket) => {
    socket.on('server', (data) => {
      if (data.build) {
        var type = data.build;
        try {
          var settings = JSON.parse(fs.readFileSync(path(gamedir, "./info.json")).toString());
        } catch {
          return;
        }
        var buildpath = path(dirname, "./builds/build_" + name);

        if (type === "windows" || type === "linux" || type === "macos") {
          rimraf.rimrafSync(buildpath);
          setTimeout(() => {
            fse.ensureDirSync(buildpath);
            fse.copySync(path(source, "./templates/build/electron"), buildpath);
            fse.copySync(gamedir, path(buildpath, "./source"));
            rimraf.rimrafSync(path(buildpath, "./source/.vscode"));
            fs.writeFileSync(path(buildpath, "package.json"), fs.readFileSync(path(buildpath, "package.json")).toString().replaceAll("electoria_engine", settings.name));
            settings.androidsdk = "";
            fs.writeFileSync(path(buildpath, "info.json"), JSON.stringify(settings, null, 2));
            var outputtype = type;
            if (type === "windows") outputtype = "win32";
            if (type === "macos" && process.platform === 'win32') {
              openexplorer("dir", "./", buildpath);
              io.emit('client', { build: "finished" });
              gotofocus();
              return;
            } else if (type === "macos") {
              outputtype = "darwin";
            }

            exec(`npm init -y && npm i kubitdb electron && electron-packager ./ --platform=${outputtype} --overwrite --asar=true --prune=true`, { cwd: buildpath }, (err, stdout, stderr) => {
              var exportt = "./";
              if (type === "windows") exportt = "./" + name + "-win32-x64";
              else if (type === "linux") exportt = "./" + name + "-linux-x64";
              fse.ensureDirSync(path(buildpath, exportt, "./source"));
              if (fs.existsSync(path(buildpath, "engine/app.png"))) {
                fse.copySync(path(buildpath, "engine/app.png"), path(buildpath, exportt, "./source/app.png"));
              }
              if (fs.existsSync(path(gamedir, "gameicon.png"))) {
                fse.copySync(path(gamedir, "gameicon.png"), path(buildpath, exportt, "./source/gameicon.png"));
              }
              if (fs.existsSync(path(source, "./templates/engine/LICENSE"))) {
                fse.copySync(path(source, "./templates/engine/LICENSE"), path(buildpath, exportt, "Electoria Engine LICENSE.txt"));
              }
              io.emit('client', { build: "finished" });
              gotofocus();
              openexplorer("dir", exportt, buildpath);
            });
            io.emit('client', { build: "package" });
          }, 1000);
        } else if (type === "android") {
          buildpath = path(dirname, "./builds/" + name);
          rimraf.rimrafSync(buildpath);
          setTimeout(() => {
            fse.ensureDirSync(buildpath);
            fse.copySync(path(source, "./templates/build/Android"), buildpath);
            fse.copySync(gamedir, path(buildpath, "./app/src/main/assets"));
            rimraf.rimrafSync(path(buildpath, "./app/src/main/assets/.vscode"));
            var addr = "com." + (settings.company || "company") + "." + settings.name;
            fs.writeFileSync(path(buildpath, "app/build.gradle"), fs.readFileSync(path(buildpath, "app/build.gradle")).toString().replaceAll("com.example.myapplication", addr));
            fs.writeFileSync(path(buildpath, "app/src/main/AndroidManifest.xml"), fs.readFileSync(path(buildpath, "app/src/main/AndroidManifest.xml")).toString().replaceAll(`Electoria engine`, settings.name));
            fs.writeFileSync(path(buildpath, "settings.gradle"), fs.readFileSync(path(buildpath, "settings.gradle")).toString().replaceAll("Electoria engine", settings.name));
            fs.writeFileSync(path(buildpath, "local.properties"), "sdk.dir=" + (settings.androidsdk || ""));

            try {
              fs.renameSync(path(buildpath, "app/src/main/java/com/example"), path(buildpath, "app/src/main/java/com/" + (settings.company || "company")));
              fs.renameSync(path(buildpath, "app/src/main/java/com/" + (settings.company || "company") + "/myapplication"), path(buildpath, "app/src/main/java/com/" + (settings.company || "company") + "/" + settings.name));
            } catch {}

            if (fs.existsSync(path(gamedir, "gameicon.png"))) {
              fse.copySync(path(gamedir, "gameicon.png"), path(buildpath, "app/src/main/res/drawable/ic_launcher.png"));
            }

            var mainJavaPath = path(buildpath, "app/src/main/java/com/" + (settings.company || "company") + "/" + settings.name + "/MainActivity.java");
            if (fs.existsSync(mainJavaPath)) {
              var mainJava = fs.readFileSync(mainJavaPath).toString().replaceAll("package com.example.myapplication;", `package ${addr};`);
              if (settings.startscreen === 1) {
                mainJava = mainJava.replaceAll("ingame.html", `startelectoriaengine.html`);
              }
              fs.writeFileSync(mainJavaPath, mainJava);
            }

            var gradlewcom = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
            io.emit('client', { build: "package" });
            exec(`${gradlewcom} assembleDebug`, { cwd: buildpath }, (err, stdout) => {
              if (stdout && stdout.includes("BUILD SUCCESSFUL")) {
                try { fs.unlinkSync(path(buildpath, "./app/build/outputs/apk/debug/output-metadata.json")); } catch {}
                openexplorer("dir", "./app/build/outputs/apk/debug", buildpath);
                io.emit('client', { build: "finished" });
                gotofocus();
              }
            });
          }, 1500);
        } else if (type === "html") {
          if (global.isserver) {
            const yazl = require("yazl");
            var zipfile = new yazl.ZipFile();
            rimraf.rimrafSync(buildpath);
            setTimeout(() => {
              fse.ensureDirSync(buildpath);
              fse.copySync(gamedir, buildpath);
              rimraf.rimrafSync(path(buildpath, "./.vscode"));
              var gc = glob(path(buildpath, "/**").replace(/\\/g, "/")).filter(z => fs.statSync(z).isFile());
              for (var file of gc) {
                zipfile.addFile(file, Rpath.relative(buildpath, file).replace(/\\/g, "/"));
              }
              zipfile.outputStream.pipe(fs.createWriteStream(path(buildpath, "./output.zip"))).on("close", function() {
                io.emit('client', { build: "finished" });
                io.emit('client', { build: "openurl", url: "/downloadaszip" });
              });
              zipfile.end();
            }, 1000);
          } else {
            openexplorer("dir", "./");
            io.emit('client', { build: "finished" });
            gotofocus();
          }
        }
      }
    });
  });

  app.get("/build", function(req, res) {
    res.render("build.ejs", { gameName: name });
  });
};