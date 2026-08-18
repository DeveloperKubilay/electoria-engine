global.isserver = true
console.log("Server has been started localhost:8819")
require("./"+process.argv[2]+"main.js")(process.argv[3],require("path").join(__dirname,'../../..'))