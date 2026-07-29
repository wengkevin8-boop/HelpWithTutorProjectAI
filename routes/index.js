var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.redirect("/signup");
});

router.get('/signin', function(req, res, next) {
  res.render("signin");
});

router.get('/signup', function(req, res, next) {
  res.render("signup");
});

module.exports = router;