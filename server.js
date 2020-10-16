var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
require("dotenv").config();
const mongoose = require("mongoose");
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
  date: { type: Date },
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

// return all users with the same info
app.get("/api/exercise/users", (req, res) => {
  User.find({}, function (err, result) {
    if (err) return res.json({ error: "Database Error" });

    if (result) {
      return res.json(
        result.map((item) => ({ username: item.username, _id: item._id }))
      );
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
            _id: newExercise.userId,
            username: result.username,
            date: new Date(newExercise.date).toISOString().substring(0, 10),
            duration: newExercise.duration,
            description: newExercise.description,
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

  const queryObject = { userId: userId };

  const startDate = new Date(from);
  const endDate = new Date(to);

  if (startDate === null && endDate === null) {
    queryObject.date = { $gt: new Date(from), $lt: new Date(to) };
  }

  const query = Exercise.find(queryObject, "description duration date");

  if (!isNaN(limit)) {
    query.limit(parseInt(limit));
  }
  // find the user
  User.findOne({ _id: userId }, (err, userResult) => {
    if (err) return res.json({ error: "Database Error" });
    if (userResult) {
      query.exec((err, exerciseResult) => {
        if (err) return res.json({ error: "Database Error" });
        if (exerciseResult) {
          return res.json({
            _id: userResult._id,
            username: userResult.username,
            count: exerciseResult.length,
            log: exerciseResult.map((item) => ({
              description: item.description,
              duration: item.duration,
              date: new Date(item.date).toISOString().substring(0, 10),
            })),
          });
        } else {
          return res.json({ error: "exercise data not found" });
        }
      });
    } else {
      return res.json({ error: "user not found" });
    }
  });
});

app.listen(port, () => {
  console.log("Node.js listening on port " + port);
});
