import session from 'express-session';
import dotenv from 'dotenv';
import MongoStore from 'connect-mongo';
dotenv.config();

const sessionValidity = 1000 * 60 * 60 * 24 * 7; // 1 week
const cookieSecret = process.env.COOKIE_SECRET; // Ensure you match the environment variable name exactly

const sessionMiddleware = session({
  secret:process.env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: sessionValidity },
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI,
    collectionName : 'ChatApp',
   }),

});

export default sessionMiddleware;
