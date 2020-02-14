const {
  app,
  io,
  server
} = require("./index");

const pg = require("pg");

// Connecting the Postgresql
const {
  Client
} = require("pg");
const connectionString = "postgres://postgres:root@localhost:5432/chat-app";

const client = new Client({
  connectionString: connectionString
});
client.connect();

// **************** Routes ****************
app.use("/auth", require("./routes/auth"));
app.use("/friends", require("./routes/friends"));
app.use("/chats", require("./routes/chats"));

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`Server started on port ${port}`)
});