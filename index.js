const express = require("express");
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cors = require("cors");
// body parser middleware
const bodyParser = require('body-parser');
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());
app.use(cors());

module.exports = {
  app,
  server,
  io
}