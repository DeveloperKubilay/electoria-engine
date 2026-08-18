// Electoria Engine script.js
editdisplay(1024, 720);

const player = new Component({
    name: "player",
    position: { x: 200, y: 200 },
    scale: { x: 60, y: 60 },
    color: "#ff8906",
    layer: 10,
    physic: {
        status: true,
        x: 0,
        y: 0
    },
    collision: 1
});
