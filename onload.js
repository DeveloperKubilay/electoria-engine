Engine_onload = //https://electoriaengine.gitbook.io/api/engine/onload
{
    fps:"auto",//you can select "75","vsync" or "auto" (auto = 250),
    tickrate:"11",//tickrate in milliseconds (1 is 1000/1 refresh time), "auto" 
    forcetickrate:true,//even if the computer crashes, it continues events in the background
    onlyonscreen:true,//just render what's on the screen (perfect for optomisation)
    splitelimit:"20000",//sprites on max screen
    backgroundspeed:"250",//transition speed to the next image if background is animated
    gravity:"0.9",//default physics settings
    yfriction:"0.5",//default physics settings
    xfriction:"0.08",//default physics settings
    forcepresstime:"60",//keypress fps
    gamepadpressinterval:"1000",//gamepad update speed
    autoshaders:60000//something like the shadow of the sun,If you type 0 it closes,you enter in-game time
}
