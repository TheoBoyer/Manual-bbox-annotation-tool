const express = require('express');
const app = express();

app.use("/image_to_annotate", (req, res) => {
      
});
app.use(express.static('public'));

app.listen(3000);