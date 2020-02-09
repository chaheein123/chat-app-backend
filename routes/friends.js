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
  let userid = req.body.userid;
  let friends;

  client.query(`SELECT useremail, username FROM users WHERE NOT id ='${userid}'`, (err, result) => {

    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      allusers = result["rows"];
      client.query(`SELECT DISTINCT useremail FROM user_friends INNER JOIN users ON users.id = user_friends.friend_id WHERE user_id=${userid} AND status='Request sent'`, (err, result) => {
        if (err) {
          console.log(err);
          res.send(err);
        }
        else {
          requestSentUsers = result["rows"];
          client.query(`SELECT DISTINCT useremail FROM user_friends INNER JOIN users ON users.id = user_friends.friend_id WHERE user_id=${userid} AND status='Request received'`, (err, result) => {
            if (err) {
              console.log(err);
              res.send(err)
            }

            else {
              requestReceivedUsers = result["rows"];
              client.query(`SELECT DISTINCT useremail FROM user_friends INNER JOIN users ON users.id = user_friends.friend_id WHERE user_id=${userid} AND status='Friends'`, (err, result) => {
                if (err) {
                  console.log(err);
                  res.send(err)
                }
                else {
                  friends = result["rows"];
                  res.json({ allusers, requestSentUsers, requestReceivedUsers, friends })
                }
              })
            }
          })
        }
      })
    }
  })
})

// Handles request to send friend request
router.post("/addfriends", (req, res) => {
  let userid = req.body.userid;
  let friendemail = req.body.friendemail;
  let friendid;

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
          res.end();
        }
      })
    }
  })
})

// Handles request to cancel friend request
router.post("/cancelrequest", (req, res) => {

  let userid = req.body.userid;
  let friendemail = req.body.friendemail;
  let friendid;

  client.query(`SELECT id FROM users WHERE useremail='${friendemail}'`, (err, result) => {
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      friendid = result["rows"][0]["id"];
      client.query(`DELETE FROM user_friends WHERE user_id=${userid} AND friend_id=${friendid}; DELETE FROM user_friends WHERE user_id=${friendid} AND friend_id=${userid}`, (err, result) => {
        if (err) {
          console.log(err);
          res.send(err)
        }
        else {
          res.end();
        }
      })
    }
  })
});

router.post("/acceptrequest", (req, res) => {

  let userid = req.body.userid;
  let friendemail = req.body.friendemail;
  let friendid;
  let chatroomid;

  client.query(`SELECT id FROM users WHERE useremail='${friendemail}'`, (err, result) => {
    if (err) {
      console.log(err, "error in the accept request trying to find the id of the friend with friend email");
      res.send(err)
    }
    else {
      friendid = result.rows[0]["id"];
      client.query(`UPDATE user_friends SET status='Friends' WHERE user_id=${userid} AND friend_id=${friendid}; UPDATE user_friends SET status='Friends' WHERE user_id=${friendid} AND friend_id=${userid};`);

      client.query(`INSERT INTO chatrooms(population, user_id) VALUES (DEFAULT, ARRAY[${userid}, ${friendid}]) RETURNING id`, (err, result) => {
        if (err) {
          console.log(err);
          res.end();
        }

        else {
          chatroomid = result["rows"][0]["id"];
          client.query(`INSERT INTO user_chatroom(userid, friendid, chatroomid) VALUES(${userid}, ${friendid}, ${chatroomid}); INSERT INTO user_chatroom(friendid, userid, chatroomid) VALUES(${userid}, ${friendid},${chatroomid})`, (err, result) => {
            if (err) {
              console.log(err);
              res.end();
            }
            else {
              res.end();
            }
          })
        }
      })
    }
  })
})

module.exports = router;
