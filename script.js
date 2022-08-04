// declare canvas variables
const carCanvas = document.getElementById("canvas-car");
carCanvas.height = window.innerHeight;
const carCtx = carCanvas.getContext("2d");
const visualizerCanvas = document.getElementById("canvas-visualizer");
const visualizerCtx = visualizerCanvas.getContext("2d");

const roadBorders = [
    [{x:0, y:-100000}, {x:0, y:100000}],
    [{x:carCanvas.width, y:-100000}, {x:carCanvas.width, y:100000}]
];

// add all secondary cars here
const otherCars = [
    new Car(getLaneCoord(2), 120, 30, 50, false),
    new Car(getLaneCoord(1), 0, 30, 50, false),
    new Car(getLaneCoord(3), 0, 30, 50, false),
    new Car(getLaneCoord(2), -170, 30, 50, false),
    new Car(getLaneCoord(3), -170, 30, 50, false),
    new Car(getLaneCoord(1), -400, 30, 50, false),
    new Car(getLaneCoord(2), -500, 30, 50, false),
    new Car(getLaneCoord(3), -600, 30, 50, false),
]

const cars = [];
const no_of_maincars = 1; // no of cars for training. Keep 1 when done testing

// generate ai controlled cars according to the number specified.
const generateMainCars = () => {
    for(let i=0; i<no_of_maincars; i++) 
        cars.push(new Car(getLaneCoord(2), 600, 30, 50, true, 3.5))
}

// takes the best car stored, and slightly mutates all but one of them 
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

function animation () {

    otherCars.forEach(car => car.update(roadBorders, []));
    cars.forEach(car => car.update(roadBorders, otherCars));

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
    visualizerCanvas.height = window.innerHeight; // to clear the canvas

    carCtx.save();
    carCtx.translate(0, -most_fit_car.y+carCanvas.height*0.8);
    drawRoad();

    carCtx.globalAlpha = 0.3; // this makes all the training cars with lower alpha
    cars.forEach((car) => car.draw(carCtx))
    carCtx.globalAlpha = 1; // reset alpha for other parameters
    most_fit_car.draw(carCtx, true); 

    otherCars.forEach(car => car.draw(carCtx));

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

function save() {
    localStorage.setItem("fitCar", JSON.stringify(most_fit_car.network));
}

function remove() {
    localStorage.removeItem("fitCar");
}