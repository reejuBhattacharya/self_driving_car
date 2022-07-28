class Detector {
    constructor(car) {
        this.car = car;
        this.ray = {
            count: 5,
            spread: Math.PI/2,
            length: 120
        };
        this.rays = [];
        this.intersectionPoints = [];
    }

    updateSensors(roadBorders, otherCars) {
        this.rays = [];
        for(let i=0; i<this.ray.count; i++) {
            const angle = lerp(this.ray.spread/2, -this.ray.spread/2, i/(this.ray.count-1))+this.car.angle;
            const start = {x: this.car.x, y: this.car.y};
            const end = {x: this.car.x-Math.sin(angle)*this.ray.length,
                        y: this.car.y-Math.cos(angle)*this.ray.length};
            this.rays.push([start, end]);
        }

        // get intersection points with ray and road
        this.rays.forEach((ray) => {
            let result = this.#getRayIntersection(ray, roadBorders, otherCars);
            // console.log(result);
            this.rays.push(result);
        });

    }

    drawSensors(context) {
        for(let i=0; i<this.ray.count; i++) {
            let end = this.rays[i][1];
            if(this.intersectionPoints[i]!=null) {
                end = this.intersectionPoints[i];
            }
            context.beginPath();
            context.strokeStyle = "red";
            context.setLineDash([]);
            context.lineWidth = 1;
            context.moveTo(this.rays[i][0].x, this.rays[i][0].y);
            context.lineTo(end.x, end.y);
            context.stroke();

            // context.beginPath();
            // context.strokeStyle = "black";
            // context.setLineDash([]);
            // context.lineWidth = 1;
            // context.moveTo(end.x, end.y);
            // context.lineTo(this.rays[i][1].x, this.rays[i][1].y);
            // context.stroke();

        }
    }

    #getRayIntersection(ray, roadBorders, otherCars) {
        let points = [];
        roadBorders.forEach((el) => {
            const intersect = getIntersection(
                ray[0],
                ray[1],
                el[0],
                el[1]
            );
            if(intersect) {
                points.push(intersect);
            }
        });
        otherCars.forEach(car => {
            for(let i=0; i<car.vertices.length; i++) {
                const value = getIntersection(
                    ray[0],
                    ray[1],
                    car.vertices[i],
                    car.vertices[(i+1)%car.vertices.length]
                );
                if(value) {
                    points.push(value);
                }
            }
        });
        if(points.length==0) {
            return null;
        }
        else {
            let minOffset = 2;
            points.forEach((el) => {
                minOffset = Math.min(minOffset, el.offset);
            });
            return points.find(el => el.offset == minOffset);
        }

        
    }
}