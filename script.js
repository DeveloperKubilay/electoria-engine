editdisplay(1024, 720);

const player1 = new Component({
  name: "player1",
  inscreen: true,
  physic: {
    status: true,
  },
  position: {
    x: 0,
    y: 0,
  },
  scale: {
    x: 100,
    y: 180,
  },
  color:"red"
});

keypress = (key) => {
  if (key === "W" || key == "ARROWUP") {
    player1.update({ physic: { y:-8 } });
  } else if (key === "S" || key == "ARROWDOWN") {
    player1.update({ physic: { y: +8 } });
  } else if (key === "A" || key == "ARROWLEFT") {
    player1.update({ physic: { x: -5 } });
  } else if (key === "D" || key == "ARROWRIGHT") {
    player1.update({ physic: { x: +5 } });
  }
};
