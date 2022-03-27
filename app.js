var express = require('express');
var Multer  = require('multer');
var path = require('path');
var id = require('shortid');
const send_receipt = require('./receipt');

var app = express();
app.use(express.static('pages/'));

const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});
//const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

app.get('/', (req, res) => {
    res.render(path.join(__dirname, "/pages/home.ejs"));
})

app.post('/receipt-upload', multer.single('profile-file'), (req, res, next) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  const blob = bucket.file(`${id.generate()}.png`);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', err => {
    next(err);
  });

  blobStream.on('finish', () => {
    var parsed = send_receipt(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
    parsed.then(function(result){
      return res.send(result);
    })
  });

  blobStream.end(req.file.buffer);
});
  
const port = process.env.PORT || 3000;
app.listen(port,() => console.log(`Server running on port ${port}!`));