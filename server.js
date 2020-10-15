var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
require("dotenv").config();
const mongoose = require("mongoose");
const { Decimal128 } = require("mongodb");
const Schema = mongoose.Schema;

var app = express();

const port = process.env.PORT;
app.use(cors());

const UserSchema = new Schema({
  username: String,
});

const ExerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: String,
  date: String,
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

app.get("/api/exercise/log", (req, res) => {
  const { userId, from, to, limit } = req.query;
  let user;

  // find the user
  User.findOne({ _id: userId }, (err, result) => {
    if (err) return res.json({ error: "Database Error" });
    if (result) {
      user = result;
    } else {
      return res.json({ error: "user not found" });
    }
  });

  const query = Exercise.find({ userId: userId }, "description duration date");

  query.exec((err, result) => {
    if (err) return res.json({ error: "Database Error" });
    // Prints "Space Ghost is a talk show host."

    if (result) {
      return res.json({
        _id: user.id,
        username: user.username,
        count: result.length,
        log: result.map((item) => ({
          description: item.description,
          duration: item.duration,
          date: item.date,
        })),
      });
    } else {
      return res.json({ error: "user not found" });
    }
  });
});

app.listen(port, () => {
  console.log("Node.js listening on port " + port);
});
