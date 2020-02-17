const {
  io,
  router,
  client
} = require("../index");

const userIdToSocketIdMap = {};

io.on("connection", (socket) => {
  console.log("SOCKET ID : ", socket.id)
  userIdToSocketIdMap[148] = socket.id;
});

// Chats
router.get("/allchats/:id", (req, res) => {
  let userid = Number(req.params.id);

  client.query(
    `SELECT DISTINCT ON (user_chatroom.chatroomid) user_chatroom.chatroomid,
    user_chatroom.friendid, user_chatroom.userid, users.useremail,
    users.username, messages.id, messages.msgcontent, messages.createdat
    FROM user_chatroom
    LEFT JOIN messages ON user_chatroom.chatroomid = messages.chatroomid
    INNER JOIN users ON user_chatroom.friendid = users.id
    WHERE user_chatroom.userid = ${userid}
    ORDER BY user_chatroom.chatroomid, messages.id DESC
    `, (err, result) => {
      if (err) {

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

  client.query(`SELECT users.useremail, users.username FROM user_chatroom INNER JOIN users ON user_chatroom.friendid = users.id WHERE chatroomid = ${chatroomid} AND friendid != ${ownid}`, (err, result) => {
    if (err) {

      res.end()
    } else {
      chatters = result.rows;
      client.query(`SELECT users.useremail, users.username, messages.id, messages.msgcontent, messages.createdat, messages.sentby FROM messages INNER JOIN users ON messages.sentby = users.id WHERE chatroomid=${chatroomid} ORDER BY messages.createdat`, (err, result) => {
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

  client.query(`INSERT INTO messages(sentby, chatroomid, msgcontent) VALUES (${ownId}, ${chatroomId}, '${msg}') RETURNING *`, (err, messageResult) => {
    if (err) console.log(err);
    client.query(`SELECT userid FROM user_chatroom WHERE chatroomid = ${chatroomId}`, (err, result) => {
      if (err) console.log(err);

      const userIds = result.rows.map(({
        userid
      }) => userid);

      userIds.map((userId) => {
        console.log(userIdToSocketIdMap[userId])
        io.to(userIdToSocketIdMap[userId]).emit("newMessage", messageResult.rows);
      });

      res.end();
    });
  })
});

module.exports = router;