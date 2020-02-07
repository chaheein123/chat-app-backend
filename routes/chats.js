const express = require("express");
const router = express.Router();

// Postgresql DB
const pg = require("pg");
const { Client } = require("pg");
const connectionString = "postgres://postgres:root@localhost:5432/chat-app";
const client = new Client({
  connectionString: connectionString
});
client.connect();

// Chats
router.get("/allchats/:id", (req, res) => {
  let userid = Number(req.params.id);

  client.query(
    `SELECT DISTINCT ON (user_chatroom.chatroomid) user_chatroom.chatroomid,
    user_chatroom.friendid, user_chatroom.userid, users.useremail, 
    users.username, messages.id, messages.msgcontent, messages.createdat
    FROM user_chatroom
    INNER JOIN messages ON user_chatroom.chatroomid = messages.chatroomid
    INNER JOIN users ON user_chatroom.friendid = users.id
    WHERE user_chatroom.userid = ${userid}
    ORDER BY user_chatroom.chatroomid, messages.id DESC
    `, (err, result) => {
      if (err) {
        console.log(err);
        res.end()
      }
      else {
        console.log(result.rows);

        res.send(result.rows);
      }
    }
  )


})





module.exports = router;
