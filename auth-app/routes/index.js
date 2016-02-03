var express = require('express');
var pkg = require('../package.json');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('index', { title: pkg.name });
});

router.get('/cross-storage-hub', function(req, res) {
  res.render('cross-storage-hub', { layout: false });
});

router.get('/cross-post-message-hub', function(req, res) {
  res.render('cross-post-message-hub', { layout: false });
});


module.exports = router;
