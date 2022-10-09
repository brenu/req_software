const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const bd = new Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE_NAME,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

bd.connect((err) => {
  if (err) throw err;
  console.log("Succesfully connected to the database!");
});

module.exports = bd;