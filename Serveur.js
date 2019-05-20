
//======================================================================= Paramétrage ================================================================================================

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

//=============================================================================================================================================================================================

//================================================================== Gestion de la date ======================================================================================================


var date = new Date();
var tabMois=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
var tabJours=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"]
var jour = date.getDay()
var jourNm = date.getDate();
var mois = date.getMonth();
var annee = date.getFullYear();
var dateString= "le "+tabJours[jour]+" "+ jourNm+" "+tabMois[mois]+" "+annee;

//=============================================================================================================================================================================================

//============================================= Methode pour les text multiple (quand il peux y avoir plus text a une même place)===========================================================================================



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

function visibleAdmin(req){
  if(!req.session.admin){
    return "visible";
  }else{
    return "invisible";
  }
}

function visibleConnecter(req){
  if(req.session.username){
    return "visible";
  }else{
    return "invisible"
  }
}

function visibleConnecterAdmin(req){
  if(req.session.username && !req.session.admin){
    return "visible";
  }else{
    return "invisible"
  }
}

function statusResevationLivre(req){
  if(req.session.admin){
    return "A été rendu";
  }else{
    return "Réserver"
  }
}

function actionDeReservation(req){
  if(!req.session.admin){
    return "reserver";
  }else{
    return "rendu"
  }
}

function admin(req){
  if(req.session.admin){
    return "oui";
  }else{
    return "non"
  }
}

function titreTableau(req){
  if(req.session.admin){
    return "Tableau des livre a rendre";
  }else{
    return "Livre disponible"
  }
}

//============================================================================================================================================================================


//========================================================= Mèthode pour request url =========================================================================================

// quand on appuie sur "Le logo"/le bouton "Bibliothèque"/quand on essaye d'acceder a une mauvaise page on est rediriger ici
// elle posséde deux vertion en fonction de si on est connecetr en temp qu'administrateur ou non
app.get('/', (req, res) => {
  MongoClient.connect('mongodb://localhost:27017', (err, baseD) => {
    if (err) throw err;
    var db = baseD.db("Bibliothèque");
    var colLivre=db.collection('livreCol').find();
    var tab1=[];
    var tab2=[];
    //cree un tableau depuis la base de donnee
    colLivre.forEach(function(livre, err){
      if(!req.session.admin){
        if(!livre.reserved){
          tab1.push(livre);
        }
      }else{
        if(livre.reserved){
          tab1.push(livre);
        }else{
          tab2.push(livre);
        }
      }
    }, function(){
      baseD.close();
      res.render('views/index.html', {array1: tab1, array2: tab2, username: connect(req), Visibylity: visible(req) ,
        VisibylityAdmin: visibleAdmin(req), VisibylityConneter: visibleConnecter(req),VisibylityConneterAdmin: visibleConnecterAdmin(req) , date:dateString,
        statusResevationLivre: statusResevationLivre(req), actionDeReservation: actionDeReservation(req), photoPath: "./photo/logo.jpg",
        titreTableau: titreTableau(req)});
    });
  });
});

// quand on appuie sur le bouton "Historique"
app.get('/historique', (req,res) =>{
  MongoClient.connect('mongodb://localhost:27017', (err, baseD) => {
    if (err) throw err;
    var db = baseD.db("Bibliothèque");
    var colHistorique=db.collection('historiqueCol').find();
    var tab=[];
    //cree un tableau depuis la base de donnee
    colHistorique.forEach(function(historique, err){
          tab.push(historique);
    }, function(){
      baseD.close();
      res.render('views/Historique.html', {array: tab, username: connect(req), date:dateString,photoPath: "./photo/logo.jpg", VisibylityConneterAdmin:visibleConnecterAdmin(req)});
    });
  });
});

// quand on appuie sur le bouton "Mes reservation"
app.get('/reservations', (req,res) =>{
  if(!req.session.admin && req.session.username){ // permet d'empecher un utilisateur classique d'acceder a cette page en tappant l'url
    MongoClient.connect('mongodb://localhost:27017', (err, baseD) => {
      if (err) throw err;
      var db = baseD.db("Bibliothèque");
      var colReservations=db.collection('historiqueCol').find({pseudo: req.session.username}); // on récuper toute les donné concernant l'historique de cette utilisateur (celui qui est connecter)
      var tab=[];
      //cree un tableau depuis la base de donnee
      colReservations.forEach(function(reservations, err){
            tab.push(reservations);
      }, function(){
        baseD.close();
        res.render('views/Reservations.html', {array: tab, username: connect(req), date:dateString,});
      });
    });
  }else{
    res.redirect('/')
  }
});

//quand on appuie sur le bouton "Recommandation"
app.get('/recommandation', (req,res) =>{
  if(!req.session.admin && req.session.username){ // permet d'empecher un utilisateur classique d'acceder a cette page en tappant l'url
    MongoClient.connect('mongodb://localhost:27017', (err, baseD) => {
      if (err) throw err;
      var db = baseD.db("Bibliothèque");
      var colHistorique=db.collection('historiqueCol').find({pseudo: req.session.username}); // récupere tout les location déjà effectuer
      var tab=[];
      var tabAuteur=[];// tableau qui stock les auteur qu ont été déja recommander pour ne pas les recomender deux fois
      //cree un tableau depuis la base de donnee
      colHistorique.forEach(function(historique, err){
        var splitTab = historique.livre.split('_'); // sépare le titre du l'ivre et l'auteur
        if(!tabAuteur.includes(splitTab[1])){ // regarde si l'auteur n'a pas déjà été recommander
          tabAuteur.push(splitTab[1]); // si non on l'ajoute a la liste des auteur recomander
          var tabVert = db.collection('livreCol').find({auteur: splitTab[1]}); // on récupere tout les livre de cette auteur dans la base de donnée
          tabVert.forEach(function(livre, err){
            if(livre.titre != splitTab[0] && !livre.reserved){ // si  ce n'est pas le livre en question et et qu'il n'est pas reserved
              tab.push(livre); // et on les ajoute au tab de résultat
            }
          });
        }else{ // si l'auteur existe déja on check dans tout les livre recomander si le livre déjà réserver par cette utilisateur n'est pas dans la liste des recommander
          var acc=0;
          tab.forEach(function(livre, err){
            if(livre.titre == splitTab[0]){
              var tempo= tab.splice(acc,1);
            }
            acc++;
          });
        }
      }, function(){
        baseD.close();
        res.render('views/Recommandation.html', {array: tab, username: connect(req), date:dateString,VisibylityConneter: visibleConnecter(req)});
      });
    });
  }else{
    res.redirect('/')
  }
});

// quand on click sur le bouton "Se connecter/nomUtilisateur"
app.get('/connexion', (req, res) => {
  MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
    if(err) throw err;
    var db = baseD.db("Bibliothèque");
      if(req.session.username){// affiche si l'utiliteur est déja conecter
        db.collection("utilisateurCol").findOne({pseudo: req.session.username},(err , utilisateur) => { // on recupere l'utilisateur dans la base de donné
          if(err) throw err;
          baseD.close();
          res.render('views/GestionCompte.html', { username: connect(req) , VisibylityAdmin: visibleAdmin(req),
            nomUtilisateur: req.session.username , emailUtilisateur: utilisateur.eMail,
            adminUtilisateur: admin(req)}); // la page de gestion de compte
        });
      }else{
        baseD.close();
        res.render('views/Connextion.html', { username: connect(req)});// sinon la page de connexion
      }
    });
});

// quand on click sur le bouton "Se déconnecter"
app.get('/deconexion', (req, res) => {
  req.session.username=null;
  req.session.admin=null;
  res.redirect('/');
});

// quand on click sur le bouton "Ajouter un nouveau livre" dans la vue admin
app.get('/ajoutDeLivre', (req, res) => {
  if(req.session.admin){ // permet d'empecher un utilisateur classique d'acceder a cette page en tappant l'url
    res.render('views/AjoutDeLivre.html', { username: connect(req)});
  }else{
    res.redirect('/');
  }
});

// quand on clique sur le bouton "réserver" dans la vu normal
app.get('/reserver/:p1' , (req,res) => {
    MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
      if(err) throw err;
      var db = baseD.db("Bibliothèque");
      if(req.params.p1 && req.session.username){ // on regarde si il y a bien un utilisateur connecter pour pouvoir réserver
        var newHistorique={pseudo: req.session.username, livre: req.params.p1, date: dateString, action: "Reservé par"} // crée un nouvel item historique
        db.collection("historiqueCol").insertOne(newHistorique, function(err, res){ // on l'insert dans la base de donnée
          if (err) throw err;
        });
        var tab = req.params.p1.split("_"); //permet de séparer titre et auteur d'un livre
        db.collection("livreCol").updateOne({titre: tab[0], auteur: tab[1]},{$set: {reserved: true}},function(err, res) { // on udate le livre pour qu'il ne soit plus reservable
          if (err) throw err;
        });
      }
      baseD.close();
      res.redirect('/');
    });
  });

  // quand on click sur le bouton "a été rendu" dans la vue admin
  app.get('/rendu/:p1' , (req,res) => {
      MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
        if(err) throw err;
        var db = baseD.db("Bibliothèque");
        if(req.params.p1 && req.session.admin){ // on regarde su l'utilisateur connecter est bien un Admin
          var newHistorique={pseudo:"", livre: req.params.p1, date: dateString, action: "Rendu"} // crée un nouvel item historique
          db.collection("historiqueCol").insertOne(newHistorique, function(err, res){ // on l'insert dans la base de donnée
            if (err) throw err;
          });
          var tab = req.params.p1.split("_"); //permet de séparer titre et auteur d'un livre
          db.collection("livreCol").updateOne({titre: tab[0], auteur: tab[1]},{$set: {reserved: false}},function(err, res) { // on udate le livre pour qu'il soit de nouveaux reservable
            if (err) throw err;
          });
        }
        baseD.close();
        res.redirect('/');
      });
    });
//=============================================================================================================================================================================================


//========================================================= Mèthode pour les soumission de formulaire =========================================================================================

// quand on appuie sur le bouton "S'inscrire" pour crée un compte
app.post('/newutilisateur' , (req,res) => {
    MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
      if(err) throw err;
      var db = baseD.db("Bibliothèque");
      var newUtilisateur= {pseudo: req.body.nomUtilisateur , mdp: req.body.mdp1Utilisateur, eMail: req.body.mailUtilisateur , admin: false}; // on crée le nouvelle utilisateur

      db.collection("utilisateurCol").findOne({ $or :[ {pseudo: newUtilisateur.pseudo} , {eMail: newUtilisateur.eMail} ]}, (err , utilisateur) => { // on regarde dans la base de donné si il n'y en a pas déja un
          if(err) throw err;
          if(utilisateur || req.body.mdp1Utilisateur != req.body.mdp2Utilisateur){ //si oui
            baseD.close();
            console.log("email ou pseudo déja utiliser");
            res.redirect('/connexion'); // on redirige vers l'ecrant de connection
          }else{
            db.collection("utilisateurCol").insertOne(newUtilisateur, function(err, res) { // si non on l'ajoute dans la base de donée
          				if (err) throw err;
      			});
            req.session.username = newUtilisateur.pseudo; // et on mets a jours les cookie
            req.session.admin = false;
            baseD.close();
            res.redirect('/') // et on retourne sur la page d'accueil
          }
      });
    });
});

// quand on appuie sur le bouton "Se connecter"
app.post('/dejainscrit' ,(req,res) => {
    MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
      if(err) throw err;
      var db = baseD.db("Bibliothèque");

      db.collection("utilisateurCol").findOne({pseudo: req.body.nomCUtilisateur },(err , utilisateur) => { // on recupere l'utilisateur dans la base de donné
          if(err) throw err;
          if(utilisateur && req.body.mdpUtilisateur == utilisateur.mdp){ // verifie le mdp et le nom de compte
            req.session.username = utilisateur.pseudo; // mets a jours les cookie
            req.session.admin = utilisateur.admin;
            baseD.close();
            res.redirect('/'); // redirige a la page principal si tout ce passe bien
          }else{
            baseD.close();
            res.redirect('/connexion') // redirige a l'ecran de connection si il y a un soucis
          }
      });

    });
});

// quand on appuie sur le bouton "Valider" pour ugrade son compte en administrateur
app.post('/upgrade' ,(req,res) => {
    MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
      if(err) throw err;
      var db = baseD.db("Bibliothèque");

      if(req.body.upgradeToAdmin == "123456"){// on check si le code est le bon
          db.collection("utilisateurCol").updateOne({pseudo: req.session.username },{$set: {admin: true}},function(err, res) {// si oui on modifie l'utilisateur pour le faire passer Admin
            if (err) throw err;
          });
          req.session.admin = true; // on mets a jours le cookie
          res.redirect('/');
          baseD.close();
      }else{
        baseD.close();
        res.redirect('/connexion');// sinon on referche la page
      }
    });
});

// quand on appuie sur le bouton "Ajouter un nouveau livre" dans la vue Admin
app.post('/newLivre' , (req,res) => {
    MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
      if(err) throw err;
      var db = baseD.db("Bibliothèque");
      var newLivre= {titre: req.body.titreLivre , auteur: req.body.auteurLivre, edition: req.body.editionLivre ,
         date: req.body.dateLivre, checkboxNom: req.body.titreLivre+"_"+req.body.auteurLivre, reserved: false};//on crée un nouvel item livre

      db.collection("livreCol").findOne({titre: newLivre.titre , auteur: newLivre.auteur} , (err , livre) => {// on regarde si il n'existe pas déja
          if(err) throw err;
          if(livre){
            baseD.close();
            res.redirect('/ajoutDeLivre');// si oui on refresh la page
          }else{
            db.collection("livreCol").insertOne(newLivre, function(err, res) { //si non on l'insert dans la db
          				if (err) throw err;
      			});
            baseD.close();
            res.redirect('/');// et on retourne sur la page d'accueil
          }
      });
    });
});

app.post('/:p1/recherche' , (req,res) => {
    MongoClient.connect('mongodb://localhost:27017',(err, baseD) =>{
      if(err) throw err;
      var db = baseD.db("Bibliothèque");

      if(req.params.p1 == "index"){
        var colLivre=db.collection('livreCol').find({ $or:[{ titre: req.body.rechercheText },{ auteur: req.body.rechercheText },{ edition: req.body.rechercheText },{date : req.body.rechercheText }, {checkboxNom: req.body.rechercheText }]  });
        var tab1=[];
        var tab2=[];
        //cree un tableau depuis la base de donnee
        colLivre.forEach(function(livre, err){
          if(!req.session.admin){
            if(!livre.reserved){
              tab1.push(livre);
            }
          }else{
            if(livre.reserved){
              tab1.push(livre);
            }else{
              tab2.push(livre);
            }
          }
        }, function(){
          //met le nom de l'utilisateur si il existe sinon met qu'il n est pas log
          baseD.close();
          res.render('views/index', {array1: tab1, array2: tab2, username: connect(req), Visibylity: visible(req) ,
            VisibylityAdmin: visibleAdmin(req), VisibylityConneter: visibleConnecter(req),VisibylityConneterAdmin: visibleConnecterAdmin(req), date:dateString,
            statusResevationLivre: statusResevationLivre(req), actionDeReservation: actionDeReservation(req), photoPath : "../../photo/logo.jpg",
            titreTableau: titreTableau(req)});
        });

      }else if(req.params.p1 == "historique"){
        MongoClient.connect('mongodb://localhost:27017', (err, baseD) => {
          if (err) throw err;
          var db = baseD.db("Bibliothèque");
          var colHistorique=db.collection('historiqueCol').find({ $or:[{pseudo: req.body.rechercheText },{ livre: req.body.rechercheText },{ action: req.body.rechercheText },{date : req.body.rechercheText }]  });
          var tab=[];
          //cree un tableau depuis la base de donnee
          colHistorique.forEach(function(historique, err){
                tab.push(historique);
          }, function(){
            //met le nom de l'utilisateur si il existe sinon met qu'il n est pas log
            baseD.close();
            res.render('views/Historique.html', {array: tab, username: connect(req),VisibylityConneterAdmin: visibleConnecterAdmin(req) ,
               date:dateString, photoPath:"../../photo/logo.jpg" });
          });
        });
      }
    });
});

//=============================================================================================================================================================================================

// si l'utilisateur demande une page qui n'existe pas
app.get('*', (req, res) => {
    res.status(404).send('404 Page Not Found');
});


app.listen(8080);
console.log('Express server started on port 8080');
