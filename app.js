if ( process.env.NEW_RELIC_HOME ) {
  require( 'newrelic' );
}
const path = require('path');
const http = require('http');
const express = require('express');
const nunjucks = require('nunjucks');
const sass = require('node-sass');
const util = require('util'); // temporary for debugging
const url = require('url');
const validator = require('validator');

const port = parseInt(process.env.PORT || '3000');
const app = express();
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname, 'views')), {autoescape: true});
env.express(app);

const OB_ENDPOINT = process.env['OPENBADGER_URL'];
const JWT_SECRET = process.env['OPENBADGER_SECRET'];
const TOKEN_LIFETIME = process.env['OPENBADGER_TOKEN_LIFETIME'] || 10000;
const CEM_HOST = process.env['CEM_HOST'];

const AESTIMIA_ENDPOINT = process.env['AESTIMIA_URL'];
const AESTIMIA_SECRET = process.env['AESTIMIA_SECRET'];

var openbadger = require('openbadger-client')(OB_ENDPOINT, JWT_SECRET);
var aestimia = require('aestimia-client')({
  endpoint: AESTIMIA_ENDPOINT,
  secret: AESTIMIA_SECRET
});

app.use(sass.middleware({
  root: path.join(__dirname, 'bower_components'),
  src: 'foundation/scss',
  dest: 'foundation/css',
  debug: true
}));

app.use(express.compress());
app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, 'bower_components')));

app.get('/', function(req, res, next) {
  openbadger.getAllBadges(function(err, badges) {
    if (err) res.send(500, err);
    res.render('badges.html', { badges: badges.badges });
  });
});

app.get('/badge/:shortname', function(req, res, next) {
  var shortname = req.params.shortname;
  var mode = req.query.mode;
  openbadger.getBadge(shortname, function(err, data) {
    if (err)
      return res.send(500, { status: 'error', error: err } );

    var badge = data.badge;

    if (!badge)
      return res.send(404);

    var template = 'badge-details.html';

    if (mode === 'give') {
      template = 'give-badge.html';
    }
    else if (mode === 'apply') {
      template = 'apply-badge.html';
    }

    var permalink = url.format({
        protocol: 'http',
        host: CEM_HOST,
        pathname: '/',
        hash: 'badgedetail=' + badge.shortname
      });

    return res.render(template, { badge: badge, permalink: permalink });
  });
});

app.get('/pushbadge', function(req, res, next) {
  var shortname = req.query.shortname;
  var email = req.query.email;

  try {
    validator.check(email, 'Please enter a valid email address').isEmail();
  } catch (e) {
    return res.send(500, e.message);
  }

  openbadger.getUserBadge( { id: shortname, email: email }, function(err, data) {
    if (err)
      return res.send(500, { status: 'error', error: err } );

    var badge = data.badge;

    if (!badge)
      return res.send(404);

    res.render('push-badge.html', { badge: badge });
  });
});


app.post('/claim', function(req, res, next) {
  var code = req.body.code;
  var email = req.body.email;
  var shortname = req.body.shortname;
  try {
    validator.check(email, 'Please enter a valid email address.').isEmail();
  } catch (e) {
    return res.send(500, e.message);
  }

  openbadger.claim( { code: code, learner: { email: email } }, function(err, data) {
    if (err && err.message.indexOf('already has badge') <= -1)
      return res.send(500, err.message );

    res.send(200, { status: 'ok', shortname: shortname, email: email });
  });
});

app.get('/claim/:code', function(req, res, next) {
  var code = req.params.code;

  openbadger.getBadgeFromCode( { code: code, email: ''}, function(err, data) {
    if (err)
      return res.send(500, { status: 'error', error: err } );

    var badge = data.badge;

    if (!badge)
      return res.send(404);

    return res.render('claim-badge.html', { badge: badge, code: code });
  });
});

app.post('/apply', function(req, res, next) {
  // form data in req.body.email and req.body.description
  return res.send(200, 'Thanks for applying for this badge. A notification will be sent to you upon review of the badge application.');
});

app.post('/give', function(req, res, next) {
  // form data in req.body.giverEmail, req.body.recipientEmail, and req.body.description
  return res.send(200, "Thanks for your submission. We'll notify your peer upon review of the peer badge application.");
});

// Endpoint for aestimia callbacks - can be renamed
app.use('/aestimia', aestimia.endpoint(function(submission, next) {
  // TO DO: send emails, update openbadger
  next();
}));

if (!module.parent)
  app.listen(port, function(err) {
    if (err) throw err;
    console.log("Listening on port " + port + ".");
  });
else
  module.exports = http.createServer(app);
