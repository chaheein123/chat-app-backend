const {
  app,
} = require("./index");

// **************** Routes ****************
app.use("/auth", require("./routes/auth"));
app.use("/friends", require("./routes/friends"));
app.use("/chats", require("./routes/chats"));
app.use("/portrait", require("./routes/portrait"));