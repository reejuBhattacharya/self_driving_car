function lerp(a, b, x) {
    return a + (b-a)*x;
}

// gets the intersection points between two lines, and also the distance of intersection 
// from line beginning 
function getIntersection(a, b, c, d) {
    const tNumer=(d.x-c.x)*(a.y-c.y)-(d.y-c.y)*(a.x-c.x);
    const uNumer=(c.y-a.y)*(a.x-b.x)-(c.x-a.x)*(a.y-b.y);
    const Denom=(d.y-c.y)*(b.x-a.x)-(d.x-c.x)*(b.y-a.y);
    
    if(Denom!=0) {
        const t=tNumer/Denom;
        const u=uNumer/Denom;
        if(t>=0 && t<=1 && u>=0 && u<=1) {
            return {
                x:lerp(a.x,b.x,t),
                y:lerp(a.y,b.y,t),
                offset:t
            }
        }
    }
    return null;
}

function doesIntersect(shape1, shape2) {
    for(let i=0; i<shape1.length; i++) {
        for(let j=0; j<shape2.length; j++) {
            const intersection = getIntersection(shape1[i], shape1[(i+1)%shape1.length],
                shape2[j], shape2[(j+1)%shape2.length]);
            if(intersection!=null)
                return true;
        }
    }
    return false;
}

function getRGBA(value){
    const alpha=Math.abs(value);
    const R=value<0?0:255;
    const G=R;
    const B=value>0?0:255;
    return "rgba("+R+","+G+","+B+","+alpha+")";
}