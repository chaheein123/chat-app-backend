const {
  jwt
} = require("../index");

const verifyToken = (ownId, token) => {
  jwt.verify(token, "shhh", (err, decoded) => {
    if (err || !decoded || (decoded.id != ownId)) {
      throw "Authentication failed";
    }
  });

  return ownId;
};

module.exports = verifyToken;
