const express = require('express');
const mongoose = require('mongoose');
const Schema = mongoose.Schema; 
const bodyParser = require('body-parser');
const net = require('net');

const app = express();
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.urlencoded({
    extended: true
  }));


app.use(bodyParser.urlencoded({extended: false}));
const connectDB = async() => {
   try{
       await mongoose
           .connect("mongodb://mongodb:27017/mongodb",
           {
               useUnifiedTopology: true,
               useNewUrlParser: true
       });
       console.log("CONNECTED!!!");
   }
   catch (err){
       console.error(err);
   }
}
connectDB();

const ItemSchema = new Schema({
   id: {
       type: Number,
       requier: true
   },
   min: {
       type: Number,
       require: true
   },
   max: {
       type: Number,
       require: true
   },
   avg: {
       type: Number,
       require: true
   }
}, {collection: "numbers"});

const Data = mongoose.model('nubmers',ItemSchema)

var minValue = 0;
var avgValue = 0;
var maxValue = 0;


var loggedIn = false

app.all('/logIn', (req, res) =>{
    if(loggedIn){
      res.redirect("/home");
    }
    res.render("logIn");
  });

app.all('/logout', (req, res) =>{
    loggedIn = false;
    console.log("USER_APP: Logged Out...");
    res.render("logIn");
  });
  
app.post('/logInData', (req, res, next)=>{
    var userName = req.body.userName;
    var password = req.body.password;

    const socket = new net.Socket();
    var client = net.connect({host: "authenticator", port: 6000});

    client.on('connect', function(){
        console.log("USER_APP: Connected Authentication Service...");
        client.write(`{"UserName":"${userName}", "Password":"${password}"}`);
    });

    client.on("data", function(data){
        var flag = data.toString();
        if(flag == "yes"){
            loggedIn = true;
            console.log("USER_APP: Logged In Successfully...");
            res.redirect('/home');
            next();
        }
        else{
            res.render("logIn");
        }
    });
});

app.all('/', (req, res)=>{
    if(loggedIn){
        res.redirect('/home');
    }
    else{
        res.redirect("/logIn");
    }
});

app.get('/home', function (req, res) {
    if(!loggedIn){
        res.redirect("/logIn");
      }
  
    res.render("index", {
        min: minValue,
        avg: avgValue,
        max: maxValue,
        msg:"Welcome to our website ^_^"
    });
})


app.get('/fetch', function (req, res) {
    if(!loggedIn){
        res.redirect("/logIn");
      }
    Data.findOne()
        .then((result) =>{
            maxValue = result["max"];
            minValue = result["min"];
            avgValue = result["avg"]
        })
        .then(() => {
            if(avgValue == -1)
                res.render("index", {max:"", min:"", avg:"", msg:"There are not data!"});
            else{
                console.log("USER_APP: Data fetched Successfully ^_^")
                res.render("index", {
                    max:maxValue,
                    min:minValue,
                    avg:avgValue,
                    msg:"Data fetched successfully ^_^"
                    })
            }
        });
})

mongoose.connection.once('open', () => {
    console.log("We are connected to the database ^_^");
    app.listen(3002);
    console.log("listening on port 3002")
})

