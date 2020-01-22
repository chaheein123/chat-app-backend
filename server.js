const express = require("express");
const app = express();
const pg = require("pg");

// body parser middleware
const bodyParser = require('body-parser');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connecting the Postgresql
const { Client } = require("pg");
const connectionString = "postgres://postgres:root@localhost:5432/chat-app";

const client = new Client({
  connectionString: connectionString
});
client.connect();

// **************** Routes ****************
app.use("/auth", require("./routes/auth"));


app.post("/", (req, res) => {
  client.query('SELECT * FROM users', (err, result) => {
    if (err) {
      console.log(err)
    }
    res.status(200).send(result.rows);
  });
  console.log(req.body);
  // res.send("yoyo wussup?");
});





const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`)
});
