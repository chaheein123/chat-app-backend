const {
  router,
  client
} = require("../index");

router.post("/saveImg", (req, res) => {
  client.query(`UPDATE users SET imgurl='${req.body.imgUrl}' WHERE users.id = ${req.body.ownId}`, (err, result) => {
    if (err) {
      console.log(err);
      res.end();
    } else {
      res.send(req.body.imgUrl)
    }
  })
});

router.get("/getImg", (req, res) => {
  client.query(`SELECT imgurl FROM users WHERE users.id = ${req.query.ownId}`, (err, result) => {
    res.send(result.rows[0].imgurl)
  })
})

module.exports = router;