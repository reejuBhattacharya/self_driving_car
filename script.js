const canvas = document.getElementById("canvas-car");
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

const mainCar = new Car(getLaneCoord(2), 600, 30, 50, true, 4.5);
const roadBorders = [
    [{x:0, y:-100000}, {x:0, y:100000}],
    [{x:canvas.width, y:-100000}, {x:canvas.width, y:100000}]
];
const otherCars = [
    new Car(getLaneCoord(2), 100, 30, 50, false)
]

const animation = () => {
    for(let i=0; i<otherCars.length; i++) {
        otherCars[i].update(roadBorders, []);
    }
    mainCar.update(roadBorders, otherCars);
    canvas.height = canvas.height; // to clear the canvas
    ctx.save();
    ctx.translate(0, -mainCar.y+canvas.height*0.8);
    drawRoad();
    mainCar.draw(ctx);
    for(let i=0; i<otherCars.length; i++) {
        otherCars[i].draw(ctx);
    }
    ctx.restore();
    requestAnimationFrame(animation);
}

animation();

function drawRoad() {
    const start = 0;
    const end = canvas.width;
    const top = -100000;
    const bottom = 100000;

    ctx.lineWidth = 7;
    ctx.strokeStyle = "white";

    // left boundary
    ctx.beginPath();
    ctx.moveTo(start,top);
    ctx.lineTo(start,bottom);
    ctx.stroke();

    // right boundary
    ctx.beginPath();
    ctx.moveTo(end,top);
    ctx.lineTo(end,bottom);
    ctx.stroke();
    ctx.stroke();

    //draw lanes
    const lanes = 3;
    ctx.lineWidth = 3;
    for(let i=1; i<lanes; i++)
    {
        let xcord = lerp(0,canvas.width,i/lanes);
        ctx.setLineDash([15, 15]);/*dashes are 5px and spaces are 3px*/
        ctx.beginPath();
        ctx.moveTo(xcord,top);
        ctx.lineTo(xcord,bottom);
        ctx.stroke();
    }

}

function getLaneCoord(laneNumber) {
    laneWidth = canvas.width/3;
    return (laneNumber-1)*laneWidth + laneWidth/2;
}