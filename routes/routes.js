const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const getUser = require("../middleware/getUser");
const multer = require("multer");
const fs = require("fs");


if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    path = req.user._id; //change as needed
    try {
      if (!fs.existsSync(`./uploads/${path}`)) {
        fs.mkdirSync(`./uploads/${path}`);
        console.log("New Directory created successfully !!");
      }
    } catch (err) {
      console.error(err);
    }

    return cb(null, `./uploads/${path}`);
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const {
  createUser,
  loginUser,
  logoutUser,
  getCredentials,
  dwdCredentials,
  createFacCredentials,
  createStuCredentials,
  dwdAllCredentials,
  dwdCombinePdf,
  checkAuth,
} = require("../controller/controller");

router.post("/createUser", createUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/check-auth", checkAuth);
router.get("/getCredentials",getUser, getCredentials);
router.get("/dwdCredentials",requireAuth,dwdCredentials);
router.get("/dwdAllCredentials",requireAuth,dwdAllCredentials);
router.get("/dwdCombinePdf",requireAuth,dwdCombinePdf);
router.post(
  "/createStuCredentials",
  //add middleware to 1. find the user in mongo 2.append it to req to pass to multer middleware
  getUser,
  upload.array("files", (maxCount = process.env.MAX_FILES)), //multer middleware current maxcount set to 10 change when needed here.
  createStuCredentials
);
router.post(
  "/createFacCredentials",
  getUser,
  upload.array("files", (maxCount = process.env.MAX_FILES)),
  createFacCredentials
);

module.exports = router;
