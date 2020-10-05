var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
require("dotenv").config();

var app = express();

const port = process.env.PORT;
app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});
