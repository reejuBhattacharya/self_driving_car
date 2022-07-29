const carCanvas = document.getElementById("canvas-car");
carCanvas.height = window.innerHeight;
const carCtx = carCanvas.getContext("2d");

const visualizerCanvas = document.getElementById("canvas-visualizer");
const visualizerCtx = visualizerCanvas.getContext("2d");

const mainCar = new Car(getLaneCoord(2), 600, 30, 50, true, 1.5);
const roadBorders = [
    [{x:0, y:-100000}, {x:0, y:100000}],
    [{x:carCanvas.width, y:-100000}, {x:carCanvas.width, y:100000}]
];
const otherCars = [
    new Car(getLaneCoord(2), 100, 30, 50, false)
]

const animation = () => {
    for(let i=0; i<otherCars.length; i++) {
        otherCars[i].update(roadBorders, []);
    }
    mainCar.update(roadBorders, otherCars);
    carCanvas.height = carCanvas.height; // to clear the canvas
    visualizerCanvas.height = window.innerHeight;
    carCtx.save();
    carCtx.translate(0, -mainCar.y+carCanvas.height*0.8);
    drawRoad();
    mainCar.draw(carCtx);
    for(let i=0; i<otherCars.length; i++) {
        otherCars[i].draw(carCtx);
    }
    carCtx.restore();
    Visualizer.drawNetwork(visualizerCtx, mainCar.network)
    requestAnimationFrame(animation);
}

animation();

function drawRoad() {
    const start = 0;
    const end = carCanvas.width;
    const top = -100000;
    const bottom = 100000;

    carCtx.lineWidth = 7;
    carCtx.strokeStyle = "white";

    // left boundary
    carCtx.beginPath();
    carCtx.moveTo(start,top);
    carCtx.lineTo(start,bottom);
    carCtx.stroke();

    // right boundary
    carCtx.beginPath();
    carCtx.moveTo(end,top);
    carCtx.lineTo(end,bottom);
    carCtx.stroke();
    carCtx.stroke();

    //draw lanes
    const lanes = 3;
    carCtx.lineWidth = 3;
    for(let i=1; i<lanes; i++)
    {
        let xcord = lerp(0,carCanvas.width,i/lanes);
        carCtx.setLineDash([15, 15]);/*dashes are 5px and spaces are 3px*/
        carCtx.beginPath();
        carCtx.moveTo(xcord,top);
        carCtx.lineTo(xcord,bottom);
        carCtx.stroke();
    }

}

function getLaneCoord(laneNumber) {
    laneWidth = carCanvas.width/3;
    return (laneNumber-1)*laneWidth + laneWidth/2;
}