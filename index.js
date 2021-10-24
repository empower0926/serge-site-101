const express = require("express");
const mongoose = require("mongoose");
const layouts = require("express-ejs-layouts");
const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const { initPassport } = require("./passportConfig");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// model exports
const Newsletter = require("./models/newsletter");

const app = express();
app.use(layouts);
app.set("layout", "./layouts/main");
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(flash());

const maxAge = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: maxAge },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// passport
initPassport(passport);

const port = process.env.PORT || 3000;
const DBURI = process.env.DB_URL;

mongoose.connect(DBURI).then((result) => {
  app.listen(port, console.log("app is running"));
});

//GET APIs
app.get("/posts/:page", (req, res) => {
  const limit = 10;
  let skip;
  if (req.params.page) {
    skip = req.params.page * limit - 10;
  } else {
    skip = 0;
  }

  Newsletter.find({})
    .limit(limit)
    .skip(skip)
    .then((result) => {
      Newsletter.countDocuments({}, (err, c) => {
        let pages = Math.round(c / limit);

        if (limit * pages < c) {
          pages += 1;
        }

        const paginate = {
          start: 1,
          pages: pages,
        };

        res.render("newsletters", { newsletters: result, paginate: paginate });
      });
    });
});

app.get("/", (req, res) => {
  const limit = 10;
  Newsletter.find({})
    .limit(limit)
    .then((result) => {
      Newsletter.countDocuments({}, (err, c) => {
        let pages = Math.round(c / limit);

        if (limit * pages < c) {
          pages += 1;
        }

        const paginate = {
          start: 1,
          pages: pages,
        };

        res.render("newsletters", { newsletters: result, paginate: paginate });
      });
    });
});

app.get("/post/:postURL", (req, res) => {
  Newsletter.findOne({ postURL: req.params.postURL }).then((result) => {
    if (result) {
      Newsletter.find({})
        .limit(5)
        .then((recents) => {
          res.render("post", {
            layout: "layouts/postlayout",
            post: result,
            recents: recents,
          });
        });
    } else {
      res.sendStatus(404);
    }
  });
});

// admin
app.get("/admin/new-post", checkAuth, (req, res) => {
  res.render("writter");
});

app.get("/admin/login", checkLoggedIn, (req, res) => {
  res.render("login");
});

app.get("/admin/all-posts", checkAuth, (req, res) => {
  Newsletter.find({}).then((result) => {
    res.render("newsletters", { newsletters: result });
  });
});

// POST
app.post(
  "/admin/login",
  passport.authenticate("local", {
    successRedirect: "/admin/new-post",
    failureRedirect: "/admin/login",
    failureFlash: true,
  })
);

app.post("/admin/publish", async (req, res) => {
  const form = formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    const { title, content, ogcontent } = fields;

    cloudinary.uploader.upload(
      files.image.path,
      { public_id: `ollorun-newsfeed/${files.image.name}` },
      (err, result) => {
        if (err) {
          res.json({ status: 500, message: "cannot upload image" });
        }

        const postURL = title
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w\-]+/g, "")
          .replace(/\-\-+/g, "-")
          .replace(/^-+/, "")
          .replace(/-+$/, "");

        const newsletter = new Newsletter({
          postURL: postURL,
          title: title,
          content: content,
          imageURL: result.url,
          ogcontent: ogcontent,
          date: new Date(),
        });

        newsletter.save().then((result) => {
          console.log("post saved");
          console.log(result);
          res.json({
            status: 200,
            message: "post successfully published.",
            post: newsletter,
          });
        });
      }
    );
  });
});

// app.get("/delete", (req, res) => {
//   Newsletter.remove({}).exec();
// });

const User = require("./models/user");
app.get("/user", (req, res) => {
  bcrypt.hash("123", 10).then((hash) => {
    const user = new User({
      email: "wanipun96@gmail.com",
      password: hash,
    });

    user.save().then((result) => {
      res.send(result);
    });
  });
});

// middlewares
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/admin/login");
}

function checkLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/admin/new-post");
  }
  return next();
}
