const router = require("express").Router();

//bring in Article model
let Article = require("../models/article");
// User model
let User = require("../models/user");

//Add route
router.get("/add", ensureAuthenticated, (req, res) => {
  res.render("add_article", {
    title: "Add article",
  });
});

//Add Submit POST Route
router.post("/add", (req, res) => {
  req.checkBody("title", "Title is required").notEmpty();
  req.checkBody("body", "Body is required").notEmpty();

  //Get Error
  let errors = req.validationErrors();

  if (errors) {
    res.render("add_article", {
      title: "Add Article",
      errors: errors,
    });
  } else {
    let article = new Article();
    article.title = req.body.title;
    article.author = req.user._id;
    article.body = req.body.body;
    article.save((err) => {
      if (err) {
        console.log(err);
        return;
      } else {
        req.flash("success", "Article Added");
        res.redirect("/");
      }
    });
  }
  console.log("submitted");
});

//Load edit form
router.get("/edit/:id", ensureAuthenticated, (req, res) => {
  Article.findById(req.params.id, (err, article) => {
    if (article.author != req.user._id) {
      req.flash("danger", "Not Authorized");
      return res.redirect("/");
    }
    res.render("edit_article", {
      title: "Edit Article",
      article,
    });
  });
});

//Update Submit POST Route
router.post("/edit/:id", (req, res) => {
  let article = {};
  article.title = req.body.title;
  article.author = req.body.author;
  article.body = req.body.body;
  let query = { _id: req.params.id };

  Article.updateOne(query, article, (err) => {
    if (err) {
      console.log(err);
      return;
    } else {
      req.flash("success", "Article updated");
      res.redirect("/");
    }
  });
  console.log("submitted");
});

//Get single article
router.get("/:id", (req, res) => {
  Article.findById(req.params.id, (err, article) => {
    User.findById(article.author, (err, user) => {
      res.render("article", {
        article,
        author: user.name,
      });
    });
  });
});

router.delete("/:id", (req, res) => {
  if (!req.user._id) {
    res.status(500).send();
  }

  let query = { _id: req.params.id };
  Article.findById(req.params.id, (err, article) => {
    if (article.author != req.user._id) {
      //!== was causing misbehavior in this code
      res.status(500).send();
    } else {
      Article.deleteOne(query, (err) => {
        if (err) {
          console.log(err);
          return;
        }
        res.send("Success");
      });
    }
  });
});

// Access control
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash("danger", "Please login");
    res.redirect("/users/login");
  }
}

module.exports = router;
