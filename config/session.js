const Session = require('express-session');
const dotenv = require('dotenv');
dotenv.config();

const session = Session({
    secret: process.env.SESSIONS_SECRET,
    cookie: {maxAge: 1000 * 60 * 60 * 24},
    saveUninitialized: true,
    resave: false,
})

module.exports = session