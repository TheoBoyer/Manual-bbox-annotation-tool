const POINT_SIZE = 5;

let points;
function drawBbox() {
    ctx.clearRect(0, 0, screen.width, screen.height);

    ctx.strokeStyle = '#ffff0a';
    ctx.lineWidth = 3;
    let r_x = Math.max(Math.min(points[0].x, points[1].x) - 1, 0);
    let r_y = Math.max(Math.min(points[0].y, points[1].y) - 1, 0);
    let r_w = Math.min(Math.abs(points[0].x - points[1].x) + 1, screen.width);
    let r_h = Math.min(Math.abs(points[0].y - points[1].y) + 1, screen.height);
    ctx.strokeRect(r_x, r_y, r_w, r_h);
    ctx.stroke();
}

function submitVerification(positive) {
    // Make a request to /image_to_verify
    const request = new XMLHttpRequest();
    request.open('POST', '/submit_verification');
    request.onload = () => {
        loadNextImageToVerify();
    }
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify({
        image: image_name,
        positive: positive
    }));
}

let x1, y1, x2, y2
function loadNextImageToVerify() {
    // Make a request to /image_to_verify
    const request = new XMLHttpRequest();
    request.open('GET', '/image_to_verify');
    request.onload = () => {
        // Extract the image name from the response
        let response = JSON.parse(request.responseText);
        
        if(response.image == null) {
            error_message.style.zIndex = 2;
            document.getElementById("flag_as_wrong_button").style.display="none";
            document.getElementById("validate_button").style.display="none";
            return;
        }

        x1 = response.x1;
        y1 = response.y1;
        x2 = response.x2;
        y2 = response.y2;

        image_name = response.image;
        img_tag.removeAttribute("width");
        img_tag.removeAttribute("height");
        img_tag.src = `/images/${image_name}`;
    }
    request.send();
}

let setup_cbs = true;
function setupScreen() {
    screen.width = img_tag.width;
    screen.height = img_tag.height;

    points = [
        {x: Math.round(x1 * screen.width), y: Math.round(y1 * screen.height)},
        {x: Math.round(x2 * screen.width), y: Math.round(y2 * screen.height)}
    ];

    drawBbox();
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
    img_tag.id = 'image_to_verify';
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

    loadNextImageToVerify();
});