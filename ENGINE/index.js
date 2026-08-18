const { exec } = require('child_process');
var rimraf = require("rimraf");
const path = require('path');
var { BrowserWindow, Menu, app, screen } = require('electron');
const fs = require('fs');
const fse = require('fs-extra');
const kubitdb = require('kubitdb');
const axios = require("axios");
const settings = require('./package.json');
const xapier = require("xapier");
global.isserver = false;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  function loadgame() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const taskbarHeight = primaryDisplay.size.height - primaryDisplay.workAreaSize.height;
    engine.setContentSize(primaryDisplay.workAreaSize.width, primaryDisplay.workAreaSize.height - taskbarHeight);
    engine.center();
    engine.loadURL("http://localhost:8819");
  }

  let engine = new BrowserWindow({
    width: 950,
    height: 720,
    resizable: false,
    icon: "./source/icons/iconnb.png",
    title: "Electoria Engine"
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([]));
  engine.loadFile('source/pages/start.html');

  // Synchronize version with xapier config
  new kubitdb(".version-xapier.json").set("version", settings.version);

  // Xapier auto-updater enabled
  try {
    xapier.Check("electoriaengine.zip");
    xapier.output().on("data", function(data) {
      if (data === "updatetime") {
        // Update detected
      }
      if (data === "unzipped") {
        exec("npm cache clean --force && npm i", (err, stdout) => {
          if (stdout && stdout.includes("audited")) {
            exec("npm start");
            setTimeout(() => { app.quit(); }, 2000);
          }
        });
      }
    });
  } catch (e) {
    console.warn("Xapier update check skipped:", e.message);
  }

  engine.webContents.on('console-message', (event, level, message) => {
    let parsedMsg;
    try {
      parsedMsg = JSON.parse(message);
    } catch {
      return; // Ignore non-JSON system / console logs
    }
    if (!parsedMsg || !parsedMsg.toengine) return;

    if (parsedMsg.opengame) {
      engine.setResizable(true);
      console.log("Opening game:", parsedMsg.opengame);
      var tempdb = new kubitdb("./games/" + parsedMsg.opengame + "/info.json");
      var gameType = tempdb.get("type") || "2D";
      require("./source/js/ingame/" + gameType + "main.js")(parsedMsg.opengame, __dirname, engine);
      tempdb.set("latesttime", Date.now());
      loadgame();
      exec("code .", { cwd: "./games/" + parsedMsg.opengame });
    }

    if (parsedMsg.gmenu) {
      if (parsedMsg.gmenu.delete) {
        try {
          rimraf.rimrafSync('./games/' + parsedMsg.gmenu.delete);
          rimraf.rimrafSync('./builds/build_' + parsedMsg.gmenu.delete);
          rimraf.rimrafSync('./builds/' + parsedMsg.gmenu.delete);
          setTimeout(() => {
            var datas = [];
            if (fs.existsSync("./games")) {
              fs.readdirSync("./games").forEach((x) => {
                try {
                  datas.push(JSON.parse(fs.readFileSync("./games/" + x + "/info.json").toString()));
                } catch {}
              });
            }
            engine.webContents.executeJavaScript(`mygames(${JSON.stringify(datas)})`);
          }, 500);
        } catch (err) {
          console.error("Error deleting game:", err);
        }
      } else if (parsedMsg.gmenu.folder) {
        var folderPath = path.join(__dirname, './games/' + parsedMsg.gmenu.folder);
        if (process.platform === 'darwin') {
          exec(`open "${folderPath}"`);
        } else if (process.platform === 'linux') {
          exec(`xdg-open "${folderPath}"`);
        } else if (process.platform === 'win32') {
          exec(`explorer.exe "${folderPath}"`);
        }
      }
    }

    if (parsedMsg.inpage === "mainpage") {
      var datas = [];
      if (fs.existsSync("./games")) {
        fs.readdirSync("./games").forEach((x) => {
          try {
            datas.push(JSON.parse(fs.readFileSync("./games/" + x + "/info.json").toString()));
          } catch {}
        });
      }
      engine.webContents.executeJavaScript(`mygames(${JSON.stringify(datas)})`);
      engine.webContents.executeJavaScript(`version(${JSON.stringify(settings)})`);
    }

    if (parsedMsg.exit) process.exit(0);

    if (parsedMsg.appresize) {
      if (parsedMsg.appresize.x === "auto" && parsedMsg.appresize.y === "auto") {
        const primaryDisplay = screen.getPrimaryDisplay();
        const taskbarHeight = primaryDisplay.size.height - primaryDisplay.workAreaSize.height;
        engine.setContentSize(primaryDisplay.workAreaSize.width, primaryDisplay.workAreaSize.height - taskbarHeight);
      } else if (parsedMsg.appresize.x && parsedMsg.appresize.y) {
        engine.setContentSize(Number(parsedMsg.appresize.x), Number(parsedMsg.appresize.y));
      } else if (parsedMsg.appresize.x) {
        engine.setContentSize(Number(parsedMsg.appresize.x), engine.getContentSize()[1]);
      } else if (parsedMsg.appresize.y) {
        engine.setContentSize(engine.getContentSize()[0], Number(parsedMsg.appresize.y));
      }
    }

    if (parsedMsg.newgame) {
      let ngame = new BrowserWindow({
        width: 850,
        height: 620,
        resizable: false,
        icon: "./source/icons/iconnb.png",
        title: "Electoria Engine - New Game"
      });
      ngame.loadFile('source/pages/newgame.html');
      var ver = String(parsedMsg.newgame);
      ngame.webContents.executeJavaScript(`version("${parsedMsg.newgame}")`);

      ngame.webContents.on('console-message', (ev, lvl, nMsg) => {
        let parsedNewGame;
        try {
          parsedNewGame = JSON.parse(nMsg);
        } catch {
          return; // Ignore non-JSON console logs
        }
        if (!parsedNewGame || !parsedNewGame.name) return;

        try {
          const gamePathRelative = "./games/" + parsedNewGame.name;
          const gameDir = path.join(__dirname, gamePathRelative);

          // Create Project Directories
          fse.ensureDirSync(gameDir);
          fse.ensureDirSync(path.join(gameDir, "Images"));
          fse.ensureDirSync(path.join(gameDir, "Images/Background"));
          fse.ensureDirSync(path.join(gameDir, "Public"));
          fse.ensureDirSync(path.join(gameDir, "Engine"));
          fse.ensureDirSync(path.join(gameDir, "Scripts"));
          fse.ensureDirSync(path.join(gameDir, ".vscode"));

          // Initialize info.json with empty object before kubitdb
          const infoJsonRelative = gamePathRelative + "/info.json";
          fse.outputJsonSync(infoJsonRelative, {});

          var tempdb = new kubitdb(infoJsonRelative);
          tempdb.set("type", ver + "D");
          tempdb.set("name", parsedNewGame.name);
          tempdb.set("company", parsedNewGame.comname || "Electoria");
          tempdb.set("version", "1.0");
          tempdb.set("startscreen", 1);
          tempdb.set("androidsdk", process.env.ANDROID_HOME ? process.env.ANDROID_HOME.replaceAll("\\", "\\\\") : "C:\\\\Users\\\\" + (process.env.username || "User") + "\\\\AppData\\\\Local\\\\Android\\\\Sdk");
          tempdb.set("screenresolution", {});
          tempdb.set("latesttime", Date.now());

          // Copy VS Code settings template
          if (fs.existsSync("./source/templates/vscode")) {
            fse.copySync("./source/templates/vscode", path.join(gameDir, ".vscode"));
          }

          const openType = parsedNewGame.open || "blank";

          if (openType.endsWith("blank")) {
            // Synchronous Offline Template Copying
            const engineTplDir = path.join(__dirname, "./source/templates/engine");
            if (fs.existsSync(engineTplDir)) {
              if (fs.existsSync(path.join(engineTplDir, "engine.js"))) {
                fse.copySync(path.join(engineTplDir, "engine.js"), path.join(gameDir, "Engine/engine.js"));
              }
              if (fs.existsSync(path.join(engineTplDir, "eap.js"))) {
                fse.copySync(path.join(engineTplDir, "eap.js"), path.join(gameDir, "Engine/eap.js"));
              }
              if (fs.existsSync(path.join(engineTplDir, "LICENSE"))) {
                fse.copySync(path.join(engineTplDir, "LICENSE"), path.join(gameDir, "Engine/LICENSE"));
              }
              if (fs.existsSync(path.join(engineTplDir, "onload.js"))) {
                fse.copySync(path.join(engineTplDir, "onload.js"), path.join(gameDir, "onload.js"));
              }
              if (fs.existsSync(path.join(engineTplDir, "script.js"))) {
                fse.copySync(path.join(engineTplDir, "script.js"), path.join(gameDir, "Scripts/script.js"));
              }
            }

            // Create default ingame.html
            const defaultIngameHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#0f0e17">
    <meta name="description" content="Game created with Electoria Engine">
    <meta name="author" content="${parsedNewGame.name}">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <title>${parsedNewGame.name}</title>
    <style>
      body { font-family: 'Poppins', sans-serif; overflow: hidden; margin: 0; padding: 0; background: #000; }
      #screen { position: fixed; height: 100%; width: 100%; top: 0; left: 0; }
      canvas { display: block; }
    </style>
</head>
<body>
<div id='backgrounds'>
</div>
<div id='images'>
</div>
<div id='screen'>
<canvas id="canvas" style="position:fixed;height:100%;width:100%;top:0%;left:0%;"></canvas>
</div>
<script src="./onload.js"></script>
<script src="./Engine/engine.js"></script>
<script src="./Engine/eap.js"></script>
<div id='scripts'>
<script src="./Scripts/script.js"></script>
</div>
</body>
</html>`;
            fs.writeFileSync(path.join(gameDir, "ingame.html"), defaultIngameHtml);

            // Immediately close newgame window and open game
            ngame.close();
            engine.setResizable(true);
            console.log("Opening new game:", parsedNewGame.name);
            require("./source/js/ingame/" + ver + "Dmain.js")(parsedNewGame.name, __dirname, engine);
            loadgame();
            exec("code .", { cwd: gameDir });
          } else {
            // Online Demo Game Download
            axios.get("https://api.github.com/repos/DeveloperKubilay/electoria-engine/contents/docs/demoGames/" + openType + "?ref=main")
              .then(async (res) => {
                const items = res.data;
                for (const x of items) {
                  if (x.type !== "dir" && x.download_url) {
                    const response = await axios({ url: x.download_url, method: 'GET', responseType: 'stream' });
                    const dest = path.join(gameDir, x.name);
                    await new Promise((resolve) => {
                      const writer = fs.createWriteStream(dest);
                      response.data.pipe(writer);
                      writer.on('finish', resolve);
                      writer.on('error', resolve);
                    });
                  }
                }
                ngame.close();
                engine.setResizable(true);
                console.log("Opening demo game:", parsedNewGame.name);
                require("./source/js/ingame/" + ver + "Dmain.js")(parsedNewGame.name, __dirname, engine);
                loadgame();
                exec("code .", { cwd: gameDir });
              })
              .catch((err) => {
                console.error("Demo download error:", err.message);
                ngame.close();
                engine.setResizable(true);
                require("./source/js/ingame/" + ver + "Dmain.js")(parsedNewGame.name, __dirname, engine);
                loadgame();
              });
          }
        } catch (err) {
          console.error("Error creating new game:", err);
        }
      });
    }

    if (parsedMsg.center) engine.center();
    if (parsedMsg.fullscreen) engine.setFullScreen(true);
    if (parsedMsg.fullscreen === false) engine.setFullScreen(false);
  });
});