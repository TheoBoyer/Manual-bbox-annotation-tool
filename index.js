const express = require('express');
const fs = require("fs");
const csv = require('csv')
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

function getStatus() {
    console.log(`The competition dataset contains ${metadata.length} images in total`);
    console.log(`The verified dataset contains ${dataset.length} images in total`);
    console.log(`${annotations.length} annotations have been made in total`);
    console.log(`${states.to_annotate.length} images are waiting to be annotated`);
    console.log(`${states.to_verify.length} annotations needs to be verified`);
}

port=3000;

const metadata = [];
const annotations = [];
const dataset = [];
const states = {
    to_annotate: new Set(),
    to_verify: new Set()
}
function readDataset(cb) {
    fs.createReadStream('./data/dataset.csv')
    .pipe(csv.parse({
        columns:true
    }))
    .on('data', (row) => {
        states.to_annotate.delete(row.image);
        states.to_verify.delete(row.image);
        dataset.push(row);
    })
    .on('end', () => {
        console.log('dataset.csv successfully processed');
        states.to_annotate = Array.from(states.to_annotate);
        states.to_verify = Array.from(states.to_verify);
        getStatus();
        cb();
    });
}

function readAnnotations(cb) {
    fs.createReadStream('./data/annotations.csv')
    .pipe(csv.parse({
        columns:true
    }))
    .on('data', (row) => {
        if(row.verified === "False") {
            states.to_annotate.delete(row.image);
            states.to_verify.add(row.image);
        }
        annotations.push(row);
    })
    .on('end', () => {
        console.log('annotations.csv successfully processed');
        readDataset(cb);
    });
}

function readData(cb) {
    fs.createReadStream('./data/metadata.csv')
    .pipe(csv.parse({
        columns:true
    }))
    .on('data', (row) => {
        states.to_annotate.add(row.image);
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
    "verified",
    "judge_identity",
    "judge_decision"
]
const dataset_header = [
    "image",
    "x1",
    "y1",
    "x2",
    "y2"
]

function setupServer() {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.get("/image_to_annotate", (req, res) => {
        if(states.to_annotate.length === 0) {
            res.json({
                "image": null
            });
        } else {
            res.json({
                "image": states.to_annotate[Math.floor(Math.random() * states.to_annotate.length)]
            })
        }
    });
    app.get("/image_to_verify", (req, res) => {
        if(states.to_verify.length === 0) {
            res.json({
                "image": null
            });
        } else {
            const image_to_verify = states.to_verify[Math.floor(Math.random() * states.to_verify.length)]
            const annotation = annotations.find(annotation => annotation.image === image_to_verify);
            res.json({
                "image": annotation.image,
                "x1": annotation.x1,
                "y1": annotation.y1,
                "x2": annotation.x2,
                "y2": annotation.y2
            });
        }
    });
    app.post("/submit_annotation", (req, res) => {
        const annotation = {
            identity: req.cookies.identity,
            image: req.body.image,
            x1: req.body.x1,
            y1: req.body.y1,
            x2: req.body.x2,
            y2: req.body.y2,
            verified: "False",
            judge_identity: "",
            judge_decision: ""
        }

        let row = "";
        for(let i=0; i<annotation_header.length; i++) {
            row += annotation[annotation_header[i]] + ",";
        }
        row = row.substring(0, row.length-1);

        annotations.push(annotation);
        // append to file
        fs.appendFile('./data/annotations.csv', row + "\n", function (err) {
            if (err) throw err;
            console.log('Results saved!');
        });

        const index = states.to_annotate.indexOf(annotation.image);
        if (index > -1) {
            states.to_annotate.splice(index, 1);
        }
        states.to_verify.push(annotation.image);
        getStatus();

        res.json({
            "received": true
        })
    });
    app.post("/submit_verification", (req, res) => {
        console.log('Cookies: ', req.cookies);
        console.log(req.body);
        const annotation = annotations.find(annotation => annotation.image === req.body.image);
        annotation.verified = "True";
        annotation.judge_identity = req.cookies.identity;
            // Remove image from to_verify
        const index = states.to_verify.indexOf(annotation.image);
        if (index > -1) {
            states.to_verify.splice(index, 1);
        }
        if(req.body.positive) {
            annotation.judge_decision = "accepted";
            var dataset_annotation = {...annotation};
            let x1 = parseFloat(annotation.x1);
            let y1 = parseFloat(annotation.y1);
            let x2 = parseFloat(annotation.x2);
            let y2 = parseFloat(annotation.y2);

            x1 = Math.min(x1, x2);
            y1 = Math.min(y1, y2);
            x2 = Math.max(x1, x2);
            y2 = Math.max(y1, y2);

            dataset_annotation.x1 = x1;
            dataset_annotation.y1 = y1;
            dataset_annotation.x2 = x2;
            dataset_annotation.y2 = y2;

            dataset.push(dataset_annotation);
            // append to file
            let row = "";
            for(let i=0; i<dataset_header.length; i++) {
                row += dataset_annotation[dataset_header[i]] + ",";
            }
            row = row.substring(0, row.length-1);
            fs.appendFile('./data/dataset.csv', row + "\n", function (err) {
                if (err) throw err;
                console.log('Results saved!');
            });
            // Open the annotations.csv file and update the row
            fs.readFile('./data/annotations.csv', 'utf8', function (err,data) {
                if (err) {
                    return console.log(err);
                }
                // Find the corresponding row
                data = data.replace(
                    new RegExp(`${annotation.identity},${annotation.image},${annotation.x1},${annotation.y1},${annotation.x2},${annotation.y2},False,,\n`),
                    `${annotation.identity},${annotation.image},${annotation.x1},${annotation.y1},${annotation.x2},${annotation.y2},${annotation.verified},${annotation.judge_identity},${annotation.judge_decision}\n`
                );
                // Write the new data to the file
                fs.writeFile('./data/annotations.csv', data, 'utf8', function (err) {
                    if (err) return console.log(err);
                });
            });
        } else {
            annotation.judge_decision = "rejected";
            states.to_annotate.push(annotation.image);
            // Open the annotations.csv file and update the row
            fs.readFile('./data/annotations.csv', 'utf8', function (err,data) {
                if (err) {
                    return console.log(err);
                }
                // Find the corresponding row
                data = data.replace(
                    new RegExp(`${annotation.identity},${annotation.image},${annotation.x1},${annotation.y1},${annotation.x2},${annotation.y2},False,,\n`),
                    `${annotation.identity},${annotation.image},${annotation.x1},${annotation.y1},${annotation.x2},${annotation.y2},${annotation.verified},${annotation.judge_identity},${annotation.judge_decision}\n`
                );
                // Write the new data to the file
                fs.writeFile('./data/annotations.csv', data, 'utf8', function (err) {
                    if (err) return console.log(err);
                });
            });
        }
        getStatus();

        res.json({
            "received": true
        })
    });
    app.use(express.static('public'));
    app.use("/images", express.static('images'));
    app.use("/data", express.static('data'));
    
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
}

readData(setupServer);