let MongoClient = require('mongodb').MongoClient;
let Server = require('mongodb').Server;
let express = require('express');
let consolidate = require('consolidate');
let app = express ();
let bodyParser = require("body-parser");
let https = require('https');
let fs = require('fs');
let session = require('express-session');


app.engine('html', consolidate.swig);
app.set('view engine', 'html');
app.set('views', __dirname);

// ceci permet de rajouter le dossier principal
let publicDir = require('path').join(__dirname,'');
app.use(express.static(publicDir));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
secret: "shhhhh",
  resave: false,
  saveUninitialized: true,
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: 3600000
  }
}));

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
      res.render('views/index.html', { username: req.session.username || "Se connecter", date: "25 aout"});
    //});
  });
});

app.get('/connexion', (req, res) => {
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
      res.render('views/Connextion.html', { username: req.session.username || "Se connecter"});
    //});
  });
});

app.post('/newutilisateur' , (req,res) => {
    MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
      if(err) throw err;
      var db = baseD.db("Bibliothèque");
      var newUtilisateur= {pseudo: req.body.nomUtilisateur , mdp: req.body.mdp1Utilisateur, eMail: req.body.mailUtilisateur};

      db.collection("utilisateurCol").findOne({pseudo: newUtilisateur.pseudo} , (err , utilisateur) => {
          if(err) throw err;
          if(utilisateur){
            baseD.close();
            res.redirect('/connexion');
          }else{
            db.collection("utilisateurCol").insertOne(newUtilisateur, function(err, res) {
          				if (err) throw err;
      			});
            req.session.username = newUtilisateur.pseudo;
            baseD.close();
            res.redirect('/')
          }
      });
    });
});

app.post('/dejainscrit' ,(req,res) => {
    MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
      if(err) throw err;
      var db = baseD.db("Bibliothèque");

      db.collection("utilisateurCol").findOne({pseudo: req.body.pseudo} , (err , utilisateur) => {
          if(err) throw err;
          if(utilisateur && req.body.mdpUtilisateur == utilisateur.mdp){
            req.session.username = utilisateur.pseudo;
            baseD.close();
            res.redirect('/');
          }else{
            baseD.close();
            res.redirect('/connexion')
          }
      });

    });
});



app.get('*', (req, res) => {
    res.status(404).send('404 Page Not Found');
});


app.listen(8080);
console.log('Express server started on port 8080');
