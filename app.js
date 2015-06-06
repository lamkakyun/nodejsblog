var express = require('express');
var logger = require('morgan');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var crypto = require('crypto');
var User = require('./models/user.js');

var routes = require('./routes/index.js');
var settings = require('./settings');
var flash = require('connect-flash');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('.html', require('ejs').__express);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(favicon(__dirname + '/public/img/icon/favicon.ico'));
app.use(express.static(path.join(__dirname, '/public')));

app.use(flash());

app.use(session({
  secret: settings.cookieSecret,
  key: settings.db, // cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}, // 30 days
  resave: true,
  saveUninitialized: true,
  store: new mongoStore({
    db: settings.db,
    host: settings.host,
    port: settings.port
  })
}));

routes(app);

app.use(function(req, res) {
  res.render("404");
});

app.listen(app.get('port'), function(){
  console.log('server running on ' + app.get('port'));
});

