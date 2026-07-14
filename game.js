// ===============================
// CAPTURE THE FLAG ARENA
// PART 1 - ENGINE + MAP + PLAYER
// ===============================


const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


canvas.width = 1100;
canvas.height = 700;



// ===============================
// GAME STATE
// ===============================

const game = {

    blueScore:0,
    redScore:0,

    particles:[],

    running:true

};



// ===============================
// INPUT
// ===============================

const keys = {};

const mouse = {

    x:550,
    y:350,
    down:false

};



document.addEventListener("keydown", e=>{

    keys[e.key.toLowerCase()] = true;

    if(["w","a","s","d"," "].includes(e.key.toLowerCase()))
        e.preventDefault();

});


document.addEventListener("keyup",e=>{

    keys[e.key.toLowerCase()] = false;

});



canvas.addEventListener("mousemove",e=>{

    const rect = canvas.getBoundingClientRect();

    mouse.x =
        (e.clientX - rect.left)
        *
        (canvas.width / rect.width);


    mouse.y =
        (e.clientY - rect.top)
        *
        (canvas.height / rect.height);


    const cross =
        document.getElementById("crosshair");

    cross.style.left =
        e.clientX + "px";

    cross.style.top =
        e.clientY + "px";

});



canvas.addEventListener("mousedown",()=>{

    mouse.down=true;

});


canvas.addEventListener("mouseup",()=>{

    mouse.down=false;

});





// ===============================
// MAP
// ===============================


const walls=[


    {
        x:520,
        y:0,
        w:60,
        h:210
    },


    {
        x:520,
        y:490,
        w:60,
        h:210
    },


    {
        x:310,
        y:270,
        w:160,
        h:55
    },


    {
        x:630,
        y:375,
        w:160,
        h:55
    }


];



const blueBase={

    x:30,
    y:270,
    w:130,
    h:160

};



const redBase={

    x:940,
    y:270,
    w:130,
    h:160

};






// ===============================
// UTILITIES
// ===============================


function distance(a,b){

    return Math.hypot(
        a.x-b.x,
        a.y-b.y
    );

}



function clamp(value,min,max){

    return Math.max(
        min,
        Math.min(max,value)
    );

}




function hitWall(x,y,size){


    for(let w of walls){


        if(

            x+size>w.x &&
            x-size<w.x+w.w &&
            y+size>w.y &&
            y-size<w.y+w.h

        ){

            return true;

        }

    }


    return false;

}






// ===============================
// PLAYER CLASS
// ===============================


class Character{


constructor(x,y,team,isPlayer=false){


    this.x=x;
    this.y=y;


    this.team=team;

    this.isPlayer=isPlayer;


    this.radius=24;


    this.speed =
        isPlayer ? 5 : 2.2;



    this.health=100;


    this.maxHealth=100;


    this.cooldown=0;


    this.angle=0;


    this.alive=true;



    this.name =
        isPlayer ?
        "YOU" :
        team==="blue" ?
        "BLUE BOT" :
        "RED BOT";


}



move(dx,dy){


    let length =
        Math.hypot(dx,dy)||1;


    dx/=length;
    dy/=length;



    let nx =
        this.x + dx*this.speed;


    let ny =
        this.y + dy*this.speed;



    if(!hitWall(nx,ny,this.radius)){


        this.x =
        clamp(
            nx,
            this.radius,
            canvas.width-this.radius
        );


        this.y =
        clamp(
            ny,
            this.radius,
            canvas.height-this.radius
        );

    }


}



update(){


    if(this.cooldown>0)
        this.cooldown--;



    if(this.isPlayer){


        let dx=0;
        let dy=0;



        if(keys.w) dy--;
        if(keys.s) dy++;
        if(keys.a) dx--;
        if(keys.d) dx++;



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
        this.y+18,
        25,
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
        "#008cff"
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



    // player outline

    if(this.isPlayer){

        ctx.strokeStyle="white";

        ctx.lineWidth=3;

        ctx.stroke();

    }



    // health bar

    ctx.fillStyle="black";

    ctx.fillRect(
        this.x-25,
        this.y-38,
        50,
        7
    );


    ctx.fillStyle="#35ff55";

    ctx.fillRect(
        this.x-25,
        this.y-38,
        50*(this.health/this.maxHealth),
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



// ===============================
// CREATE PLAYER
// ===============================


const player = new Character(
    220,
    350,
    "blue",
    true
);


const characters=[player];
// ===============================
// PART 2 - COMBAT + NPC AI
// ===============================



const bullets=[];



// ===============================
// PARTICLES
// ===============================


class Particle{


constructor(x,y,color){


    this.x=x;
    this.y=y;

    this.size=
        Math.random()*5+2;


    this.color=color;


    this.life=30;


    this.dx=
        (Math.random()-0.5)*6;


    this.dy=
        (Math.random()-0.5)*6;


}



update(){

    this.x+=this.dx;
    this.y+=this.dy;

    this.life--;

}



draw(){

    ctx.globalAlpha=
        this.life/30;


    ctx.fillStyle=this.color;


    ctx.fillRect(
        this.x,
        this.y,
        this.size,
        this.size
    );


    ctx.globalAlpha=1;

}


}






// ===============================
// SHOOTING
// ===============================


function shoot(unit,target){


    if(unit.cooldown>0)
        return;



    let angle=Math.atan2(
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



    // muzzle flash

    for(let i=0;i<6;i++){

        game.particles.push(

            new Particle(
                unit.x+
                Math.cos(angle)*25,

                unit.y+
                Math.sin(angle)*25,

                "#ffff00"
            )

        );

    }


}






canvas.addEventListener("mousedown",()=>{


    mouse.down=true;


});






// ===============================
// NPC AI
// ===============================


class Bot extends Character{


constructor(x,y,team){


    super(x,y,team,false);


    this.speed=2.1;


    this.target=null;


}



update(){


    super.update();



    let enemies =
        characters.filter(
            c=>c.team!==this.team
        );



    let closest=null;
    let shortest=9999;



    for(let e of enemies){


        let d=
            distance(this,e);


        if(d<shortest){

            shortest=d;
            closest=e;

        }

    }



    this.target=closest;



    if(this.target){


        let d=
            distance(
                this,
                this.target
            );



        if(d<350){

            shoot(
                this,
                this.target
            );

        }



        if(d>130){

            this.move(

                this.target.x-this.x,

                this.target.y-this.y

            );

        }


    }



    this.angle =
        this.target ?
        Math.atan2(
            this.target.y-this.y,
            this.target.x-this.x
        )
        :
        0;



}



}






// ===============================
// CREATE TEAMS
// ===============================


function createBots(){



    for(let i=0;i<4;i++){



        characters.push(

            new Bot(

                260,

                130+i*100,

                "blue"

            )

        );



        characters.push(

            new Bot(

                840,

                130+i*100,

                "red"

            )

        );


    }


}



createBots();






// ===============================
// BULLET UPDATE
// ===============================


function updateBullets(){



    for(
        let i=bullets.length-1;
        i>=0;
        i--
    ){



        let b=bullets[i];


        b.x+=b.dx;

        b.y+=b.dy;




        if(
            b.x<0 ||
            b.x>canvas.width ||
            b.y<0 ||
            b.y>canvas.height
        ){

            bullets.splice(i,1);

            continue;

        }





        for(let c of characters){



            if(
                c.team!==b.team &&
                distance(b,c)<c.radius
            ){



                c.health-=b.damage;



                for(let p=0;p<10;p++){

                    game.particles.push(

                        new Particle(
                            c.x,
                            c.y,
                            "#ff4444"
                        )

                    );

                }



                bullets.splice(i,1);




                if(c.health<=0){


                    c.health=100;



                    if(c.team==="blue"){

                        c.x=220;
                        c.y=350;

                    }
                    else{

                        c.x=880;
                        c.y=350;

                    }


                }



                break;

            }


        }



    }



}






// ===============================
// UPDATE PARTICLES
// ===============================


function updateParticles(){


    for(
        let i=game.particles.length-1;
        i>=0;
        i--
    ){


        let p=
            game.particles[i];


        p.update();



        if(p.life<=0){

            game.particles.splice(i,1);

        }


    }



}





// ===============================
// DRAW COMBAT
// ===============================


function drawCombat(){



    bullets.forEach(b=>{


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



    });



    game.particles.forEach(
        p=>p.draw()
    );



}
// ===============================
// PART 3 - FLAGS + MAP + GAME LOOP
// ===============================


// ===============================
// FLAGS
// ===============================


const blueFlag = {

    x:100,
    y:350,

    homeX:100,
    homeY:350,

    team:"blue",

    carrier:null

};


const redFlag = {

    x:1000,
    y:350,

    homeX:1000,
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



    for(let c of characters){



        let enemyFlag =
            c.team==="blue"
            ?
            redFlag
            :
            blueFlag;



        let ownBase =
            c.team==="blue"
            ?
            blueBase
            :
            redBase;




        // pick up flag

        if(
            !c.carrying &&
            distance(c,enemyFlag)<35
        ){


            c.carrying=enemyFlag;

            enemyFlag.carrier=c;


        }





        // move flag with carrier

        if(c.carrying){


            c.carrying.x=c.x;

            c.carrying.y=c.y;


        }





        // capture


        if(
            c.carrying &&
            c.team==="blue" &&
            insideBase(c,blueBase)
        ){


            game.blueScore++;


            resetFlag(c.carrying);


            c.carrying=null;


        }




        if(
            c.carrying &&
            c.team==="red" &&
            insideBase(c,redBase)
        ){


            game.redScore++;


            resetFlag(c.carrying);


            c.carrying=null;


        }


    }


}







function insideBase(unit,base){


    return(

        unit.x>base.x &&
        unit.x<base.x+base.w &&
        unit.y>base.y &&
        unit.y<base.y+base.h

    );


}







// ===============================
// MAP DRAWING
// ===============================


function drawMap(){



    // grass

    ctx.fillStyle="#143d18";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );





    // grid decoration

    ctx.strokeStyle=
        "rgba(255,255,255,.04)";


    for(let x=0;x<canvas.width;x+=50){

        ctx.beginPath();

        ctx.moveTo(x,0);

        ctx.lineTo(
            x,
            canvas.height
        );

        ctx.stroke();

    }



    for(let y=0;y<canvas.height;y+=50){

        ctx.beginPath();

        ctx.moveTo(0,y);

        ctx.lineTo(
            canvas.width,
            y
        );

        ctx.stroke();

    }





    // bases


    ctx.fillStyle=
        "rgba(0,130,255,.35)";


    ctx.fillRect(
        blueBase.x,
        blueBase.y,
        blueBase.w,
        blueBase.h
    );



    ctx.fillStyle=
        "rgba(255,30,30,.35)";


    ctx.fillRect(
        redBase.x,
        redBase.y,
        redBase.w,
        redBase.h
    );





    // walls


    for(let w of walls){


        ctx.fillStyle="#343434";


        ctx.fillRect(
            w.x,
            w.y,
            w.w,
            w.h
        );


        ctx.strokeStyle="#777";

        ctx.strokeRect(
            w.x,
            w.y,
            w.w,
            w.h
        );


    }



}





function drawFlag(flag){



    ctx.strokeStyle=
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





    ctx.fillStyle=
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







// ===============================
// PLAYER SHOOTING
// ===============================


function playerShoot(){


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







// ===============================
// MAIN DRAW
// ===============================


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



    characters.forEach(
        c=>c.draw()
    );



    drawCombat();





    document.getElementById(
        "blueScore"
    ).innerText=
        game.blueScore;



    document.getElementById(
        "redScore"
    ).innerText=
        game.redScore;



}








// ===============================
// MAIN LOOP
// ===============================


function gameLoop(){



    if(!game.running)
        return;



    characters.forEach(
        c=>c.update()
    );



    playerShoot();



    updateBullets();



    updateParticles();



    updateFlags();



    draw();



    requestAnimationFrame(
        gameLoop
    );


}





gameLoop();
