var express = require('express');
var pkg = require('../package.json');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('index', { title:  pkg.name });
});

module.exports = router;
