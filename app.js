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
  res.send(200, 'hi there, <a href="/claim">claim</a> or <a href="/badges">badges</a> or <a href="/award">award</a>.'); }
);

app.get('/badges', function(req, res, next) {
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
        pathname: '/badges',
        hash: 'badgedetail=' + badge.shortname
      });

    return res.render(template, { badge: badge, permalink: permalink });
  });
});

app.get('/claim', function(req, res, next) {
  if (req.query && req.query.code) {
    res.send(200, "you want to claim badge " + req.query.code);
  } else {
    res.send(200,"claim a badge, for grins also try <a href=\"/claim?code=123\">this</a>.");
  };
});

app.get('/award', function(req, res, next) { res.send(200, "award someone else a badge right here") } );

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
