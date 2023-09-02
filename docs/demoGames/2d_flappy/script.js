editdisplay(720, 1024);

var started = false;
var block = [];
var blockname = 0;
var difference = 25;
var gameend = false;
var spawner = "";

const player = new Component({
  name: "player",
  inscreen: true,
  collision: 3,
  physic: {
    status: false,
  },
  position: {
    x: Engine_canvas.width / 2 - 200,
    y: Engine_canvas.height / 2 - 100,
  },
  scale: {
    x: 85,
    y: 75,
  },
});

function haraketet(up, nosound) {
  oyunbasladi();
  if (!nosound) new Audio("./wing.ogg").play().catch(() => {});
  if (up) {
    player.update({ physic: { y: -4 } });
  } else {
    player.update({ physic: { y: +4 } });
  }
}

keypress = (key) => {
  if (key === "W" || key == "ARROWUP") {
    haraketet(true, true);
  } else if (key === "S" || key == "ARROWDOWN") {
    haraketet(false, true);
  } else if (key == " ") {
    haraketet(true, true);
  }
};

mousescroll = function (location, speed) {
  oyunbasladi();
  if (location == "up") {
    haraketet(true, true);
  } else {
    haraketet(false, true);
  }
};

leftclicked = function () {
  haraketet(true);
};
rightclicked = function () {
  haraketet();
};

sendengine({
  changestatusbar: "#000000",
  changescreenstatus: 2,
  appresize: {
    x: 400,
    y: 600,
  },
});

Animator(
  true,
  "player", 
  [
    "yellowbird-downflap.png",
    "yellowbird-midflap.png",
    "yellowbird-upflap.png",
  ],
  "image",
  100, 
  true
);

const yerdemi = new Component({
  name: "yerdemi",
  position: {
    x: 0,
    y: Engine_canvas.height - 100,
  },
  collision: 3,
  scale: {
    x: Engine_canvas.width,
    y: 100,
  },
  layer: 200,
  image: "base.png",
});

function oyunubitir(duvar) {
  if (gameend) return;
  else gameend = true;
  gameover.update({
    opacity: 1,
  });
  sendengine({
    changestatusbar: "#FF0000",
    sendvibrate: 200,
  });
  if (duvar) {
    const sound = new Audio("./hit.ogg");
    sound.play().catch(() => {});
  } else {
    const sound = new Audio("./die.ogg");
    sound.play().catch(() => {});
    player.update({
      collision: 1,
    });
  }
  clearInterval(spawner);
  disablemouse();
  disablekeyboard();
  setTimeout(() => {
    reloadgame();
  }, 3000);
}

function successlan() {
  new Audio("./point.ogg").play().catch(() => {});
  successtext.update({
    text: String(Number(successtext.get().text) + 1),
  });
  sendengine({
    changestatusbar: "#66ff00",
    sendvibrate: 100,
  });
  setTimeout(() => {
    sendengine({
      changestatusbar: "#000000",
    });
  }, 500);
}

collisionout = function (obj, obj2) {
  if (
    obj == "player" &&
    obj2.split("lock").length == 2 &&
    obj2.split("block").length != 2
  ) {
    removeData(obj2);
    successlan();
  }
  if (obj == "player" && obj2 == "yerdemi") {
    oyunubitir();
  } else if (obj == "player" && obj2.split("block").length == 2) {
    oyunubitir(true);
  }
};

const gameover = new Component({
  name: "gameover",
  position: {
    x: 200,
    y: 164,
  },
  scale: {
    x: 320,
    y: 150,
  },
  opacity: 0.001,
  layer: 200,
  image: "gameover.png",
});

const startalert = new Component({
  name: "startalert",
  position: {
    x: 100,
    y: 0,
  },
  scale: {
    x: Engine_canvas.width - 200,
    y: Engine_canvas.height - 400,
  },
  image: "message.png",
});

function oyunbasladi() {
  if (started) return;
  else started = true;
  removeData("startalert");
  player.update({
    physic: {
      status: true,
    },
  });
  successtext.update({
    opacity: 1,
  });

  setInterval(() => {    //Let your space narrow to pass as you go
    if (difference == 100) return;
    difference++;
  }, 60000);

  spawner = setInterval(() => {  //movement system
    block.map((x) => {
      updateData({
        name: x + "-",
        position: {
          x: "-30",
        },
      });
      updateData({
        name: x.slice(1) + "!",
        position: {
          x: "-30",
        },
      });
      updateData({
        name: x,
        position: {
          x: "-30",
        },
      });
    });
  }, 100);

  setInterval(() => {  //Generate random bars
    if (!started) return;

    var name = "block" + blockname;
    var randomheight = generaterandomnumber(-100, 180);

    new Component({//top bar
      name: name,
      position: {
        x: Engine_canvas.width + 100,
        y: -100 - randomheight,
      },
      scale: {
        x: 40,
        y: Engine_canvas.height / 2,
      },
      collision: 3,
      rotate: 180,
      image: "pipe-green.png",
    });

    new Component({//bottom bar
      name: name + "-",
      position: {
        x: Engine_canvas.width + 100,
        y:
          Engine_canvas.height -
          (Engine_canvas.height / 2 - 180) -
          difference -
          randomheight,
      },
      scale: {
        x: 40,
        y: Engine_canvas.height / 2,
      },
      collision: 3,
      image: "pipe-green.png",
    });
    new Component({//the part he told
      name: name.slice(1) + "!",
      position: {
        x: Engine_canvas.width + 141,
        y: 0,
      },
      scale: {
        x: 4,
        y: Engine_canvas.height,
      },
      collision: 3,
      color: false,
    });

    blockname++;
    block.push(name);

    setTimeout(() => {
      removeData(name);
      removeData(name + "-");
      removeData(name.slice(1) + "!");
    }, 30000);
  }, 5000);
}

addfont("flappy", "./flappy-font.ttf");

const successtext = new Text({
  name: "successtext",
  position: {
    x: Engine_canvas.width / 2 - 70,
    y: 100,
  },
  text: "0",
  font: "flappy",
  color: "white",
  size: "70px",
  opacity: 0.001,
});
