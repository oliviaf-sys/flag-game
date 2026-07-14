// =====================================
// CAPTURE THE FLAG ARENA
// PART 1 - CORE ENGINE + PLAYER + MAP
// =====================================


const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1200;
canvas.height = 700;


// =============================
// INPUT
// =============================

const keys = {};

const mouse = {
    x:600,
    y:350,
    down:false
};


window.addEventListener("keydown", e => {

    keys[e.code] = true;

    if(
        [
            "KeyW",
            "KeyA",
            "KeyS",
            "KeyD",
            "Space"
        ].includes(e.code)
    ){
        e.preventDefault();
    }

});


window.addEventListener("keyup", e => {

    keys[e.code] = false;

});



canvas.addEventListener("mousemove", e => {

    const rect = canvas.getBoundingClientRect();

    mouse.x =
        (e.clientX - rect.left)
        *
        canvas.width /
        rect.width;


    mouse.y =
        (e.clientY - rect.top)
        *
        canvas.height /
        rect.height;

});



canvas.addEventListener("mousedown",()=>{

    mouse.down=true;

});


canvas.addEventListener("mouseup",()=>{

    mouse.down=false;

});



// =============================
// GAME DATA
// =============================


const game = {

    blueScore:0,
    redScore:0,

    over:false

};



const bullets=[];

const players=[];



// =============================
// MAP
// =============================


const walls=[

    {
        x:560,
        y:0,
        w:80,
        h:230
    },

    {
        x:560,
        y:470,
        w:80,
        h:230
    },

    {
        x:330,
        y:300,
        w:160,
        h:60
    },

    {
        x:710,
        y:340,
        w:160,
        h:60
    }

];


const blueBase={

    x:40,
    y:270,
    w:140,
    h:160

};


const redBase={

    x:1020,
    y:270,
    w:140,
    h:160

};



// =============================
// UTILITIES
// =============================


function distance(a,b){

    return Math.hypot(
        a.x-b.x,
        a.y-b.y
    );

}



function blocked(x,y,r){


    for(const w of walls){

        if(

            x+r>w.x &&
            x-r<w.x+w.w &&
            y+r>w.y &&
            y-r<w.y+w.h

        ){

            return true;

        }

    }


    return false;

}




// =============================
// CHARACTER
// =============================


class Character{


constructor(x,y,team,player=false){

    this.x=x;
    this.y=y;

    this.team=team;

    this.player=player;


    this.radius=24;


    this.speed =
        player ? 5 : 2.3;


    this.health=100;


    this.cooldown=0;


    this.angle=0;


    this.carrying=null;

}



move(dx,dy){


    let length =
        Math.hypot(dx,dy);


    if(length===0)
        return;


    dx/=length;
    dy/=length;


    let nx =
        this.x+
        dx*this.speed;


    let ny =
        this.y+
        dy*this.speed;



    if(!blocked(nx,ny,this.radius)){


        this.x=nx;
        this.y=ny;

    }


}



update(){


    if(this.cooldown>0)
        this.cooldown--;



    if(this.player){


        let dx=0;
        let dy=0;


        if(keys.KeyW)dy--;
        if(keys.KeyS)dy++;
        if(keys.KeyA)dx--;
        if(keys.KeyD)dx++;


        this.move(dx,dy);


        this.angle =
            Math.atan2(
                mouse.y-this.y,
                mouse.x-this.x
            );

    }


}



draw(){


    // shadow

    ctx.fillStyle="rgba(0,0,0,.35)";

    ctx.beginPath();

    ctx.ellipse(
        this.x,
        this.y+22,
        28,
        10,
        0,
        0,
        Math.PI*2
    );

    ctx.fill();



    // body

    ctx.fillStyle =
        this.team==="blue"
        ?
        "#009cff"
        :
        "#ff3333";


    ctx.beginPath();

    ctx.arc(
        this.x,
        this.y,
        this.radius,
        0,
        Math.PI*2
    );

    ctx.fill();



    if(this.player){

        ctx.strokeStyle="white";

        ctx.lineWidth=3;

        ctx.stroke();

    }


    // health

    ctx.fillStyle="black";

    ctx.fillRect(
        this.x-25,
        this.y-38,
        50,
        7
    );


    ctx.fillStyle="#44ff44";

    ctx.fillRect(
        this.x-25,
        this.y-38,
        50*this.health/100,
        7
    );


    // direction

    ctx.strokeStyle="white";

    ctx.beginPath();

    ctx.moveTo(
        this.x,
        this.y
    );

    ctx.lineTo(
        this.x+
        Math.cos(this.angle)*35,

        this.y+
        Math.sin(this.angle)*35
    );

    ctx.stroke();

}



}



// =============================
// CREATE PLAYER
// =============================


const player =
new Character(
    220,
    350,
    "blue",
    true
);


players.push(player);// =====================================
// PART 2 - COMBAT + BOTS
// =====================================



// =============================
// SHOOTING
// =============================


function shoot(unit,target){


    if(unit.cooldown>0)
        return;



    const angle =
        Math.atan2(
            target.y-unit.y,
            target.x-unit.x
        );



    bullets.push({

        x:unit.x,
        y:unit.y,

        dx:Math.cos(angle)*12,
        dy:Math.sin(angle)*12,

        team:unit.team,

        damage:25

    });



    unit.cooldown=18;

}







// =============================
// PLAYER SHOOTING
// =============================


function handlePlayerShoot(){


    if(mouse.down){


        shoot(
            player,
            {
                x:mouse.x,
                y:mouse.y
            }
        );


    }


}







// =============================
// BOT CLASS
// =============================


class Bot extends Character{


constructor(x,y,team){


    super(x,y,team,false);


    this.speed=2.2;

    this.target=null;


}





update(){


    super.update();



    let enemy=null;

    let closest=99999;



    for(const p of players){


        if(p.team!==this.team){


            const d=
            distance(this,p);



            if(d<closest){

                closest=d;
                enemy=p;

            }


        }


    }



    this.target=enemy;



    if(enemy){



        this.angle =
            Math.atan2(
                enemy.y-this.y,
                enemy.x-this.x
            );



        if(closest<350){

            shoot(
                this,
                enemy
            );

        }



        if(closest>130){


            this.move(
                enemy.x-this.x,
                enemy.y-this.y
            );


        }


    }



}



}






// =============================
// CREATE BOTS
// =============================


function spawnBots(){


    for(let i=0;i<4;i++){


        players.push(

            new Bot(
                280,
                150+i*110,
                "blue"
            )

        );



        players.push(

            new Bot(
                920,
                150+i*110,
                "red"
            )

        );


    }


}



spawnBots();







// =============================
// BULLET SYSTEM
// =============================


function updateBullets(){



    for(
        let i=bullets.length-1;
        i>=0;
        i--
    ){



        let b=bullets[i];



        b.x+=b.dx;

        b.y+=b.dy;



        // remove outside map

        if(

            b.x<0 ||
            b.x>canvas.width ||
            b.y<0 ||
            b.y>canvas.height

        ){

            bullets.splice(i,1);

            continue;

        }





        for(const p of players){



            if(

                p.team!==b.team &&
                distance(b,p)<p.radius

            ){


                p.health-=b.damage;



                bullets.splice(i,1);



                if(p.health<=0){


                    respawn(p);


                }


                break;

            }


        }



    }


}





function respawn(p){



    p.health=100;



    if(p.team==="blue"){


        p.x=220;
        p.y=350;


    }
    else{


        p.x=980;
        p.y=350;


    }



}







// =============================
// DRAW BULLETS
// =============================


function drawBullets(){



    for(const b of bullets){



        ctx.fillStyle="#ffe600";



        ctx.beginPath();

        ctx.arc(
            b.x,
            b.y,
            5,
            0,
            Math.PI*2
        );


        ctx.fill();


    }


}// =====================================
// PART 3 - FLAGS + RENDER + GAME LOOP
// =====================================



// =============================
// FLAGS
// =============================


const blueFlag = {

    x:110,
    y:350,

    homeX:110,
    homeY:350,

    team:"blue",

    carrier:null

};


const redFlag = {

    x:1090,
    y:350,

    homeX:1090,
    homeY:350,

    team:"red",

    carrier:null

};






function resetFlag(flag){


    flag.x=flag.homeX;

    flag.y=flag.homeY;

    flag.carrier=null;


}






function updateFlags(){



    for(const p of players){



        const enemyFlag =
            p.team==="blue"
            ?
            redFlag
            :
            blueFlag;



        const ownBase =
            p.team==="blue"
            ?
            blueBase
            :
            redBase;




        // grab flag

        if(
            !p.carrying &&
            distance(p,enemyFlag)<35
        ){


            p.carrying=enemyFlag;

            enemyFlag.carrier=p;


        }



        // follow carrier

        if(p.carrying){


            p.carrying.x=p.x;

            p.carrying.y=p.y;


        }




        // score blue

        if(

            p.team==="blue" &&
            p.carrying &&
            insideBase(p,blueBase)

        ){


            game.blueScore++;

            resetFlag(
                p.carrying
            );

            p.carrying=null;


        }




        // score red

        if(

            p.team==="red" &&
            p.carrying &&
            insideBase(p,redBase)

        ){


            game.redScore++;

            resetFlag(
                p.carrying
            );

            p.carrying=null;


        }


    }


}







function insideBase(p,base){


    return(

        p.x>base.x &&
        p.x<base.x+base.w &&

        p.y>base.y &&
        p.y<base.y+base.h

    );


}







// =============================
// MAP DRAWING
// =============================


function drawMap(){



    // background


    ctx.fillStyle="#17451c";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );





    // grass lines


    ctx.strokeStyle=
    "rgba(255,255,255,.04)";


    for(let x=0;x<1200;x+=50){


        ctx.beginPath();

        ctx.moveTo(x,0);

        ctx.lineTo(x,700);

        ctx.stroke();


    }



    for(let y=0;y<700;y+=50){


        ctx.beginPath();

        ctx.moveTo(0,y);

        ctx.lineTo(1200,y);

        ctx.stroke();


    }





    // bases


    ctx.fillStyle=
    "rgba(0,150,255,.3)";


    ctx.fillRect(
        blueBase.x,
        blueBase.y,
        blueBase.w,
        blueBase.h
    );



    ctx.fillStyle=
    "rgba(255,50,50,.3)";


    ctx.fillRect(
        redBase.x,
        redBase.y,
        redBase.w,
        redBase.h
    );





    // walls


    for(const w of walls){


        ctx.fillStyle="#555";


        ctx.fillRect(
            w.x,
            w.y,
            w.w,
            w.h
        );


        ctx.strokeStyle="#888";

        ctx.strokeRect(
            w.x,
            w.y,
            w.w,
            w.h
        );


    }


}







function drawFlag(flag){



    ctx.strokeStyle =
        flag.team==="blue"
        ?
        "#00aaff"
        :
        "#ff3333";



    ctx.lineWidth=5;



    ctx.beginPath();


    ctx.moveTo(
        flag.x,
        flag.y-45
    );


    ctx.lineTo(
        flag.x,
        flag.y+45
    );


    ctx.stroke();





    ctx.fillStyle =
        flag.team==="blue"
        ?
        "#00aaff"
        :
        "#ff3333";



    ctx.beginPath();


    ctx.moveTo(
        flag.x,
        flag.y-45
    );


    ctx.lineTo(
        flag.x+35,
        flag.y-25
    );


    ctx.lineTo(
        flag.x,
        flag.y-5
    );


    ctx.fill();


}







// =============================
// MAIN DRAW
// =============================


function draw(){



    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );



    drawMap();



    drawFlag(blueFlag);

    drawFlag(redFlag);



    players.forEach(p=>p.draw());



    drawBullets();





    document.getElementById(
        "blueScore"
    ).textContent=
        game.blueScore;



    document.getElementById(
        "redScore"
    ).textContent=
        game.redScore;





    if(game.blueScore>=3 ||
       game.redScore>=3){



        const msg =
        document.getElementById("message");


        msg.style.display="block";


        msg.textContent =
        game.blueScore>=3
        ?
        "🔵 BLUE WINS!"
        :
        "🔴 RED WINS!";



        game.over=true;


    }



}







// =============================
// GAME LOOP
// =============================


function loop(){



    if(game.over)
        return;



    players.forEach(
        p=>p.update()
    );



    handlePlayerShoot();



    updateBullets();



    updateFlags();



    draw();



    requestAnimationFrame(loop);


}



loop();
