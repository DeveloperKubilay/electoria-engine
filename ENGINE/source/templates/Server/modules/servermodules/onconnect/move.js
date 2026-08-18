module.exports = function(data){
    const settings = {//Fasts
        y:13,
        x:8
    }
    data.socket.on("Move",(event =>{

        data.io.emit("Move",{name:data.socket.id,data:{
            x:event.x == true ? settings.x : event.x == false ? -settings.x : undefined,
            y:event.y == true ? -settings.y : event.y == false ? settings.y : undefined
        }})

    }))

}