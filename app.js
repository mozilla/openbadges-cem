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
const async = require('async');

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
  /* We only need badges from a few programs, these will have to be hard coded.
     For testing, I'm grabbing three programs from csol, these will be renamed
     once we have data in staging CTM */
  async.parallel({
    peer: function(callback) {
      openbadger.getProgram('connected-educator-month-peer-to-peer', function(err, program) {
        callback(null, program);
      });},
    cta: function(callback) {
      openbadger.getProgram('connected-educator-month-connected-educator', function(err, program) {
        callback(null, program);
      });}
  }, function(err, results) {
    if (err) {
      console.error("ERROR " + err);
      return res.send(500, err);
    }
    return res.render('badges.html', { peer: results.peer, cta: results.cta });
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

app.get('/claim/:code', function(req, res, next) {
  var code = req.params.code;

  openbadger.getBadgeFromCode( { code: code, email: ''}, function(err, data) {
    if (err)
      return res.send(500, { status: 'error', error: err } );

    var badge = data.badge;

    if (!badge)
      return res.send(404);

    var template = 'claim-badge.html';

    return res.render(template, { badge: badge });
  });
});

app.post('/apply', function(req, res, next) {
  // form data in req.body.email and req.body.description
  return res.send(200);
});

app.post('/give', function(req, res, next) {
  // form data in req.body.giverEmail, req.body.recipientEmail, and req.body.description
  return res.send(200);
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
