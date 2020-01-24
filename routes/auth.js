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
// sign up
router.post("/signup", (req, res) => {
  client.query(`SELECT * FROM users WHERE useremail='${req.body.email}'`, (err, result) => {
    if (err) {
      res.send(err);
    }

    else {
      if (result.rows.length != 0) {
        res.json({ errorEmail: `${req.body.email} is already in use` })
      }

      else {
        let token = jwt.sign(req.body.email, "shhh");
        client.query(`INSERT INTO users(useremail, userpw, usertoken) VALUES('${req.body.email}', '${req.body.pw}', '${token}');`, (err, result) => {
          if (err) {
            res.send(err)
          }
          else {
            res.json({ token });
          }
        })
      }
    }
  });

});

// Checking for the localStorage
router.post("/authenticate", (req, res) => {
  client.query(`SELECT * FROM users WHERE usertoken='${req.body.userToken}'`, (err, result) => {
    if (err) {

    }
    else {
      res.json(result.rows)[0];
    }
  })
})

module.exports = router;
