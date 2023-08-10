const express = require("express");
const fs = require("fs"); 
const sharp = require("sharp");
const ejs = require("ejs");
const sass = require("sass");
const {Client} = require("pg"); 
const e = require("express");

var cssBootstrap = sass.compile(__dirname+"/resurse/scss/customizare-bootstrap.scss", {sourceMap:true});
fs.writeFileSync(__dirname+"/resurse/css/biblioteci/bootstrap-custom.css", cssBootstrap.css);


var client = new Client({
    database:"tehnici_web",
    user: "raluca",
    password: "raluca",
    host: "localhost",
    port: 5432
});
client.connect();


app = express(); 

app.set("view engine", "ejs"); 
app.use("/resurse", express.static(__dirname + "/resurse"));

obGlobal = {
    erori: null,
    imagini: null
}

app.use("/*", function(req, res, next){
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

app.get(["/", "/index", "/home"], function(req, res) {
    res.render("pagini/index", {ip: req.ip, imagini: obGlobal.imagini});
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