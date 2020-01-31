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

// Find users from friends feature
router.post("/findusers", (req, res) => {
  let usertoken = req.body.usertoken;
  let allusers;
  let requestSentUsers;
  let requestReceivedUsers;
  let userid;

  client.query(`SELECT useremail, username FROM users WHERE NOT usertoken ='${req.body.usertoken}'`, (err, result) => {
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      allusers = result["rows"];
      client.query(`SELECT id FROM users WHERE usertoken='${usertoken}'`, (err, result) => {
        if (err) {
          console.log(err);
          res.send(err);
        }
        else {
          userid = result["rows"][0]["id"];

          // for the friend-request sent users
          client.query(`SELECT DISTINCT useremail FROM user_friends INNER JOIN users ON users.id = user_friends.friend_id WHERE user_id=${userid} AND status='Request sent'`, (err, result) => {
            if (err) {
              console.log(err)
            }
            else {
              requestSentUsers = result["rows"];

              client.query(`SELECT DISTINCT useremail FROM user_friends INNER JOIN users ON users.id = user_friends.friend_id WHERE user_id=${userid} AND status='Request received'`, (err, result) => {
                if (err) {
                  console.log(err)
                }
                else {
                  requestReceivedUsers = result["rows"];
                  res.json({ allusers, requestSentUsers, requestReceivedUsers })
                }
              })

            }
          })
        }
      })
    }
  })
});

// Handles request to send friend request
router.post("/addfriends", (req, res) => {
  let userid;
  let friendid;
  let friendemail = req.body.friendemail;

  client.query(`SELECT id FROM users WHERE usertoken='${req.body.usertoken}'`, (err, result) => {
    if (err) {
      console.log(err);
      res.send(err);
    }

    else {
      userid = result["rows"][0]["id"];
      client.query(`SELECT id FROM users WHERE useremail='${friendemail}'`, (err, result) => {
        if (err) {
          console.log(err);
          res.send(err);
        }

        else {
          friendid = result["rows"][0]["id"];

          client.query(`INSERT INTO user_friends(user_id, friend_id, status) VALUES(${userid}, ${friendid},'Request sent'); INSERT INTO user_friends(user_id, friend_id, status) VALUES(${friendid}, ${userid},'Request received')`, (err, result) => {
            if (err) {
              console.log(err);
              res.send(err);
            }
            else {
              res.send();
            }

          })
        }
      })
    }
  })
})

// Handles request to cancel friend request
router.post("/cancelrequest", (req, res) => {
  let friendemail = req.body.friendemail;
  let userid;
  let friendid;

  client.query(`SELECT id FROM users WHERE usertoken='${req.body.usertoken}'`, (err, result) => {
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      userid = result["rows"][0]["id"];
      client.query(`SELECT id FROM users WHERE useremail='${req.body.friendemail}'`, (err, result) => {
        if (err) {
          console.log(err);
          res.send(err);
        }
        else {
          friendid = result["rows"][0]["id"];
          // console.log(friendid, "this is the friend id")
          client.query(
            `DELETE FROM user_friends WHERE user_id=${userid} AND friend_id=${friendid}; 
            DELETE FROM user_friends WHERE user_id=${friendid} AND friend_id=${userid}
            `, (err, result) => {
              if (err) {
                console.log(err);
                res.send(err)
              }
              else {
                res.send();
              }
            })
        }
      })
    }
  })
}
)
module.exports = router;
