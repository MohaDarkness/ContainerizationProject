const express = require('express')
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const net = require('net');


const mysqlConfig = {
  host: "mysql_server",
  user: "dan",
  password: "secret",
  database: "test_db",
  port: "3306"
}

let con = null

const app = express()
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.urlencoded({
  extended: true
}));

function connect(){
  con =  mysql.createConnection(mysqlConfig);
  con.connect(function(err) {
    if (err) throw err;
  });
}

function create_table(){
  con.connect(function(err) {
    if (err) throw err;
    const sql = `
    CREATE TABLE IF NOT EXISTS numbers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      number INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )  ENGINE=INNODB;
  `;
    con.query(sql, function (err, result) {
      if (err) throw err;
    });
  });
}

function fetch(res, msg){
  con.connect(function(err) {
    if (err) console.log("Can't fetch, something wrong!");
    const sql = `SELECT number FROM numbers`
    con.query(sql, function (err, result, fields) {
      if (err) console.log("Can't fetch, something wrong!");
      var data = [];
      var number;
      for(var i = 0; i < result.length; i++){
        number = result[i]['number'];
        data.push(number);
      }

      var client = net.connect({host: "analytics-service", port: 65432});
      client.on('data', function(){
        console.log("ADMIN: Sent To Analitics");
        client.destroy();
        res.render('index', {msg:msg, data:data});
      });
    });
  });
}

var loggedIn = false;

app.all('/', (req, res, next) => {
  if(loggedIn){
      res.redirect(`http://${req.hostname}:3000/home`);
  }
  else{
      res.redirect(`http://${req.hostname}:3000/logIn`);
  }
});

app.all('/logIn', (req, res) =>{
  if(loggedIn){
    res.redirect("/home");
  }
  res.render("logIn");
});

app.all('/logout', (req, res) =>{
  loggedIn = false;
  res.render("logIn");
});

app.post('/logInData', (req, res, next)=>{
  console.log("Inside logInData in index.js");
  var userName = req.body.userName;
  var password = req.body.password;

  const socket = new net.Socket();
  var client = net.connect({host: "authenticator", port: 6001});

  client.on('connect', function(){
      console.log("Connected to autheticator..");
      client.write(`{"UserName":"${userName}", "Password":"${password}"}`);
  });

  client.on("data", function(data){
      var flag = data.toString();
      console.log(flag);
      if(flag == "yes"){
          loggedIn = true;
          res.redirect('/home');
          next();
      }
      else{
          res.render("logIn");
          next();
      }
  });
});

app.all('/home', function (req, res, next) {
  if(!loggedIn){
    res.redirect("/logIn");
  }
  
  console.log('Connecting to database...');
  
  try{
    connect(); 
  }catch{
    console.log("ADMIN: @@@ couldn't connect to database!!")
  }
    
  

  console.log("ADMIN: Connected to MySQL..");
  create_table(); console.log("ADMIN: Database Created if not already existed..")
  var message = "Welcome To The Admin Website ^_^"

  fetch(res, message);
});

app.post('/insert', function (req, res) {
  if(!loggedIn){
    res.redirect("/logIn");
  }
  const number = req.body.number;
  con.connect(function(err) {
    if (err) throw err;
    const sql = `INSERT INTO numbers (number) VALUES (${number})`
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log(`ADMIN: ${number} inserted into table...`);
      var message = `${number} inserted into table.`
      fetch(res, message);
    });
  })
});

app.get('/insertRandom', function (req, res) {
  if(!loggedIn){
    res.redirect("/logIn");
  }
  const number = Math.round(Math.random() * 100)
  con.connect(function(err) {
    if (err) throw err;
    const sql = `INSERT INTO numbers (number) VALUES (${number})`
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log(`ADMIN: ${number} inserted into table...`);
      var message = `${number} inserted into table.`
      fetch(res, message);
    });
  })
});

app.get('/fetch', function (req, res) {
  if(!loggedIn){
    res.redirect("/logIn");
  }
  con.connect(function(err) {
    if (err) console.log("Can't fetch, something wrong!");
    const sql = `SELECT number FROM numbers`
    con.query(sql, function (err, result, fields) {
      if (err) console.log("Can't fetch, something wrong!");
      res.send(JSON.stringify(result))
    });
  });
})

app.post('/deleteAll', function (req, res) {
  if(!loggedIn){
    res.redirect("/logIn");
  }
  con.connect(function(err) {
    if (err) console.log("Can't connect, something wrong!");
    const sql = `DELETE FROM numbers;`
    con.query(sql, function (err, result, fields) {
      if (err) console.log("Can't fetch, something wrong!");
      console.log("ADMIN: Erased All Data Successfully...")
      var client = net.connect({host: "analytics-service", port: 65432});

      client.on('data', function(){
        console.log("ADMIN: Sent To Analitics");
        client.destroy();
        res.render('index', {msg:"Data erased successfully...", data:""})
      });
      
    });
  });
})

app.listen(3000);
console.log("Listing on port 3000");




