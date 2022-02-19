const POINT_SIZE = 5;

let points, x, y;
function drawBbox() {
    ctx.clearRect(0, 0, screen.width, screen.height);

    ctx.fillStyle = '#ffff0a';
    for(let p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, POINT_SIZE, 0, 2 * Math.PI);
        ctx.fill();
    }

    //console.log(points)
    if(points.length >= 1) {
        if(points.length >=2) {
            px = points[1].x;
            py = points[1].y;
        } else {
            px = x;
            py = y;
        }
        ctx.lineWidth = 3;
        let r_x = Math.max(Math.min(points[0].x, px) - 1, 0);
        let r_y = Math.max(Math.min(points[0].y, py) - 1, 0);
        let r_w = Math.min(Math.abs(points[0].x - px) + 1, screen.width);
        let r_h = Math.min(Math.abs(points[0].y - py) + 1, screen.height);
        ctx.strokeRect(r_x, r_y, r_w, r_h);
    }
    
    if(points.length < 2) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ffff0a';

        ctx.beginPath();
        ctx.moveTo(x,0);
        ctx.lineTo(x, screen.height);
        ctx.moveTo(0,y);
        ctx.lineTo(screen.width, y);
        ctx.stroke();
    }
}

function deleteLastPoint() {
    if(points.length > 0) {
        let p = points.pop();
        drawBbox();
    }
}

function validateBoundingBox() {
    // Make a request to /image_to_annotate
    const request = new XMLHttpRequest();
    request.open('POST', '/submit_annotation');
    request.onload = () => {
        loadNextImageToAnnotate();
    }
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify({
        image: image_name,
        x1: points[0].x / screen.width,
        y1: points[0].y / screen.height,
        x2: points[1].x / screen.width,
        y2: points[1].y / screen.height
    }));
}

function SelectFullImage() {
    points = [
        {x: 0, y: 0},
        {x: screen.width, y: screen.height}
    ];
    drawBbox();
}

let setup_cbs = true;
function setupScreen() {
    screen.width = img_tag.width;
    screen.height = img_tag.height;

    points = [];
    if(setup_cbs) {
        screen.addEventListener("mousemove", (e) => {
            x = Math.max(0, Math.min(e.offsetX, screen.width));
            y = Math.max(0, Math.min(e.offsetY, screen.height));
    
            drawBbox();
        })
    
        image_wrapper.addEventListener("click", (e) => {
            if(points.length >= 2)
                return
    
            points.push({x: x, y: y});
    
            drawBbox();
        })
        setup_cbs = false;
    }
}

function loadNextImageToAnnotate() {
    // Make a request to /image_to_annotate
    const request = new XMLHttpRequest();
    request.open('GET', '/image_to_annotate');
    request.onload = () => {
        // Extract the image name from the response
        image_name = JSON.parse(request.responseText).image;
        if(image_name == null) {
            error_message.style.zIndex = 2;
            document.getElementById("delete_last_point_button").style.display="none";
            document.getElementById("validate_bounding_box_button").style.display="none";
            document.getElementById("select_total_image_button").style.display="none";
            return;
        }
        img_tag.removeAttribute("width");
        img_tag.removeAttribute("height");
        img_tag.src = `/images/${image_name}`;
    }
    request.send();
}

let img_tag, image_wrapper, image_name, d_width, d_height, d_ratio, screen, ctx, error_message;
document.addEventListener('DOMContentLoaded', function() {
    error_message = document.getElementById("error_message");
    image_wrapper = document.getElementById('image_wrapper');
    screen = document.getElementById('screen');
    ctx = screen.getContext('2d');

    // Compute the width and height of image_wrapper
    d_width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    d_height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    d_height = Math.round(0.9 * d_height);
    d_ratio = d_width / d_height;
    image_wrapper.style.width = `${d_width}px`;
    image_wrapper.style.height = `${d_height}px`;
    // Creates an img element and add it to the dom
    img_tag = document.createElement('img');
    img_tag.id = 'image_to_annotate';
    img_tag.addEventListener('load', () => {
        let ratio = img_tag.width / img_tag.height;
        if (ratio > d_ratio) {
            img_tag.width = d_width;
            img_tag.height = img_tag.width / ratio;
        } else {
            img_tag.height = d_height;
            img_tag.width = img_tag.height * ratio;
        }
        setupScreen();
    });
    image_wrapper.appendChild(img_tag);

    loadNextImageToAnnotate();
});