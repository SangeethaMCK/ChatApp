import session from 'express-session';
import dotenv from 'dotenv';
dotenv.config();

const sessionValidity = 1000 * 60 * 60 * 24 * 7; // 1 week
const cookieSecret = process.env.COOKIE_SECRET; // Ensure you match the environment variable name exactly

const sessionMiddleware = session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: sessionValidity },
});

export default sessionMiddleware;
