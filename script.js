const carCanvas = document.getElementById("canvas-car");
carCanvas.height = window.innerHeight;
const carCtx = carCanvas.getContext("2d");

const visualizerCanvas = document.getElementById("canvas-visualizer");
const visualizerCtx = visualizerCanvas.getContext("2d");

const roadBorders = [
    [{x:0, y:-100000}, {x:0, y:100000}],
    [{x:carCanvas.width, y:-100000}, {x:carCanvas.width, y:100000}]
];
const otherCars = [
    new Car(getLaneCoord(2), 120, 30, 50, false),
    new Car(getLaneCoord(1), 0, 30, 50, false),
    new Car(getLaneCoord(3), 0, 30, 50, false),
    new Car(getLaneCoord(2), -170, 30, 50, false),
    new Car(getLaneCoord(3), -170, 30, 50, false)
]

const cars = [];
const no_of_maincars = 1;

const generateMainCars = () => {
    for(let i=0; i<no_of_maincars; i++) 
        cars.push(new Car(getLaneCoord(2), 600, 30, 50, true, 3.5))
}

generateMainCars();
let most_fit_car = cars[0];
if(localStorage.getItem("fitCar")) {
    for(let i=0; i<cars.length; i++) {
        cars[i].network=JSON.parse(
            localStorage.getItem("fitCar"));
        if(i!=0){
            NeuralNetwork.mutate(cars[i].network,0.2);
        }
    }
}

function animation (time) {
    for(let i=0; i<otherCars.length; i++) {
        otherCars[i].update(roadBorders, []);
    }
    cars.forEach((car) => car.update(roadBorders, otherCars));

    // find the most fit car
    let miny = cars[0].y;
    cars.forEach(car => miny = Math.min(miny, car.y));
    for(let i=0; i<cars.length; i++) {
        if(cars[i].y==miny) {
            most_fit_car = cars[i];
            break;
        }
    }

    carCanvas.height = carCanvas.height; // to clear the canvas
    visualizerCanvas.height = window.innerHeight;

    carCtx.save();
    carCtx.translate(0, -most_fit_car.y+carCanvas.height*0.8);
    drawRoad();
    carCtx.globalAlpha = 0.3;
    cars.forEach((car) => car.draw(carCtx))
    carCtx.globalAlpha = 1;
    most_fit_car.draw(carCtx, true);
    for(let i=0; i<otherCars.length; i++) {
        otherCars[i].draw(carCtx);
    }
    carCtx.restore();
    Visualizer.drawNetwork(visualizerCtx, most_fit_car.network)
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

const button = document.getElementById("save");

function save() {
    localStorage.setItem("fitCar", JSON.stringify(most_fit_car.network));
}

function remove() {
    localStorage.removeItem("fitCar");
}