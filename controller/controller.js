const User = require("../models/User");
const Upload = require("../models/Uploads");
const multer = require("multer");
const fs = require('fs');
if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require('path');
var zip=require('express-zip');
const merge = require('easy-pdf-merge');

module.exports.createUser = async (req, res) => {
  try {
    const { email, password, role, username } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    console.log("user created", user);
    res.json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports.getCredentials = async (req, res, next) => {
  try {
    const { email,role } = req.user;
    var credentials={};
    if (role=="admin"){
      credentials = await Upload.find().exec();
    }
    else{
      credentials = await Upload.find({email}).exec();
    }
    res.json({
      message: "Credentials found",
      credentials,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports.createStuCredentials = async (req, res, next) => {
  console.log("Perfectionist");
  try {
    const {
      //email, //where do i even get this from
      // category,
      Achievement_Type,
      Publish_Date,
      Achievement_Title,
      Achievement_Details,
      Student_Name,
      Student_Reg,
      Student_Branch,
      Student_Batch,
    } = req.body;
    email = req.user.email;
    Faculty_Incharge=req.user.username;
    const uploadedFiles = [];
    
    req.files.forEach((f) => {
      console.log(f.path);
      uploadedFiles.push(f.path);
    });
    console.log(Student_Branch);
    const credential = await Upload.create({
      email,
      category:"student",
      Achievement_Type,
      Publish_Date,
      Achievement_Title,
      Achievement_Details,
      files: uploadedFiles, //change upload model to file= array of strings//done
      Student_Name,
      Student_Reg,
      Student_Branch,
      Student_Batch,
      Faculty_Incharge,
    });
    //console.log("student credential created", credential);
    res.status(200).json({ message: "Data Uploaded Successfully" });
  } catch (error) {
    // console.error("Error uploding student credential:", error);
    res.status(500).json({
      error: "Internal Server Error",
      "Error uploding student credential": error,
    });
  }
  // res.redirect("/");
};
module.exports.createFacCredentials = async (req, res, next) => {
  console.log("Faculty_Detials");
  try {
    const {
      //email,
      // category,
      Achievement_Type,
      Publish_Date,
      Achievement_Title,
      Achievement_Details,
    } = req.body;
    email = req.user.email;
    Faculty_Incharge=req.user.username;
    const uploadedFiles = [];
    req.files.forEach((f) => {
      uploadedFiles.push(f.path);
    });
    const credential = await Upload.create({
      email,
      category:"faculty",
      Achievement_Type,
      Publish_Date,
      Achievement_Title,
      Achievement_Details,
      files: uploadedFiles,
      Faculty_Incharge,
    });
    //console.log("Faculty Credential created", credential);
    res.status(200).json({ message: "Data Uploaded Successfully" });
  } catch (error) {
    // console.error("Error uploding faculty credential:", error);
    res.status(500).json({
      "Error uploding faculty credential:": error,
      error: "Internal Server Error",
    }
    );
  }
};

module.exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid Email" });
    }

    // const isPasswordValid = user.matchPassword(password);
    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid Password" });
    }
    const exp =
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000;

    const token = jwt.sign({ user, exp }, process.env.JWT_SECRET);

    const options = {
      expires: new Date(exp),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    res.status(200).cookie("token", token, options).json({
      message: "Login successful",
      success: true,
      token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.checkAuth = (req, res) => {
  console.log(req.user);
  res.status(200).json({ message: "success" });
};

module.exports.logoutUser = async (req, res, next) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out Successfully" });
};

module.exports.dwdCredentials =async (req, res) => {
  const fileListParam = req.query.fileList;
  const fac=req.query.fac;
  const title=req.query.title;

  // Split the comma-separated string to get back the array
  const fileList = fileListParam.split(',');
  try {
    //console.log("I am here");
    let fileObjArray = [];
    fileList.forEach((file,index) => {
      const lastDotIndex = file.lastIndexOf('.');
      const fileType = file.substring(lastDotIndex + 1);
      let splitStr = file.split("\\");
      const name = splitStr[splitStr.length - 1];
      let fileObj = {
        path: path.join(__dirname, `../${file}`),
        name: `${index}_${title}_${fac}.${fileType}`,
      };
      fileObjArray.push(fileObj);
    });
    console.log(fileObjArray);
    res.zip(fileObjArray);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};



module.exports.dwdAllCredentials =async (req, res) => {
  const fileListParam = req.query.fileList;
  const name_Param=req.query.nameParam;
  // Split the comma-separated string to get back the array
  const fileList = fileListParam.split(",");
  const name=name_Param.split(",");
  try {
    //console.log("I am here");
    let fileObjArray = [];
    fileList.forEach((file,index) => {
      const lastDotIndex = file.lastIndexOf('.');
      const fileType = file.substring(lastDotIndex + 1);
      let fileObj = {
        path: path.join(__dirname, `../${file}`),
        name: `${index}_${name[index]}.${fileType}`,
      };
      fileObjArray.push(fileObj);
    });
    res.zip(fileObjArray);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports.dwdCombinePdf =async (req, res) => {
  const fileListParam = req.query.fileList;
  const name_Param=req.query.nameParam;
  // Split the comma-separated string to get back the array
  const fileList = fileListParam.split(",");
  const name=name_Param.split(",");
  try {
    //console.log("I am here");
    let fileObjArray = [];
    fileList.forEach((file) => {
      const lastDotIndex = file.lastIndexOf('.');
      const fileType = file.substring(lastDotIndex + 1);
      data=path.join(__dirname, `../${file}`);
      if (fileType=="pdf"){
        fileObjArray.push(data);
      }
    });
    //console.log(fileObjArray);
    merge(fileObjArray, 'File_Merged.pdf', function (err) {
      if (err) {
          return console.log(err)
      }
      console.log('Successfully merged!')
  });

  const filePath = path.join(__dirname, '../File_Merged.pdf');
  //console.log(filePath);
  console.log(filePath);
  res.download(filePath, function (err) {
    console.log(err);
});
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};


//Users/lovelakhwani/Downloads/erp-backend-main-2/uploads/658c3c0831a0203448c985e6/1706845201739-love_lakhwani.pdf


///Users/lovelakhwani/Downloads/erp-backend-main-2/controller/File_Merged.pdf
///Users/lovelakhwani/Downloads/erp-backend-main-2/File_Merged.pdf