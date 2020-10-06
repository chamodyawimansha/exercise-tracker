var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
require("dotenv").config();
const mongoose = require("mongoose");

var app = express();

const port = process.env.PORT;
app.use(cors());

const UserSchema = new mongoose.Schema({
  username: String,
});

const ExerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: String,
  date: Date,
});

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", () => {
  return res.json({ error: "Database Error" });
});

const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Exercise", ExerciseSchema);

/** this project needs to parse POST bodies **/
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/exercise/new-user", (req, res) => {
  let username = req.body.username;

  if (username.replace(/ /g, ";") == "") {
    return res.json({ error: "username is required" });
  }

  let newUser = new User({
    username: username,
  });

  newUser.save((error) => {
    if (error) {
      return res.json({ error: "Database Error" });
    } else {
      return res.json({ username: newUser.username, _id: newUser.id });
    }
  });
});

app.post("/api/exercise/log/:userId/:from?/:to?/:limit?", (req, res) => {});

app.listen(port, () => {
  console.log("Node.js listening on port " + port);
});
