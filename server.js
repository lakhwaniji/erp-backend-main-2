const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const apiRoutes = require("./routes/routes");
if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const app = express();
app.use(function(req,res,next){
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin','http://192.168.170.13:3000');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
})
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//connnect to DB
connectDB();

//Routes
app.use("/", apiRoutes);
app.get("/", (req, res) => {
  res.send("Running server");
});

//starting server
const port = 8000;
app.listen(port,"0.0.0.0",() => {
  console.log(`server running on port ${port}`);
});
