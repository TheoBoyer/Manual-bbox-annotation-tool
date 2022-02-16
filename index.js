const express = require('express');
const fs = require("fs");
const csv = require('csv')
const app = express();

port=3000;

const annotations = [];
function readAnnotations(cb) {
    fs.createReadStream('annotations.csv')
    .pipe(csv.parse({
        columns:true
    }))
    .on('data', (row) => {
        images_not_annotated.delete(row.image);
        annotations.push(row);
    })
    .on('end', () => {
        console.log('annotations.csv successfully processed');
        console.log(`${metadata.length} images in total`);
        console.log(`${images_not_annotated.size} images yet to be annotated`);
        images_not_annotated = Array.from(images_not_annotated);
        cb();
    });
}

const metadata = [];
let images_not_annotated = new Set();
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

function setupServer() {
    app.use("/image_to_annotate", (req, res) => {
        res.json({
            "image": images_not_annotated[Math.floor(Math.random() * images_not_annotated.length)]
        })
    });
    app.use(express.static('public'));
    app.use("/images", express.static('images'));
    
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
}

readData(setupServer);