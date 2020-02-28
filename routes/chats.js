const {
  io,
  router,
  client
} = require("../index");

const verifyToken = require("../services/verification");

io.on("connect", (socket) => {
  socket.emit("chatroomIdRequest");
  socket.on("sendingChatroomId", data => {
    socket.join(Number(data));
  })
});

// Chats
router.get("/allchats", (req, res) => {
  let ownId = Number(req.query.ownId);
  verifyToken(ownId, req.query.usertoken);

  client.query(
    `SELECT DISTINCT ON (user_chatroom.chatroomid) user_chatroom.chatroomid,
    user_chatroom.friendid, user_chatroom.userid, users.useremail,
    users.username, messages.id, messages.msgcontent, messages.createdat
    FROM user_chatroom
    LEFT JOIN messages ON user_chatroom.chatroomid = messages.chatroomid
    INNER JOIN users ON user_chatroom.friendid = users.id
    WHERE user_chatroom.userid = ${ownId}
    ORDER BY user_chatroom.chatroomid, messages.id DESC
    `, (err, result) => {
    if (err) {
      console.log(error);
      res.end()
    } else {
      res.send(result.rows);
    }
  }
  )
});

router.get("/:id/chatroom/:chatroomid", (req, res) => {

  let ownid = Number(req.params.id);
  let chatroomid = Number(req.params.chatroomid);
  let chatters;
  let messages;

  verifyToken(ownid, req.query.usertoken);

  client.query('SELECT users.useremail, users.username FROM user_chatroom INNER JOIN users ON user_chatroom.friendid = users.id WHERE chatroomid = $1 AND friendid != $2', [chatroomid, ownid], (err, result) => {
    if (err) {
      res.end()
    } else {
      chatters = result.rows;
      client.query('SELECT users.useremail, users.username, messages.id, messages.msgcontent, messages.createdat, messages.sentby FROM messages INNER JOIN users ON messages.sentby = users.id WHERE chatroomid=$1 ORDER BY messages.createdat', [chatroomid], (err, result) => {
        if (err) {

          res.end()
        } else {
          messages = result.rows;
          res.json({
            chatters,
            messages
          });
        }
      })
    }
  });
});

router.post("/sentmsg", (req, res) => {
  let ownId = Number(req.body.ownId);
  let chatroomId = Number(req.body.chatroomId);
  let msg = req.body.msg;

  verifyToken(ownId, req.body.usertoken);

  client.query('INSERT INTO messages(sentby, chatroomid, msgcontent) VALUES ($1, $2, $3) RETURNING *', [ownId, chatroomId, msg], (err, result) => {
    if (err) {
      console.log(err);
      res.end();
    }

    else {

      client.query('SELECT users.useremail, users.username, messages.id, messages.msgcontent, messages.createdat, messages.sentby FROM messages INNER JOIN users ON messages.sentby = users.id WHERE messages.id=$1', [result.rows[0].id], (err, result) => {
        if (err) {
          console.log(err);
          res.end()
        }
        else {
          io.to(chatroomId).emit("sendMsg", result.rows[0]);
          io.to(chatroomId).emit("receivedMsg", ownId);
          res.end();
        }
      })
    }
  })
});

router.get("/chatroomId/:msgId/ownId/:ownId", (req, res) => {

  let chatroomId = req.params.msgId;
  let ownId = req.params.ownId;

  client.query(`SELECT * FROM messages INNER JOIN chatrooms ON messages.chatroomid = chatrooms.id WHERE chatroomid = ${chatroomId} AND NOT sentby = ${ownId}`, (err, result) => {

    if (err) {
      console.log(err);
      res.end()
    } else {
      let total = 0;
      // console.log(result.rows);
      for (let i = 0; i < result.rows.length; i++) {
        total += result.rows[i]["msgread"]
      };
      res.json({ total });
    }
  });
});

router.put("/chatroomId/:msgId/ownId/:ownId", (req, res) => {
  let chatroomId = req.params.msgId;
  let ownId = req.params.ownId;
  console.log(chatroomId, ownId);
  client.query(`UPDATE messages SET msgread = 0 WHERE chatroomid = ${chatroomId} AND NOT sentby=${ownId}`, (err, result) => {
    res.end();
  })

})


module.exports = router;