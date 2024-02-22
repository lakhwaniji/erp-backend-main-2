const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user._id);
    req.user = user;
    // console.log(req.user);
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Error while Authorization, Login again" });
  }
};

module.exports = getUser;
