const express = require("express");
const app = express();
const pg = require("pg");
const cors = require("cors");

// body parser middleware
const bodyParser = require('body-parser');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Connecting the Postgresql
const { Client } = require("pg");
const connectionString = "postgres://postgres:root@localhost:5432/chat-app";

const client = new Client({
  connectionString: connectionString
});
client.connect();

// **************** Routes ****************
app.use("/auth", require("./routes/auth"));
app.use("/friends", require("./routes/friends"));


// app.post("/", (req, res) => {

// });

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`)
});
