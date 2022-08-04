class Car {

    constructor(x, y, width, height, isControllable, maxspeed = 1.5) 
    {
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.speed = 0;
        this.maxspeed = maxspeed;
        this.acceleration = 0.3;
        this.friction_dec = 0.03;
        this.angle = 0;
        this.crash = false;
        this.isControllable = isControllable;

        this.controls = new Controls(isControllable);

        if(isControllable) {
            this.detector = new Detector(this);
            this.network = new NeuralNetwork([this.detector.ray.count, 6, 4]);
        }
    }

    draw(context, drawSensors=false) {
        // context.save();
        // context.translate(this.x, this.y);
        // context.rotate(-this.angle);

        // context.beginPath();
        // context.rect(-this.width/2,-this.height/2, this.width, this.height);
        // context.fill();
        
        // context.restore();

        context.fillStyle = this.crash ? "orange" : "black";
        if(!this.isControllable) context.fillStyle = "pink";

        // draw the car
        context.beginPath();
        context.moveTo(this.vertices[0].x, this.vertices[0].y);
        for(let i=1; i<this.vertices.length; i++) {
            context.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        context.fill();

        // for only drawing sensors on the best car
        if(this.isControllable && drawSensors) {
            this.detector.drawSensors(context);
        }
    }

    update(roadBorders, otherCars) {
        if(!this.crash) {
            this.move();
            this.vertices = this.#createCarVertices()
            this.crash = this.#hasCrashed(roadBorders, otherCars);
        }

        if(this.isControllable) {
            this.detector.updateSensors(roadBorders, otherCars);
            // passess the inputs based on how close the obstacles are to the car
            const offsets = this.detector.intersectionPoints.map(
                el => el==null ? 0 : 1-el.offset
            );
            const outputs = NeuralNetwork.feedForward(offsets, this.network);
            // console.log(outputs);

            this.controls.forward = outputs[0];
            this.controls.left = outputs[1];
            this.controls.right = outputs[2];
            this.controls.backward = outputs[3];
        }
    }

    #hasCrashed(roadBorders, otherCars) {
        
        for(let i=0; i<roadBorders.length; i++) {
            if(doesIntersect(roadBorders[i], this.vertices)) {
                return true;
            }
        }
        for(let i=0; i<otherCars.length; i++) {
            if(doesIntersect(otherCars[i].vertices, this.vertices)) {
                return true;
            }
        }
        return false;
    }

    #createCarVertices() {
        const vertices = [];
        let squareRad = Math.hypot(this.width, this.height)/2;
        let angle = Math.atan2(this.width, this.height);
        vertices.push({
            x: this.x - Math.sin(this.angle-angle)*squareRad, 
            y: this.y - Math.cos(this.angle-angle)*squareRad
        });
        vertices.push({
            x: this.x - Math.sin(this.angle+angle)*squareRad, 
            y: this.y - Math.cos(this.angle+angle)*squareRad
        });
        vertices.push({
            x: this.x - Math.sin(Math.PI+this.angle-angle)*squareRad, 
            y: this.y - Math.cos(Math.PI+this.angle-angle)*squareRad
        });
        vertices.push({
            x: this.x - Math.sin(Math.PI+this.angle+angle)*squareRad, 
            y: this.y - Math.cos(Math.PI+this.angle+angle)*squareRad
        });
        return vertices;
    }

    move() {
        if(this.controls.forward) 
            this.speed += this.acceleration;
        else if(this.controls.backward)
            this.speed -= this.acceleration;
        if(this.controls.left)
            this.angle += 0.01;
        else if(this.controls.right)
            this.angle -= 0.01;
    

        if(Math.abs(this.speed)>=this.maxspeed) {
            this.speed = this.speed>0 ? this.maxspeed : -this.maxspeed;
        }
        
        if(Math.abs(this.speed)<this.friction_dec) {
            this.speed = 0;
        }
        else {
            this.speed += this.speed>0 ? -this.friction_dec : this.friction_dec;
        }

        this.x -= Math.sin(this.angle)*this.speed;
        this.y -= Math.cos(this.angle)*this.speed;
    }
}

class Controls {
    constructor(isControllable) {
        this.forward = false;
        this.backward = false;
        this.right = false;
        this.left = false;
        this.isControllable = isControllable;

        if(!isControllable) {
            this.forward = true;
        }
        else {
            document.onkeydown = (e) => {
                switch(e.key)
                {
                    case "ArrowUp":
                        this.forward = true;
                        break;
                    case "ArrowRight":
                        this.right = true;
                        break;;
                    case "ArrowDown":
                        this.backward = true;
                        break;
                    case "ArrowLeft":
                        this.left = true;
                        break;
                }
            }

            document.onkeyup = (e) => {
                switch(e.key)
                {
                    case "ArrowUp":
                        this.forward = false;
                        break;
                    case "ArrowRight":
                        this.right = false;
                        break;;
                    case "ArrowDown":
                        this.backward = false;
                        break;
                    case "ArrowLeft":
                        this.left = false;
                        break;
                }
            }
        }
    }

}