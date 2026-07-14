gaconst canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1100;
canvas.height = 700;


let keys = {};
let mouse = {
    x:0,
    y:0,
    down:false
};


let bullets=[];
let units=[];
let blueScore=0;
let redScore=0;

let gameOver=false;


// controls

document.addEventListener("keydown",e=>{
    keys[e.key.toLowerCase()]=true;
});

document.addEventListener("keyup",e=>{
    keys[e.key.toLowerCase()]=false;
});


canvas.addEventListener("mousemove",e=>{
    mouse.x=e.clientX;
    mouse.y=e.clientY;
});


canvas.addEventListener("mousedown",()=>{
    mouse.down=true;
});

canvas.addEventListener("mouseup",()=>{
    mouse.down=false;
});



// map


const walls=[
    {x:500,y:0,w:80,h:220},
    {x:500,y:480,w:80,h:220},
    {x:300,y:280,w:170,h:50},
    {x:650,y:370,w:170,h:50}
];


const blueBase={
    x:40,
    y:280,
    w:120,
    h:140
};


const redBase={
    x:940,
    y:280,
    w:120,
    h:140
};



// flags


let blueFlag={
    x:100,
    y:350,
    homeX:100,
    homeY:350,
    team:"blue",
    carrier:null
};


let redFlag={
    x:1000,
    y:350,
    homeX:1000,
    homeY:350,
    team:"red",
    carrier:null
};





class Unit{


constructor(x,y,color,team,isPlayer=false){

this.x=x;
this.y=y;

this.color=color;

this.team=team;

this.player=isPlayer;

this.radius=20;

this.speed=isPlayer?5:2;

this.health=100;

this.cooldown=0;

this.carrying=null;

}



move(dx,dy){

let d=Math.hypot(dx,dy)||1;

let nx=this.x+dx/d*this.speed;
let ny=this.y+dy/d*this.speed;


if(!hitWall(nx,ny,this)){

this.x=nx;
this.y=ny;

}

}



shoot(target){


if(this.cooldown<=0){

let angle=Math.atan2(
target.y-this.y,
target.x-this.x
);


bullets.push({

x:this.x,
y:this.y,

dx:Math.cos(angle)*10,
dy:Math.sin(angle)*10,

team:this.team

});


this.cooldown=15;

}


}



update(){


if(this.cooldown>0)
this.cooldown--;


if(this.player){


let dx=0;
let dy=0;


if(keys.w)dy--;
if(keys.s)dy++;
if(keys.a)dx--;
if(keys.d)dx++;


this.move(dx,dy);


if(mouse.down){

this.shoot({
x:mouse.x,
y:mouse.y
});

}


}


else{


let enemy=getEnemy(this);


if(enemy){

let d=dist(this,enemy);


if(d<300)
this.shoot(enemy);


if(d>120)
this.move(
enemy.x-this.x,
enemy.y-this.y
);

}



}



this.checkFlags();


}



checkFlags(){


let enemyFlag =
this.team==="blue" ? redFlag : blueFlag;


let home =
this.team==="blue" ? blueBase : redBase;



if(!this.carrying &&
dist(this,enemyFlag)<30){

this.carrying=enemyFlag;

enemyFlag.carrier=this;

}



if(this.carrying &&
this.team==="blue" &&
insideBase(this,blueBase)){


blueScore++;

resetFlag(this.carrying);

this.carrying=null;

}



if(this.carrying &&
this.team==="red" &&
insideBase(this,redBase)){


redScore++;

resetFlag(this.carrying);

this.carrying=null;

}


}



draw(){


ctx.fillStyle=this.color;


ctx.beginPath();

ctx.arc(
this.x,
this.y,
this.radius,
0,
Math.PI*2
);

ctx.fill();


// health bar

ctx.fillStyle="black";
ctx.fillRect(
this.x-25,
this.y-35,
50,
6
);


ctx.fillStyle="lime";
ctx.fillRect(
this.x-25,
this.y-35,
50*(this.health/100),
6
);


}


}






let player=new Unit(
200,
350,
"#00ffff",
"blue",
true
);


units.push(player);



// NPCs


function addBot(team){


let bot;


if(team==="blue"){

bot=new Unit(
250,
Math.random()*500+100,
"#0088ff",
"blue"
);

}

else{

bot=new Unit(
850,
Math.random()*500+100,
"#ff3333",
"red"
);

}


units.push(bot);

}


for(let i=0;i<4;i++){

addBot("blue");
addBot("red");

}







function hitWall(x,y,u){


for(let w of walls){

if(
x+u.radius>w.x &&
x-u.radius<w.x+w.w &&
y+u.radius>w.y &&
y-u.radius<w.y+w.h
)
return true;


}


return false;

}



function dist(a,b){

return Math.hypot(
a.x-b.x,
a.y-b.y
);

}



function getEnemy(unit){

let best=null;
let shortest=9999;


for(let u of units){

if(u.team!==unit.team){

let d=dist(unit,u);


if(d<shortest){

shortest=d;
best=u;

}

}

}


return best;

}




function insideBase(u,base){

return(
u.x>base.x &&
u.x<base.x+base.w &&
u.y>base.y &&
u.y<base.y+base.h
);

}





function resetFlag(flag){

flag.x=flag.homeX;
flag.y=flag.homeY;
flag.carrier=null;

}




function updateBullets(){


for(let i=bullets.length-1;i>=0;i--){

let b=bullets[i];


b.x+=b.dx;
b.y+=b.dy;


for(let u of units){

if(
u.team!==b.team &&
dist(b,u)<20
){

u.health-=25;

bullets.splice(i,1);


if(u.health<=0){

if(u.carrying)
resetFlag(u.carrying);


u.health=100;


if(u.team==="blue"){

u.x=200;
u.y=350;

}else{

u.x=900;
u.y=350;

}


}


break;

}

}


}

}




function draw(){


ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);


// bases

ctx.fillStyle="#0088ff";
ctx.fillRect(
blueBase.x,
blueBase.y,
blueBase.w,
blueBase.h
);


ctx.fillStyle="#ff2222";
ctx.fillRect(
redBase.x,
redBase.y,
redBase.w,
redBase.h
);



// walls

for(let w of walls){

ctx.fillStyle="#555";

ctx.fillRect(
w.x,
w.y,
w.w,
w.h
);

}



// flags

drawFlag(blueFlag);
drawFlag(redFlag);


units.forEach(u=>u.draw());


bullets.forEach(b=>{

ctx.fillStyle="yellow";

ctx.fillRect(
b.x,
b.y,
6,
6
);

});



document.getElementById("blueScore").innerHTML=blueScore;
document.getElementById("redScore").innerHTML=redScore;


}



function drawFlag(f){

ctx.fillStyle=f.team==="blue"?"#00aaff":"#ff3333";

ctx.fillRect(
f.x-5,
f.y-40,
10,
80
);

}





function loop(){


units.forEach(u=>u.update());

updateBullets();

draw();


requestAnimationFrame(loop);

}


loop();