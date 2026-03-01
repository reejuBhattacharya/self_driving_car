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
let otherCars = [];

function generateTraffic() {
    const traffic = [];
    for(let i=0; i<10; i++){
        const y = 100 - i*200;
        const lane = Math.floor(Math.random()*3)+1;
        traffic.push(new Car(getLaneCoord(lane), y, 39, 65, false));
        if(Math.random() < 0.5){
            let lane2 = Math.floor(Math.random()*3)+1;
            while(lane2 === lane){
                lane2 = Math.floor(Math.random()*3)+1;
            }
            traffic.push(new Car(getLaneCoord(lane2), y, 39, 65, false));
        }
    }
    return traffic;
}

otherCars = generateTraffic();

const cars = [];
const no_of_maincars = 1; // no of cars for training. Keep 1 when done testing

// Training controls state
let paused = false;
let speedMultiplier = 1;
let mutationRate = 0.2;
let generationCount = 1;
let hardMode = false;
let showCollision = true;

// generate ai controlled cars according to the number specified.
const generateMainCars = () => {
    for(let i=0; i<no_of_maincars; i++) 
        cars.push(new Car(getLaneCoord(2), 600, 39, 65, true, 3.5))
}

// takes the best car stored, and slightly mutates all but one of them 
generateMainCars();
let most_fit_car = cars[0];
if(localStorage.getItem("fitCar")) {
    for(let i=0; i<cars.length; i++) {
        cars[i].network=JSON.parse(
            localStorage.getItem("fitCar"));
        if(i!=0){
            NeuralNetwork.mutate(cars[i].network, mutationRate);
        }
    }
}

function animation () {
    if (paused) {
        return;
    }

    for (let step = 0; step < speedMultiplier; step++) {
        otherCars.forEach(car => car.update(roadBorders, [], hardMode));
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
    }

    if(document.getElementById("dash-alive")) {
        const aliveCount = cars.filter(c => !c.crash).length;
        document.getElementById("dash-alive").innerText = aliveCount + " / " + cars.length;
        document.getElementById("dash-dist").innerText = Math.floor(600 - most_fit_car.y);
        document.getElementById("dash-speed").innerText = most_fit_car.speed.toFixed(2);
    }

    carCanvas.height = carCanvas.height; // to clear the canvas
    visualizerCanvas.height = window.innerHeight; // to clear the canvas

    carCtx.save();
    carCtx.translate(0, -most_fit_car.y+carCanvas.height*0.8);
    drawRoad();

    carCtx.globalAlpha = 0.3; // this makes all the training cars with lower alpha
    cars.forEach((car) => car.draw(carCtx, false, showCollision));
    carCtx.globalAlpha = 1; // reset alpha for other parameters
    most_fit_car.draw(carCtx, true, showCollision); 

    otherCars.forEach(car => car.draw(carCtx, false, showCollision));
    
    // Remove cars that are offscreen
    otherCars = otherCars.filter(car => car.y < most_fit_car.y + 1000);

    // Continuously Generate Traffic
    if (otherCars.length < 20) {
        if (Math.random() < 0.03) { // Adjust probability as needed
            const lane = Math.floor(Math.random() * 3) + 1;
            const spawnY = most_fit_car.y - 1000;
            
            let safeToSpawn = true;
            for(let i=0; i<otherCars.length; i++){
                if(Math.abs(otherCars[i].y - spawnY) < 200){
                    safeToSpawn = false;
                    break;
                }
            }

            if(safeToSpawn){
                otherCars.push(new Car(getLaneCoord(lane), spawnY, 39, 65, false));
                if(Math.random() < 0.5){
                    let lane2 = Math.floor(Math.random()*3)+1;
                    while(lane2 === lane) lane2 = Math.floor(Math.random()*3)+1;
                    otherCars.push(new Car(getLaneCoord(lane2), spawnY, 39, 65, false));
                }
            }
        }
    }
    carCtx.restore();

    Visualizer.drawNetwork(visualizerCtx, most_fit_car.network);
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
    const laneWidth = carCanvas.width/3;
    return (laneNumber-1)*laneWidth + laneWidth/2;
}

function save() {
    localStorage.setItem("fitCar", JSON.stringify(most_fit_car.network));
}

function remove() {
    localStorage.removeItem("fitCar");
}

function togglePause() {
    paused = !paused;
    const btn = document.getElementById("pause-resume");
    if (paused) {
        btn.textContent = "Resume";
        btn.classList.remove("running");
        btn.classList.add("paused");
    } else {
        btn.textContent = "Pause";
        btn.classList.remove("paused");
        btn.classList.add("running");
        requestAnimationFrame(animation);
    }
}

function setSpeed(multiplier) {
    speedMultiplier = multiplier;
    document.querySelectorAll(".speed-btn").forEach(btn => {
        btn.classList.toggle("active", parseInt(btn.dataset.speed, 10) === multiplier);
    });
}

function setMutationRate(value) {
    mutationRate = parseFloat(value);
    document.getElementById("mutation-value").textContent = value;
}

function toggleHardMode() {
    hardMode = !hardMode;
    const btn = document.getElementById("hard-mode-btn");
    btn.innerText = hardMode ? "Hard Mode: ON" : "Hard Mode: OFF";
    btn.style.backgroundColor = hardMode ? "rgb(251, 80, 58)" : "rgb(100, 149, 237)";
}

function toggleCollision() {
    showCollision = !showCollision;
    const btn = document.getElementById("collision-btn");
    btn.innerText = showCollision ? "Collision: ON" : "Collision: OFF";
    btn.style.backgroundColor = showCollision ? "rgb(100, 149, 237)" : "gray";
}

function resetGeneration() {
    generationCount++;
    if(document.getElementById("dash-gen")) {
        document.getElementById("dash-gen").innerText = generationCount;
    }
    // Find best car (lowest y = furthest along)
    let miny = cars[0].y;
    cars.forEach(car => miny = Math.min(miny, car.y));
    let best = cars[0];
    for (let i = 0; i < cars.length; i++) {
        if (cars[i].y === miny) {
            best = cars[i];
            break;
        }
    }
    const bestNetwork = JSON.parse(JSON.stringify(best.network));
    const laneCenter = getLaneCoord(2);
    for (let i = 0; i < cars.length; i++) {
        cars[i].network = JSON.parse(JSON.stringify(bestNetwork));
        if (i !== 0) {
            NeuralNetwork.mutate(cars[i].network, mutationRate);
        }
        cars[i].x = laneCenter;
        cars[i].y = 600;
        cars[i].speed = 0;
        cars[i].angle = 0;
        cars[i].crash = false;
    }
    most_fit_car = cars[0];

    otherCars = generateTraffic();
}