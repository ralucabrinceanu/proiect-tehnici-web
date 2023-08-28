const express = require("express");
const fs = require("fs"); 
const sharp = require("sharp");
const ejs = require("ejs");
const sass = require("sass");
const {Client} = require("pg"); 
const e = require("express");
const path = require("path");
const formidable = require("formidable");

const {Utilizator} = require("./module_proprii/utilizator.js");
const AccesBD = require("./module_proprii/accesbd.js");
const session = require("express-session");
const Drepturi = require("./module_proprii/drepturi.js");


// creare foldere necesare
foldere=["temp", "poze_uploadate"];
for (let folder of foldere){
    let calefolder=path.join(__dirname,folder);
    if (!fs.existsSync(calefolder))
        fs.mkdirSync(calefolder);
}


var cssBootstrap = sass.compile(__dirname+"/resurse/scss/customizare-bootstrap.scss", {sourceMap:true});
fs.writeFileSync(__dirname+"/resurse/css/biblioteci/bootstrap-custom.css", cssBootstrap.css);


var instantaBD = AccesBD.getInstanta({init:"local"});
var client = instantaBD.getClient();

// instantaBD.select({campuri:["nume", "pret"], tabel:"plante", conditiiAnd:["pret>20", "pret<100"]}, function(err, rez) {
//     console.log("===============================");
//     if(err)
//         console.log(err);
//     else 
//         console.log(rez);
// })


app = express(); 

app.use(session({
    secret: 'abcdef', // criptare id
    resave: true,
    saveUninitialized: false
}));

app.set("view engine", "ejs"); 
app.use("/resurse", express.static(__dirname + "/resurse"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));
app.use("/poze_uploadate", express.static(__dirname + "/poze_uploadate"));

obGlobal = {
    erori: null,
    imagini: null
}

app.use("/*", function(req, res, next){
    res.locals.Drepturi = Drepturi;
    if(req.session.utilizator) {
        req.utilizator = res.locals.utilizator = new Utilizator(req.session.utilizator); /* vede toata lumea */
    }

    client.query("select * from unnest(enum_range(null::tipuri_produse))", function(err, rezTip){
        if(err){
            console.log(err);
            renderError(res, 2);
        } else {
            res.locals.optiuniMeniu = rezTip.rows;
            next();
        }
    });
});

function getIp(req){//pentru Heroku/Render
    var ip = req.headers["x-forwarded-for"];//ip-ul userului pentru care este forwardat mesajul
    if (ip){
        let vect=ip.split(",");
        return vect[vect.length-1];
    }
    else if (req.ip){
        return req.ip;
    }
    else{
     return req.connection.remoteAddress;
    }
}

//  -------------------------- ACCESARI 
app.all("/*", function(req, res, next){
    // let id_utiliz=req.session.utilizator? req.session.utilizator.id: null;
    let id_utiliz=req?.session?.utilizator?.id;
    id_utiliz = id_utiliz?id_utiliz:null;
    AccesBD.getInstanta().insert({
       tabel:"accesari",
       campuri:["ip", "user_id", "pagina"],
       valori:[`'${getIp(req)}'`, `${id_utiliz}`, `'${req.url}'`]
       }, function(err, rezQuery){
           console.log(err);
       }
   )
    next();
});

function stergeAccesariVechi() {
    AccesBD.getInstanta().delete({
        tabel:"accesari",
        conditiiAnd:["now()-data_accesare >= interval '10 minutes'"]}, 
        function(err,rez){
            console.log(err);
        }
    )
}
stergeAccesariVechi();
setInterval(stergeAccesariVechi, 10*60*1000);


function createImages() {
    var continutFisier = fs.readFileSync(__dirname+"/resurse/json/galerie.json").toString("utf8");
    var obiect = JSON.parse(continutFisier);
    var dim_mediu = 400;
    var dim_mic = 300;

    obGlobal.imagini = obiect.imagini;
    obGlobal.imagini.forEach(function(elem) {
        elem.fisier = obiect.cale_galerie+"/"+elem.cale_imagine;

        // "imagine-1.png" -> ["imagine-1", "png"]
        [nume_fisier, extensie] = elem.cale_imagine.split("."); 
        
        if (!fs.existsSync(obiect.cale_galerie + "/mediu/")) {
            fs.mkdirSync(obiect.cale_galerie + "/mediu/");
        }
        elem.fisier_mediu = obiect.cale_galerie + "/mediu/" + nume_fisier + ".webp";

        if (!fs.existsSync(obiect.cale_galerie + "/mic/")) {
            fs.mkdirSync(obiect.cale_galerie + "/mic/");
        }
        elem.fisier_mic = obiect.cale_galerie + "/mic/" + nume_fisier + ".webp";
        
        sharp(__dirname + "/" + elem.fisier).resize(dim_mediu).toFile(__dirname + "/" + elem.fisier_mediu);
        sharp(__dirname + "/" + elem.fisier).resize(dim_mic).toFile(__dirname + "/" + elem.fisier_mic);
    })
    console.log(obGlobal.imagini);
}
createImages();


function createErrors() {
    var continutFisier = fs.readFileSync(__dirname+"/resurse/json/erori.json").toString("utf8");
    obGlobal.erori = JSON.parse(continutFisier);
}
createErrors();


function renderError(res, identificator, titlu, text, imagine) {
    var eroare = obGlobal.erori.info_erori.find(function(elem) { 
        return elem.identificator == identificator;
    });
    titlu = titlu || (eroare && eroare.titlu) || obGlobal.erori.eroare_default.titlu;
    text = text || (eroare && eroare.text) || obGlobal.erori.eroare_default.text;
    imagine = imagine || (eroare && obGlobal.erori.cale_baza+"/"+eroare.imagine) || 
                (obGlobal.erori.cale_baza+"/"+obGlobal.erori.eroare_default.imagine);
    
    if(eroare && eroare.status) {
        res.status(identificator).render("pagini/eroare", {titlu: titlu, text: text, imagine: imagine});
    }
    else {
        res.render("pagini/eroare", {titlu: titlu, text: text, imagine: imagine});
   
    }
}


app.get("/*.ejs", function(req, res) {
    renderError(res, 403);
});

app.get(["/", "/index", "/home", "/login"], async function(req, res) {
    // res.render("pagini/index", {ip: req.ip, imagini: obGlobal.imagini});
    // res.render("pagini/index", {ip: req.ip, imagini: obGlobal.imagini, succesLogin:req?.session?.succesLogin});
    let sir = req.session.succesLogin;
    req.session.succesLogin = null;
    
    // cerere catre tabelul de accesari
    client.query("select username, email from utilizatori where id in (select distinct user_id from accesari where now()-data_accesare <= interval '10 minutes')", 
    function(err, rez) {
        let useriOnline = [];
        if (!err && rez.rezCount!=0)
            useriOnline = rez.rows;
        
        res.render("pagini/index", {ip: req.ip, imagini: obGlobal.imagini, succesLogin: sir, useriOnline:useriOnline});
    })

    // res.render("pagini/index", {ip: req.ip, imagini: obGlobal.imagini, succesLogin: sir});
});


app.get("/produse", function(req, res) {
    client.query("select * from unnest(enum_range(null::tipuri_produse))", function(err, rezTip) {

        client.query("select min(inaltime), max(inaltime) from plante", function(err, rezInaltime) {

            continuareQuery = ""
            if (req.query.tip)
                continuareQuery += ` AND tip_produs = '${req.query.tip}'` 

            client.query("select * from plante where 1 = 1 " + continuareQuery, function(err, rez) {
                if (err) {
                    console.log(err);
                    renderError(res, 2);
                } 
                else {
                    res.render("pagini/produse", 
                    {produse: rez.rows, 
                    // optiuni: rezTip.rows,
                    optiuni: res.locals.optiuniMeniu,
                    inputs: rezInaltime.rows[0]
                    });
                }
            })

        })
    });
});

app.get("/produs/:id", function(req, res) {
    client.query("select * from plante where id="+req.params.id, function(err, rez) {
        if (err) {
            console.log(err);
            renderError(res, 2);
        } 
        else {
            res.render("pagini/produs", {prod: rez.rows[0]});
        }
    });

});


// http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}

// "/cod/:username/:token"
app.get("/confirmare_inreg/:token1/:username_inv/:token2", function(req, res) {
    console.log(req.params);
    // const token1 = req.params.token1;
    // const token2 = req.params.token2;
    // facem destructuring (e mai scurt)
    const { token1, token2, username_inv } = req.params;
    const username = username_inv.split('').reverse().join('');
    try {
        Utilizator.getUtilizDupaUsername(username, {res, token: token1}, function(u, obparam) {
            AccesBD.getInstanta().update({
                tabel: "utilizatori",
                campuri: ["confirmat_mail"],
                valori: ["true"], 
                conditiiAnd: [`cod = '${obparam.token}'`]
            }, function(err, rezUpdate) {
                if(err || rezUpdate.rowCount == 0) {
                    console.log("Cod: ", err);
                    renderError(res, 3);
                }
                else {
                    res.render("pagini/confirmare.ejs", {username});
                }
            })
        })
    }
    catch(e) {
        console.log(e);
        renderError(res,2);
    }
})


// login
app.post("/login", function(req, res){
    var username;
    console.log("ceva");
    var formular= new formidable.IncomingForm()
    formular.parse(req, function(err, campuriText, campuriFisier) { 
        Utilizator.getUtilizDupaUsername(campuriText.username, {
            req:req,
            res:res,
            parola:campuriText.parola
        }, function(u, obparam) {
            let parolaCriptata = Utilizator.criptareParola(obparam.parola);
            if(u.parola == parolaCriptata && u.confirmat_mail) {
                u.poza = u.poza?path.join("poze_uploadate", u.username, u.poza):"";
                obparam.req.session.utilizator = u;
                obparam.req.session.succesLogin = "bravo, te-ai logat";
                obparam.res.redirect("/index");
            }
            else {
                obparam.res.render("pagini/index", {eroareLogin: "date logare incorecte sau nu a fost confirmat mail-ul", imagini:obGlobal.imagini, useriOnline: []});
            }
        })
    })
});


app.post("/profil", function(req, res){
    console.log("profil");
    if (!req.session.utilizator){
        randeazaEroare(res,403,);
        // renderError(res, 403);
        res.render("pagini/eroare_generala",{text:"Nu sunteti logat."});
        return;
    }
    var formular= new formidable.IncomingForm();
 
    formular.parse(req,function(err, campuriText, campuriFile){
       // TODO: De pus poza (vezi "name" de la poza din formular.ejs)
       // ** trb umblat la "campuri" si "valori"
       // ! trb sa te asiguri ca poza se afla in locals.utilizator -> vezi comentariul de mai jos
       // console.log(req.session.utilizator);
        var parolaCriptata=Utilizator.criptareParola(campuriText.parola);
        AccesBD.getInstanta().update(
            {tabel:"utilizatori",
            campuri:["nume","prenume","email","data_nastere","culoare_chat"],
            valori:[`${campuriText.nume}`,`${campuriText.prenume}`,`${campuriText.email}`, `${campuriText.data_nastere}`,`${campuriText.culoare_chat}`],
            conditiiAnd:[`parola='${parolaCriptata}'`]
        },  function(err, rez){
            if(err){
                console.log(err);
                // randeazaEroare(res,2);
                renderError(res, identificator=2)
                return;
            }
            console.log(rez.rowCount);
            if (rez.rowCount==0){
                res.render("pagini/profil",{mesaj:"Update-ul nu s-a realizat. Verificati parola introdusa."});
                return;
            }
            else{            
                //actualizare sesiune
                console.log("ceva");
                req.session.utilizator.nume= campuriText.nume;
                req.session.utilizator.prenume= campuriText.prenume;
                req.session.utilizator.email= campuriText.email;
                req.session.utilizator.data_nastere = campuriText.data_nastere;
                req.session.utilizator.culoare_chat= campuriText.culoare_chat;
                res.locals.utilizator=req.session.utilizator;
            }
            // TODO: de luat mesajul de mai jos in "profil.ejs";
            res.render("pagini/profil",{mesaj:"Update-ul s-a realizat cu succes."});
        });
    });
});


/****************************** ADMINISTRARE UTILIZATORI*/
app.get("/useri", function(req, res){
    if(req?.utilizator?.areDreptul?.(Drepturi.vizualizareUtilizatori)){
        AccesBD.getInstanta().select({
            tabel:"utilizatori", 
            campuri:["*"]}, function(err, rezQuery){
            console.log(err);
            res.render("pagini/useri", {useri: rezQuery.rows});
        });
    }
    else{
        renderError(res,403);
    }
});

app.post("/sterge_utiliz", function(req, res){
    if(req?.utilizator?.areDreptul?.(Drepturi.stergereUtilizatori)){
        var formular= new formidable.IncomingForm();

        formular.parse(req,function(err, campuriText, campuriFile){
           
                AccesBD.getInstanta().delete({
                    tabel:"utilizatori", 
                    conditiiAnd:[`id=${campuriText.id_utiliz}`]}, 
                    function(err, rezQuery){
                console.log(err);
                res.redirect("/useri");
            });
        });
    }else{
        renderError(res,403);
    }
})



// logout 
app.get("/logout", function(req, res){
    req.session.destroy();
    res.locals.utilizator=null;
    res.render("pagini/logout");
});


//////////////////////////////// UTILIZATORI
app.post("/inregistrare", function(req, res){
    var username;
    console.log("ceva");
    var formular= new formidable.IncomingForm()
    formular.parse(req, function(err, campuriText, campuriFisier ){ //4
        console.log("inregistrare: ", campuriText);
        console.log(campuriFisier);
        var eroare="";

        var utilizNou = new Utilizator();
        try {
            utilizNou.setareNume = campuriText.nume;
            utilizNou.setareUsername = campuriText.username;
            utilizNou.email = campuriText.email;
            utilizNou.prenume = campuriText.prenume;
            utilizNou.parola = campuriText.parola;
            utilizNou.data_nastere = campuriText.data_nastere;

            utilizNou.poza = campuriFisier.poza.originalFilename;
                        
            Utilizator.getUtilizDupaUsername(campuriText.username, {}, function(u, parametru, eroareUser) {
                if (eroareUser == -1) { // nu exista username-ul in BD
                    utilizNou.salvareUtilizator();
                }
                else {
                    eroare += "mai exista username-ul";
                }

                if(!eroare){
                    res.render("pagini/inregistrare", {raspuns: "inregistrare cu succes"});
                }
                else {
                    res.render("pagini/inregistrare", {err: "Eroare: "+eroare});
                }
            })
        }
        catch(e) {
            console.log(e.message);
            eroare += "eroare site. reveniti mai tarziu";
            console.log(eroare);
            res.render("pagini/inregistrare", {err: "Eroare: "+eroare});
        }   
    });

    formular.on("field", function(nume,val){  //1
   
        console.log(`--- ${nume}=${val}`);
       
        if(nume=="username")
            username=val;
    })

    formular.on("fileBegin", function(nume,fisier){ //2
        console.log("fileBegin");
       
        console.log(nume,fisier);
        //TO DO in folderul poze_uploadate facem folder cu numele utilizatorului
        let folderUser = path.join(__dirname, "poze_uploadate", username);
        console.log(folderUser);
        if(!fs.existsSync(folderUser)) {
            fs.mkdirSync(folderUser);
        }
        fisier.filepath = path.join(folderUser, fisier.originalFilename);
    }) 

    formular.on("file", function(nume,fisier){ //3
        console.log("file");
        console.log(nume,fisier);
    });
});


app.get("/despre", function(req, res) {
    res.render("pagini/despre", {imagini: obGlobal.imagini});
});

app.get("/*", function(req, res) {
    console.log("url: ", req.url);
    res.render("pagini"+req.url, function(err, rezRandare) {
        if(err) {
            if (err.message.includes("Failed to lookup view")) {
                renderError(res, 404, "Eroare 404");
            } else {

            }
        }
        else {
            res.send(rezRandare);
        }
    });
});


console.log("hello world");

app.listen(8080);
console.log("serverul a pornit");