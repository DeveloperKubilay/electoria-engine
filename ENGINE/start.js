const fs = require("fs");
const { execSync } = require("child_process");
var argv = process.argv.slice(2)
const path = require('path');
const dependencies = JSON.parse(fs.readFileSync("package.json")).dependencies;

var node = ""
let env = Object.assign({}, process.env); 
if(process.platform === "win32"){
if(fs.existsSync("node-v20.10.0-win-x64")) node = path.join(__dirname,"./node-v20.10.0-win-x64/")
else if(fs.existsSync("node-v20.10.0-win-x86")) node = path.join(__dirname,"./node-v20.10.0-win-x86/")
else node = "installed"
if(node != "installed") env.PATH = `${node};${env.PATH}`;
}

if(!fs.existsSync(path.join(__dirname,"./node_modules"))){
    console.log("All modules installing...\n")
    execSync("npm i --save "+Object.keys(dependencies).map((dependency, index) => `${dependency}@${dependencies[dependency]}`).join(" "), { stdio: 'inherit',env,cwd:__dirname });
    execSync("npm i electron-packager -g", { stdio: 'inherit',env,cwd:__dirname });
    console.log("\nInstalled")
}

if (argv[0] === "httpserver") {
    if(!argv[1]) return console.log("Please select game folder example: npm run start httpserver blank")
    if(!fs.existsSync("games/"+argv[1])) return console.log("Game is not found")
    var type = ""
    try{
    type = JSON.parse(fs.readFileSync("games/"+argv[1]+"/info.json").toString()).type
    if(argv[2] == "vsc") execSync("code .",{cwd:path.join(__dirname,"./games/"+argv[1])}) 
    }catch{}
    if(!type) return console.log("Game version not found")
    console.log("Server has been started localhost:8819")
    //node start httpserver testgame => node source/js/ingame/runengine.js 2D testgame
    //node --watch source/js/ingame/runengine.js 2D testgame
    execSync("node source/js/ingame/runengine.js "+type+" "+argv[1]+" ", {env,cwd:__dirname });
} else {
   if (process.platform === "win32") {
     var path1 = __dirname + "\\node_modules\\electron\\dist\\electron.exe";
     var output = `start "" "${path1}" "${__dirname}"`;
     execSync(output, { stdio: 'inherit',cwd:__dirname })
   } else {
     var path1 = __dirname + "/node_modules/electron/dist/electron";
     var output = `"${path1}" "${__dirname}"`;
     execSync(output, { stdio: 'inherit',cwd:__dirname });
   }
}

process.exit(0)