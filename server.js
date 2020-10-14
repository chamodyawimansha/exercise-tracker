var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
require("dotenv").config();
const mongoose = require("mongoose");
const { Decimal128 } = require("mongodb");

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
  return console.log("Database Error");
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

  User.findOne({ username: username }, (err, result) => {
    if (err) return res.json({ error: "Database Error" });
    if (result) {
      return res.json({
        error: "The username " + username + " is already registred",
      });
    } else {
      let newUser = new User({
        username: username,
      });

      newUser.save((error) => {
        if (error) {
          return res.json({ error: "Database Error" });
        } else {
          return res.json({
            username: newUser.username,
            _id: newUser.id,
          });
        }
      });
    }
  });
});

app.post("/api/exercise/add", (req, res) => {
  const { userId, description, duration, date } = req.body;

  if (
    userId.replace(/ /g, ";") == "" ||
    description.replace(/ /g, ";") == "" ||
    duration == ""
  ) {
    return res.json({ error: "Please insert required fields" });
  }

  //find if the user exists
  User.findOne({ _id: userId }, (err, result) => {
    if (err) return res.json({ error: "Database Error" });
    if (result) {
      //save the exersise here
      let newExercise = new Exercise({
        userId: userId,
        description: description,
        duration: duration,
        date: date !== "" ? date : new Date(),
      });

      newExercise.save((error) => {
        if (error) {
          return res.json({ error: "Database Error" });
        } else {
          return res.json({
            userId: newExercise.userId,
            description: newExercise.description,
            duration: newExercise.duration,
            date: new Date(newExercise.date).toISOString().substring(0, 10),
          });
        }
      });
    } else {
      return res.json({ error: "User not registred" });
    }
  });
});

app.post("/api/exercise/log/:userId/:from?/:to?/:limit?", (req, res) => {});

app.listen(port, () => {
  console.log("Node.js listening on port " + port);
});
