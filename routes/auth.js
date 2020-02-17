const {
  router,
  jwt,
  client
} = require("../index");

// sign up
router.post("/signup", (req, res) => {
  client.query(`SELECT * FROM users WHERE useremail='${req.body.email}'`, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      if (result.rows.length != 0) {
        res.json({
          errorEmail: `${req.body.email} is already in use`
        })
      } else {
        client.query(`INSERT INTO users(useremail, userpw) VALUES('${req.body.email}', '${req.body.pw}'); SELECT id, useremail FROM users WHERE useremail='${req.body.email}'`, (err, result) => {
          if (err) {
            res.send(err)
          } else {
            let token = jwt.sign({
              email: result[1]["rows"][0]["useremail"],
              id: result[1]["rows"][0]["id"]
            }, "shhh");
            res.json({
              token,
              id: result[1]["rows"][0]["id"]
            });
          }
        })
      }
    }
  });
});

// Checking for the localStorage
router.post("/authenticate", (req, res) => {
  jwt.verify(req.body.userToken, 'shhh', function (err, decoded) {
    if (err || req.body.userid != decoded.id) {
      throw "Invalid token";
      res.end();
    } else {
      res.end();
    }
  });
});

// Login
router.post("/login", (req, res) => {
  client.query(`SELECT * FROM users WHERE useremail='${req.body.email}'`, (err, result) => {
    if (err) {
      res.json({
        errorEmail: "Something went wrong checking the email"
      })
    } else {
      // if email does not exist, send error msg 
      if (!result.rows.length) {
        res.json({
          errorEmail: `${req.body.email} doesn't exist`
        })
      }
      // if email does exist, then check for the password in the DB
      else {
        client.query(`SELECT * FROM users WHERE userpw='${req.body.pw}' AND useremail='${req.body.email}'`, (err, result) => {
          if (err) {
            res.json({
              errorPW: "Something went wrong while checking the password"
            })
          } else {
            if (result.rows.length == 1) {
              let token = jwt.sign({
                email: result["rows"][0]["useremail"],
                id: result["rows"][0]["id"]
              }, "shhh");

              res.json({
                token,
                id: result["rows"][0]["id"]
              });
            } else {
              res.json({
                errorPw: "Incorrect password"
              })
            }
          }
        })
      }

    }
  })
})

module.exports = router;