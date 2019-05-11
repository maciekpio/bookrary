let MongoClient = require('mongodb').MongoClient;
let Server = require('mongodb').Server;
let express = require('express');
let consolidate = require('consolidate');
let app = express ();
let bodyParser = require("body-parser");
let https = require('https');
let fs = require('fs');


app.engine('html', consolidate.swig);
app.set('view engine', 'html');
app.set('views', __dirname);

// ceci permet de rajouter le dossier principal
let publicDir = require('path').join(__dirname,'');
app.use(express.static(publicDir));

app.use(bodyParser.urlencoded({ extended: true }));
//app.use(session({
//secret: "propre123",
//  resave: false,
//  saveUninitialized: true,
//  cookie: {
//    path: '/',
//    httpOnly: true,
  //  maxAge: 3600000
//  }
//}));


app.get('/', (req, res) => {
  MongoClient.connect('mongodb://localhost:27017', (err, db) => {
    if (err) throw err;
    //var dbo = db.db("dbi");
    ////var finder=dbo.collection('incidents').find();
  //  var t_array=[];
    //cree un tableau depuis la base de donnee
    //finder.forEach(function(doc, err){
      //t_array.push(doc);
    //}, function(){
      //met le nom de l'utilisateur si il existe sinon met qu'il n est pas log
      db.close();
      res.render('views/index.html', { username: "emilien" || "Se connecter", date: "25 aout"});
    //});
  });
});

app.get('*', (req, res) => {
    res.status(404).send('404 Page Not Found');
});


app.listen(8080);
console.log('Express server started on port 8080');
