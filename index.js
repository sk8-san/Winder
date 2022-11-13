const express = require('express');
const app = express();
const http = require('http');
const { default: mongoose } = require('mongoose');
const server = http.createServer(app);
const { Server } = require("socket.io");
const connectDB = require('./db');
const io = new Server(server);
const userSchema = require("./models/user-model");
const session = require("express-session");
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: "Keep it secret",
    name: "uniqueSessionID",
    saveUninitialized: false,
    resave: true,
  })
);

connectDB();

const userModel = mongoose.model("User", userSchema);

app.get("/",(req,res)=>{
  res.sendFile(__dirname + "/frontend/login.html");
})

app.get('/home', (req, res) => {
  if(req.session.loggedIn){
    res.sendFile(__dirname + '/frontend/index.html');
    return;
  }
  res.redirect("/");
});

app.get('/register',(req,res)=>{
  res.sendFile(__dirname + '/frontend/register.html');
})



app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const myuser = new userModel({
    email,
    password
  });
  myuser.save();
  res.sendFile(__dirname + '/frontend/login.html');
})

app.post("/login",(req,res)=>{
  const { email, password } = req.body;
  console.log(email,password);
  userModel.findOne({'email':email,'password' : password},(err,user)=>{
    if(err) {
      res.status(500).send("Server Error");
    }
    else{
      if(!user){
        res.status(404).send("User not found");
        return;
      }
      req.session.loggedIn = true;
      res.cookie("email",email);
      res.redirect("/home");
    }
  });
})

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('typing', (msg) => {
    console.log("You are typing " + msg);
  })
  socket.on("msg", (msg) => {
    console.log(msg);
    io.emit("msg",msg);
  })
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});