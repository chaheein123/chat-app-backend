const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Postgresql DB
const pg = require("pg");
const { Client } = require("pg");
const connectionString = "postgres://postgres:root@localhost:5432/chat-app";
const client = new Client({
  connectionString: connectionString
});
client.connect();

// Routes
router.post("/signup", (req, res) => {

  console.log(req.body.email, "hello");
  client.query(`SELECT * FROM users WHERE useremail='${req.body.email}'`, (err, result) => {
    if (err) {
      console.log(err);
      console.log(req.body.email);
      res.send("error")
    }

    else {
      res.status(200).send(result.rows);
    }
  });

});




module.exports = router;