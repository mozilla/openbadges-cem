if ( process.env.NEW_RELIC_HOME ) {
  require( 'newrelic' );
}
const path = require('path');
const http = require('http');
const express = require('express');
const nunjucks = require('nunjucks');
const util = require('util'); // temporary for debugging

const port = parseInt(process.env.PORT || '3000');
const app = express();
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname, 'views')), {autoescape: true});
env.express(app);

const ENDPOINT = process.env['OPENBADGER_URL'];
const JWT_SECRET = process.env['OPENBADGER_SECRET'];
const TOKEN_LIFETIME = process.env['OPENBADGER_TOKEN_LIFETIME'] || 10000;

var openbadger = require('openbadger-client')(ENDPOINT, JWT_SECRET);

app.use(express.compress());
app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function(req, res, next) {
  res.send(200, 'hi there, <a href="/claim">claim</a> or <a href="/badges">badges</a> or <a href="/award">award</a>.'); }
);

app.get('/badges', function(req, res, next) {
  openbadger.getAllBadges(function(err, badges) {
    if (err) res.send(500, err);
    res.render('badges.html', { badges: badges.badges });
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

if (!module.parent)
  app.listen(port, function(err) {
    if (err) throw err;
    console.log("Listening on port " + port + ".");
  });
else
  module.exports = http.createServer(app);
