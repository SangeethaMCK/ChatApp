const session = require('express-session');
require('dotenv').config();

const sessionValidity = 1000 * 60 * 60 * 24 * 7; // 1 week
const cookieSecret = process.env.COOKIE_SECRET; // Ensure you match the environment variable name exactly

const sessionMiddleware = session({
  secret: cookieSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: sessionValidity },
});

module.exports = sessionMiddleware;
