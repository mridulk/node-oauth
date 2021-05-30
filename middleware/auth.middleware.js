const jwt = require('jsonwebtoken');
const { JWT_SECRET , COOKIE_NAME } = process.env;
const verifyToken = async(req, res, next) => {
  //fetching token
  const token=req.cookies[COOKIE_NAME]
  try {
    if (token == null) {
      return res.sendStatus(401);
    }
    const user=await jwt.verify(token, JWT_SECRET);
    req.user=user;
    next();
  } catch (error) {
      return res.status(500).json(err.toString());
  }
  
};
module.exports = verifyToken;
