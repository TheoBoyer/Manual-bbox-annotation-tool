const express = require('express');
const fs = require("fs");
const csv = require('csv')
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

function getStatus() {
    console.log('annotations.csv successfully processed');
    console.log(`${metadata.length} images in total`);
    console.log(`${annotations.length} annotations in total`);
    console.log(`${images_annotated.length} images annotated`);
    console.log(`${images_not_annotated.length} images yet to be annotated`);
}

port=3000;

const annotations = [];
const metadata = [];
let images_annotated = new Set();
let images_not_annotated = new Set();
function readAnnotations(cb) {
    fs.createReadStream('annotations.csv')
    .pipe(csv.parse({
        columns:true
    }))
    .on('data', (row) => {
        images_not_annotated.delete(row.image);
        images_annotated.add(row.image);
        annotations.push(row);
    })
    .on('end', () => {
        images_not_annotated = Array.from(images_not_annotated);
        images_annotated = Array.from(images_annotated);
        getStatus();
        cb();
    });
}

function readData(cb) {
    fs.createReadStream('metadata.csv')
    .pipe(csv.parse({
        columns:true
    }))
    .on('data', (row) => {
        images_not_annotated.add(row.image);
        metadata.push(row);
    })
    .on('end', () => {
        console.log('metadata.csv successfully processed');
        readAnnotations(cb);
    });
}

const annotation_header = [
    "identity",
    "image",
    "x1",
    "y1",
    "x2",
    "y2",
    "reviewed"
]

function setupServer() {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.get("/image_to_annotate", (req, res) => {
        res.json({
            "image": images_not_annotated[Math.floor(Math.random() * images_not_annotated.length)]
        })
    });
    app.get("/image_to_verify", (req, res) => {
        let annotation = annotations[Math.floor(Math.random() * annotations.length)]
        res.json({
            "image": annotation.image,
            "x1": annotation.x1,
            "y1": annotation.y1,
            "x2": annotation.x2,
            "y2": annotation.y2
        })
    });
    app.post("/submit_annotation", (req, res) => {
        const annotation = {
            identity: req.cookies.identity,
            image: req.body.image,
            x1: req.body.x1,
            y1: req.body.y1,
            x2: req.body.x2,
            y2: req.body.y2,
            reviewed: false,
        }

        let row = "";
        for(let i=0; i<annotation_header.length; i++) {
            row += annotation[annotation_header[i]] + ",";
        }
        row = row.substring(0, row.length-1);
        console.log(row)

        annotations.push(annotation);
        // append to file
        fs.appendFile('annotations.csv', row + "\n", function (err) {
            if (err) throw err;
            console.log('Results saved!');
        });

        const index = images_not_annotated.indexOf(annotation.image);
        if (index > -1) {
            images_not_annotated.splice(index, 1); // 2nd parameter means remove one item only
        }
        images_annotated.push(annotation.image);

        res.json({
            "received": true
        })
    });
    app.post("/submit_verification", (req, res) => {
        console.log('Cookies: ', req.cookies);
        console.log(req.body);
        res.json({
            "received": true
        })
    });
    app.use(express.static('public'));
    app.use("/images", express.static('images'));
    
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
}

readData(setupServer);