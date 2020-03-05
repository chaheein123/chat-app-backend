const {
  router,
  client,
  io
} = require("../index");

const verifyToken = require("../services/verification");

io.of("/friendsIo").on("connect", socket => {
  socket.emit("requestIdFromServer");
  socket.on("idToServer", data => {
    socket.join(Number(data));
  })
})

// Find users from friends feature
router.post("/findusers", (req, res) => {
  let allusers;
  let requestSentUsers;
  let requestReceivedUsers;
  let friends;

  let ownId = verifyToken(req.body.userid, req.body.usertoken);

  client.query('SELECT useremail, username, imgurl,id FROM users WHERE NOT id = $1', [ownId], (err, result) => {

    if (err) {
      console.log(err);
      res.send(err);
    } else {
      allusers = result["rows"];
      client.query(`SELECT DISTINCT useremail FROM user_friends INNER JOIN users ON users.id = user_friends.friend_id WHERE user_id=${ownId} AND status='Request sent'`, (err, result) => {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          requestSentUsers = result["rows"];
          client.query(`SELECT DISTINCT useremail FROM user_friends INNER JOIN users ON users.id = user_friends.friend_id WHERE user_id=${ownId} AND status='Request received'`, (err, result) => {
            if (err) {
              console.log(err);
              res.send(err)
            } else {
              requestReceivedUsers = result["rows"];
              client.query(`SELECT DISTINCT useremail FROM user_friends INNER JOIN users ON users.id = user_friends.friend_id WHERE user_id=${ownId} AND status='Friends'`, (err, result) => {
                if (err) {
                  console.log(err);
                  res.send(err)
                } else {
                  friends = result["rows"];
                  res.json({
                    allusers,
                    requestSentUsers,
                    requestReceivedUsers,
                    friends
                  })
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
  let friendemail = req.body.friendemail;
  let friendid;
  let ownId = verifyToken(req.body.userid, req.body.usertoken);

  client.query('SELECT id FROM users WHERE useremail=$1', [friendemail], (err, result) => {

    if (err) {
      console.log(err);
      res.send(err);
    } else {
      friendid = result["rows"][0]["id"];
      client.query(`INSERT INTO user_friends(user_id, friend_id, status) VALUES(${ownId}, ${friendid},'Request sent'); INSERT INTO user_friends(user_id, friend_id, status) VALUES(${friendid}, ${ownId},'Request received') RETURNING *`, (err, result) => {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          res.end();
        }
      })
    }
  })
})

// Handles request to cancel friend request
router.delete("/cancelrequest", (req, res) => {

  let friendemail = req.body.friendemail;
  let friendid;

  let ownId = verifyToken(req.body.userid, req.body.usertoken);

  client.query('SELECT id FROM users WHERE useremail=$1', [req.body.friendemail], (err, result) => {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      friendid = result["rows"][0]["id"];
      client.query(`DELETE FROM user_friends WHERE user_id=${ownId} AND friend_id=${friendid}; DELETE FROM user_friends WHERE user_id=${friendid} AND friend_id=${ownId}`, (err, result) => {
        if (err) {
          console.log(err);
          res.send(err)
        } else {
          res.end();
        }
      })
    }
  })
});

router.put("/acceptrequest", (req, res) => {

  let friendid;
  let chatroomid;

  let ownId = verifyToken(req.body.userid, req.body.usertoken);

  client.query('SELECT id FROM users WHERE useremail=$1', [req.body.friendemail], (err, result) => {
    if (err) {
      console.log(err, "error in the accept request trying to find the id of the friend with friend email");
      res.send(err);
    } else {
      friendid = result.rows[0]["id"];
      client.query(`UPDATE user_friends SET status='Friends' WHERE user_id=${ownId} AND friend_id=${friendid}; UPDATE user_friends SET status='Friends' WHERE user_id=${friendid} AND friend_id=${ownId}`);

      client.query(`INSERT INTO chatrooms(population, user_id) VALUES (DEFAULT, ARRAY[${ownId}, ${friendid}]) RETURNING id`, (err, result) => {
        if (err) {
          console.log(err);
          res.end();
        } else {
          chatroomid = result["rows"][0]["id"];

          client.query(`INSERT INTO user_chatroom(userid, friendid, chatroomid) VALUES(${ownId}, ${friendid}, ${chatroomid}); INSERT INTO user_chatroom(friendid, userid, chatroomid) VALUES(${ownId}, ${friendid},${chatroomid}); SELECT username, imgurl from users WHERE useremail = '${req.body.friendemail}'`, (err, result) => {
            if (err) {
              console.log(err);
              res.end();
            } else {
              let friendRightData = { username: result[2].rows[0].username, useremail: req.body.friendemail, chatroomid, imgurl: result[2].rows[0].imgurl };
              io.of("/friendsIo").to(Number(req.body.userid)).emit("acceptedRequest", friendRightData);
              res.end();
            }
          })
        }
      })
    }
  })
});

// Handles request to find recommended users to add as friends upon FriendLeft component mounting
router.get("/:id/allOtherUsers", (req, res) => {
  let ownId = req.params.id;
  let recommendedUsers;
  let pendingUsers;
  let userFriends = new Set();
  let pendingUsersSet = new Set();

  client.query(`SELECT DISTINCT useremail, username, id, imgurl FROM users WHERE NOT id = ${ownId}`, (error, result) => {
    if (error) {
      console.log(error);
      res.end()
    } else {
      recommendedUsers = result.rows;
      client.query(`SELECT * FROM user_friends INNER JOIN users ON user_friends.friend_id = users.id WHERE user_id = ${ownId} and status = 'Request received'`, (err, result) => {
        if (err) {
          console.log(error);
          res.end()
        } else {
          pendingUsers = result.rows;
          client.query(`SELECT friend_id FROM user_friends WHERE user_id = ${ownId}`, (err, result) => {
            if (err) {
              console.log(err);
              res.end()
            } else {
              for (let friend in result.rows) {
                userFriends.add(result.rows[friend]["friend_id"])
              };
              recommendedUsers = recommendedUsers.filter(user => !userFriends.has(user.id));
              recommendedUsers.sort(() => Math.random() - 0.5);
              res.json({
                recommendedUsers,
                pendingUsers
              });
            }
          })
        }
      });
    }
  });
});

router.get("/:id/allfriends", (req, res) => {

  let ownId = Number(req.params.id);
  client.query(`SELECT * FROM user_friends INNER JOIN users ON user_friends.friend_id = users.id WHERE user_friends.user_id =${ownId} AND user_friends.status = 'Friends'`, (err, result) => {
    if (err) {
      console.log(err);
      res.end();
    } else {
      res.json({
        friends: result.rows
      })
    }
  })
});

router.get("/allFriends", (req, res) => {
  let ownId = Number(req.query.ownId);
  verifyToken(ownId, req.query.userToken);
  client.query(`SELECT DISTINCT user_chatroom.chatroomid, users.useremail, users.username, users.imgurl FROM user_chatroom INNER JOIN users ON user_chatroom.friendid = users.id WHERE user_chatroom.userid = ${ownId}`, (err, result) => {
    if (err) {
      console.log(err);
      res.end()
    }
    else {
      res.json({
        friends: result.rows
      })
    }
  })
})

module.exports = router;