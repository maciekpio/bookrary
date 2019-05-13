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

function connect(req){
  if(req.session.username){
    if(req.session.admin){
      return req.session.username+" (Admin)";
    }else{
      return req.session.username;
    }
  }else{
    return "Se connecter";
  }

}

function visible(req){
  if(req.session.admin){
    return "visible";
  }else{
    return "invisible"
  }
}

app.get('/', (req, res) => {
  MongoClient.connect('mongodb://localhost:27017', (err, baseD) => {
    if (err) throw err;
    var db = baseD.db("Bibliothèque");
    var colLivre=db.collection('livreCol').find();
    var tab=[];
    //cree un tableau depuis la base de donnee
    colLivre.forEach(function(livre, err){
      if(!livre.reserved){
        tab.push(livre);
      }
    }, function(){
      //met le nom de l'utilisateur si il existe sinon met qu'il n est pas log
      baseD.close();
      res.render('views/index.html', {array: tab, username: connect(req), date: "25 aout", Visibylity: visible(req) });
    });
  });
});

app.get('/connexion', (req, res) => {
      if(req.session.username){
        res.render('views/GestionCompte.html', { username: connect(req) || "Se connecter"});
      }else{
        res.render('views/Connextion.html', { username: connect(req) || "Se connecter"});
      }
});

app.get('/deconexion', (req, res) => {
  req.session.username=null;
  req.session.admin=null;
  res.redirect('/');
});

app.get('/ajoutDeLivre', (req, res) => {
  if(req.session.admin){
    res.render('views/AjoutDeLivre.html', { username: connect(req) || "Se connecter"});
  }else{
    res.redirect('/');
  }
});



app.post('/newutilisateur' , (req,res) => {
    MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
      if(err) throw err;
      var db = baseD.db("Bibliothèque");
      var newUtilisateur= {pseudo: req.body.nomUtilisateur , mdp: req.body.mdp1Utilisateur, eMail: req.body.mailUtilisateur , admin: false};

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
            req.session.admin = false;
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

      db.collection("utilisateurCol").findOne({pseudo: req.body.nomCUtilisateur },(err , utilisateur) => {
          if(err) throw err;
          if(utilisateur.pseudo ==req.body.nomCUtilisateur && req.body.mdpUtilisateur == utilisateur.mdp){
            req.session.username = utilisateur.pseudo;
            req.session.admin = utilisateur.admin;
            baseD.close();
            res.redirect('/');
          }else{
            baseD.close();
            res.redirect('/connexion')
          }
      });

    });
});

app.post('/upgrade' ,(req,res) => {
    MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
      if(err) throw err;
      var db = baseD.db("Bibliothèque");

      if(req.body.upgradeToAdmin == "123456"){
          db.collection("utilisateurCol").updateOne({pseudo: req.session.username },{$set: {admin: true}},function(err, res) {
            if (err) throw err;
          });
          req.session.admin = true;
          res.redirect('/');
          baseD.close();
      }else{
        baseD.close();
        res.redirect('/connexion');
      }
    });
});

app.post('/newLivre' , (req,res) => {
    MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
      if(err) throw err;
      var db = baseD.db("Bibliothèque");
      var newLivre= {titre: req.body.titreLivre , auteur: req.body.auteurLivre, edition: req.body.editionLivre ,
         date: req.body.dateLivre, checkboxNom: req.body.titreLivre+req.body.auteurLivre, reserved: false};

      db.collection("livreCol").findOne({titre: newLivre.titre , auteur: newLivre.auteur} , (err , livre) => {
          if(err) throw err;
          if(livre){
            baseD.close();
            res.redirect('/ajoutDeLivre');
          }else{
            db.collection("livreCol").insertOne(newLivre, function(err, res) {
          				if (err) throw err;
      			});
            baseD.close();
            res.redirect('/');
          }
      });
    });
});



app.get('*', (req, res) => {
    res.status(404).send('404 Page Not Found');
});


app.listen(8080);
console.log('Express server started on port 8080');
