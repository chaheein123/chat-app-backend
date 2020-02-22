const {
  jwt
} = require("../index");

const verifyToken = (ownId, token) => {
  jwt.verify(token, "shhh", (err, decoded) => {
    if (err || (decoded.id != ownId)) {
      console.log(ownId, decoded.id, "hahahaha");
      throw "Authentication failed";
    }
  });
  return ownId;
};

module.exports = verifyToken;
