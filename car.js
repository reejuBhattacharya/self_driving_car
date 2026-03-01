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
        } else {
            // Add properties for lane changing behavior
            this.isChangingLane = false;
            this.targetX = null;
            // Start with a random cooldown before the first potential lane change
            this.laneChangeTimer = Math.floor(Math.random() * 200 + 100); 
        }

        this.img = new Image();
        this.img.src = isControllable ? "maincar.png" : "trafficcar.png";
    }

    draw(context, drawSensors=false, drawCollision=false) {
        // context.save();
        // context.translate(this.x, this.y);
        // context.rotate(-this.angle);

        // context.beginPath();
        // context.rect(-this.width/2,-this.height/2, this.width, this.height);
        // context.fill();
        
        // context.restore();

        if(this.img.complete) {
            context.save();
            context.translate(this.x, this.y);
            context.rotate(-this.angle);
            context.drawImage(this.img, -this.width/2, -this.height/2, this.width, this.height);
            context.restore();
        } else {
            context.fillStyle = this.crash ? "orange" : "black";
            if(!this.isControllable) context.fillStyle = "pink";

            // draw the car
            context.beginPath();
            context.moveTo(this.vertices[0].x, this.vertices[0].y);
            for(let i=1; i<this.vertices.length; i++) {
                context.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
            context.fill();
        }

        // Draw collision box outline
        if(drawCollision) {
            context.beginPath();
            context.lineWidth = 2;
            context.strokeStyle = "purple";
            context.moveTo(this.vertices[0].x, this.vertices[0].y);
            for(let i=1; i<this.vertices.length; i++) {
                context.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
            context.closePath();
            context.stroke();
        }

        // for only drawing sensors on the best car
        if(this.isControllable && drawSensors) {
            this.detector.drawSensors(context);
        }
    }

    update(roadBorders, otherCars, hardMode = false) {
        if(!this.crash) {
            this.move();
            this.vertices = this.#createCarVertices();
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
        } else {
            // Add hard mode behavior for traffic cars
            this.#handleTrafficBehavior(roadBorders, hardMode);
        }

            // Uncomment the line below to enable rule-based avoidance
            // this.#avoidObstacles(offsets);
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

    #avoidObstacles(offsets) {
        this.controls.forward = true;
        this.controls.backward = false;
        this.controls.left = false;
        this.controls.right = false;

        // offsets: [Left, MidLeft, Center, MidRight, Right]
        // Values: 0 (far) to 1 (close)

        // If center is blocked (index 2)
        if(offsets[2] > 0.3) {
            // Turn towards the clearer side
            // Sum of left side vs sum of right side. Lower sum means clearer.
            if(offsets[0] + offsets[1] < offsets[3] + offsets[4]) {
                this.controls.left = true;
            } else {
                this.controls.right = true;
            }
        }
        // If left side is blocked
        else if(offsets[1] > 0.3) {
            this.controls.right = true;
        }
        // If right side is blocked
        else if(offsets[3] > 0.3) {
            this.controls.left = true;
        }
    }

    #handleTrafficBehavior(roadBorders, hardMode) {
        this.laneChangeTimer--;
    
        if (hardMode && !this.isChangingLane && this.laneChangeTimer <= 0) {
            // Time to consider a lane change. Low probability to actually start.
            if (Math.random() < 0.10) { 
                const roadWidth = roadBorders[1][0].x - roadBorders[0][0].x;
                const laneWidth = roadWidth / 3;
    
                // Determine current lane (0, 1, or 2)
                const currentLane = Math.min(2, Math.max(0, Math.floor(this.x / laneWidth)));
    
                const possibleLanes = [];
                if (currentLane > 0) possibleLanes.push(currentLane - 1);
                if (currentLane < 2) possibleLanes.push(currentLane + 1);
                
                if (possibleLanes.length > 0) {
                    const targetLane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
                    this.targetX = targetLane * laneWidth + laneWidth / 2;
                    this.isChangingLane = true;
                }
            }
            
            // If we are still not changing lanes, reset the timer for the next check.
            if (!this.isChangingLane) {
                this.laneChangeTimer = Math.floor(Math.random() * 200 + 100);
            }
        }
    
        if (this.isChangingLane) {
            const diff = this.targetX - this.x;
    
            // Steer towards target
            if (diff > 0) {
                this.controls.right = true;
                this.controls.left = false;
            } else {
                this.controls.left = true;
                this.controls.right = false;
            }
    
            // If close enough to target, stop changing lane
            if (Math.abs(diff) < 4) {
                this.isChangingLane = false;
                this.targetX = null;
                // Reset cooldown for next change
                this.laneChangeTimer = Math.floor(Math.random() * 200 + 200); 
            }
        } else {
            // Not changing lanes, so straighten out the car
            if (Math.abs(this.angle) > 0.01) {
                if (this.angle > 0) {
                    this.controls.right = true;
                    this.controls.left = false;
                } else {
                    this.controls.left = true;
                    this.controls.right = false;
                }
            } else {
                this.angle = 0;
                this.controls.left = false;
                this.controls.right = false;
            }
        }
    }

    #createCarVertices() {
        const vertices = [];
        // Adjusted hitbox: Width 10% smaller (0.72), Length 10% bigger (0.88) than previous 0.8
        const width = this.width * 0.70;
        const height = this.height * 0.88;
        let squareRad = Math.hypot(width, height)/2;
        let angle = Math.atan2(width, height);
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
                        break;
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
                        break;
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