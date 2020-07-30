const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const expressValidator = require("express-validator");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const config = require("./config/database");

mongoose.connect(config.database, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});
const db = mongoose.connection;

//check connection
db.once("open", () => console.log("Connected to MongoDB"));

//check for db errors
db.on("error", function (err) {
  console.log(err);
});

//Init app
const app = express();

//bring in models
let Article = require("./models/article");

//Body parsing middleware
//parse application/x-www-form-urlencoded
app.use(express.json());
//parse application/json
app.use(express.urlencoded({ extended: false }));

//set public folder
app.use(express.static(path.join(__dirname, "public")));

//Load view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Express session middleware
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
  })
);

//Express messages middlware
app.use(require("connect-flash")());
app.use((req, res, next) => {
  res.locals.messages = require("express-messages")(req, res);
  next();
});

//Express validator middleware
app.use(
  expressValidator({
    errorFormatter: (param, msg, value) => {
      var namespace = param.split("."),
        root = namespace.shift(),
        formParam = root;
      while (namespace.length) {
        formParam += "[" + namespace.shift() + "]";
      }
      return {
        param: formParam,
        msg: msg,
        value: value,
      };
    },
  })
);

// Passport config
require("./config/passport")(passport);
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get("*", (req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

//Home route
app.get("/", (req, res) => {
  Article.find({}, (err, articles) => {
    if (err) {
      console.log(err);
    } else {
      res.render("index", {
        title: "Articles",
        articles: articles,
      });
    }
  });
});

//Routes
app.use("/articles", require("./routes/articles"));
app.use("/users", require("./routes/users"));

//start server
app.listen(3000, () => console.log(`Server is listeining on port 3000`));
