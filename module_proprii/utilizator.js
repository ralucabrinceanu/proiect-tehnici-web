const AccesBD=require('./accesbd.js');
const parole = require("./parole.js");
const {RolFactory} = require("./roluri.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");



class Utilizator{
    static tipConexiune="local";
    static tabel = "utilizatori";
    static parolaCriptare = "tehniciweb";
    static lungimeCod = 64;
    static emailServer = "faraoana1111@gmail.com";
    static numeDomeniu = "localhost:8080";
    #eroare;

    constructor({id, username, nume, prenume, email, parola, data_nastere, rol="comun", culoare_chat="black", blocat, poza}={}) {
        this.id=id;
        try {
            if(this.checkUsername(username))
            this.username = username;
        }
        catch(e) {this.#eroare = e.message}

        for(let prop in arguments[0]) {
            this[prop] = arguments[0][prop];
        }

        // this.rol=rol; //TO DO clasa Rol
        if(rol.cod)
            this.rol = RolFactory.creeazaRol(rol.cod)
        else 
            this.rol = RolFactory.creeazaRol(rol)
        // this.rol = this.rol.cod?RolFactory.creeazaRol(this.rol.cod):RolFactory.creeazaRol(this.rol);

        // this.nume = nume;
        // this.prenume = prenume;
        // this.email = email;
        // this.data_nastere = data_nastere;
        // this.parola = parola;
        // this.culoare_chat=culoare_chat;
        // this.poza=poza;

        this.#eroare="";
    }

    // TODO: Daca nu respecte numele/username-ul conditiile din RegExp trb atentionat user-ul

    checkName(nume) {
        nume = nume + "";
        return nume != "" && nume.match(new RegExp("^[A-Z][a-z]+$"));
        // return nume != "";
    }

    set setareNume(nume) {
        if (this.checkName(nume)) 
            this.nume = nume 
        else {
            throw new Error("nume gresit")
        }
    }

    checkUsername(username) {
        username = username + "";
        return username != "" && username.match(new RegExp("^[A-Za-z0-9]+$"));
        // return username != "";
    }
    
    // folosit doar la inregistrare si modificare profil 
    set setareUsername(username) {
        if (this.checkUsername(username)) this.username = username 
        else {
            throw new Error("username gresit")
        }
    }

    // modifica()
    modifica({id, username, nume, prenume, email, parola, data_nastere, rol="comun", culoare_chat="black", blocat, poza} = {}) {
        campuriUtiliz =[]
        valoriUtiliz = []
        for(let prop in arguments[0]) {
            campuriUtiliz.push(prop)
            valoriUtiliz.push(arguments[0][prop])
        }
        AccesBD.getInstanta(Utilizator.tipConexiune).update({
            tabel:"utilizatori",
            campuri:campuriUtiliz,
            valori:valoriUtiliz, 
            conditiiAnd:[`id=${this.id}`]
        }, function(err, rez) {
            if(err) 
                console.log(err);
            if(rez.rowCount == 0)
                throw new Error("utilizatorul nu exista sau eroare la BD.")
        });
    }

    static criptareParola(parola) { 
        // ! Daca vrem hash-uri diferite pt aceeasi parola trb sa randomizam (evt aici jos) parolaCriptare
        return crypto.scryptSync(parola.toString(), Utilizator.parolaCriptare, Utilizator.lungimeCod).toString("hex");
    }

    // salvareUtilizator() {
    //     let parolaCriptata = Utilizator.criptareParola(this.parola);
    //     let utiliz = this;
    //     let token = parole.genereazaToken(100);

    //     AccesBD.getInstanta(Utilizator.tipConexiune).insert({
    //         tabel:Utilizator.tabel, 
    //         campuri:["username", "nume", "prenume", "email", "parola", "data_nastere", "cod", "poza"], 
    //         valori:[`'${this.username}'`, `'${this.nume}'`, `'${this.prenume}'`, `'${this.email}'`, 
    //         `'${parolaCriptata}'`, `'${this.data_nastere}'`, `'${token}'`, `'${this.poza}'` ]
    //     }, function(err, rez) {
    //         if(err) 
    //             console.log(err);

    //         utiliz.trimiteMail("Te-ai inregistrat cu succes", "Username-ul tau este " + utiliz.username,
    //         `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${utiliz.username}.</p> 
    //         <p><a href='http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}'>Click aici pentru confirmare</a></p>` );
    //     });
    // }

    salvareUtilizator() {
        let parolaCriptata = Utilizator.criptareParola(this.parola);
        let utiliz = this;
        let token1 = parole.genereazaToken(10);
        let sirAleator = '';
        const caracterePermise = 'ABCDEFGHIJKLMNOP';
        for(let i = 0; i < 70; i++) {
            const caracterAleator = caracterePermise[Math.floor(Math.random() * caracterePermise.length)];
            sirAleator += caracterAleator;
        }
        // facem cast de la obiect la string
        let username = utiliz.username + '';
        let token2 = `${utiliz.username}-${sirAleator}`;
        let reversedUsername = username.split('').reverse().join('');        

        AccesBD.getInstanta(Utilizator.tipConexiune).insert({
            tabel:Utilizator.tabel, 
            campuri:["username", "nume", "prenume", "email", "parola", "data_nastere", "cod", "poza"], 
            valori:[`'${this.username}'`, `'${this.nume}'`, `'${this.prenume}'`, `'${this.email}'`, 
            `'${parolaCriptata}'`, `'${this.data_nastere}'`, `'${token1}'`, `'${this.poza}'` ]
        }, function(err, rez) {
            if(err) 
                console.log(err);

                utiliz.trimiteMail("te-ai inregistrat cu succes.", "username-ul tau este " + username,
            `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${utiliz.username}.</p> 
            <p><a href='http://${Utilizator.numeDomeniu}/confirmare_inreg/${token1}/${reversedUsername}/${token2}'>
            Click aici pentru confirmare</a></p>` 
                );
        });
    }


// sterge()
    sterge() {
        AccesBD.getInstanta(Utilizator.tipConexiune).delete({
            tabel:"utilizatori",
            conditiiAnd:`id=${this.id}`
        }, function(err, rez) {
            if (err)
                console.log(err);
            if(rez.rowCount == 0)
                throw new Error("utilizatorul nu exista");
        });
    }


    async trimiteMail(subiect, mesajText, mesajHtml, atasamente=[]){
        var transp= nodemailer.createTransport({
            service: "gmail",
            secure: false,
            auth:{//date login 
                user: Utilizator.emailServer,
                pass: "yhslgxgysmuiolhs"
            },
            tls:{
                rejectUnauthorized:false
            }
        });
        //genereaza html
        await transp.sendMail({
            from: Utilizator.emailServer,
            to: this.email, //TO DO
            subject:subiect,//"Te-ai inregistrat cu succes",
            text:mesajText, //"Username-ul tau este "+username
            html: mesajHtml,// `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${username}.</p> <p><a href='http://${numeDomeniu}/cod/${username}/${token}'>Click aici pentru confirmare</a></p>`,
            attachments: atasamente
        })
        console.log("trimis mail");
    }

    static async getUtilizDupaUsernameAsync(username) {
        if(!username) return null;

        try {
            let rezSelect = await AccesBD.getInstanta(Utilizator.tipConexiune).selectAsync({
                tabel:"utilizatori", 
                campuri:["*"], 
                conditiiAnd:[`username= '${username}'`]
            })
            if (rezSelect.rowCount != 0) {
                return new Utilizator(rezSelect.rows[0]);
            }
            else {
                console.log("getUtilizDupaUsernameAsync: nu am gasit utilizatorul");
                return null;
            } 
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }


    static getUtilizDupaUsername(username, obparam, proceseazaUtiliz) {
        if(!username) return null;
        let eroare = null;
        AccesBD.getInstanta(Utilizator.tipConexiune).select({
            tabel:"utilizatori", 
            campuri:["*"], 
            conditiiAnd:[`username= '${username}'`]}, 
            function(err, rezSelect) {

                // if(err || rezSelect.rowCount == 0) {
                if(err) {
                    console.error("utilizator: " ,err);
                    console.log("utilizator: ", rez.rowCount);
                    // throw new Error();
                    // throw new Error("nu exista username-ul");
                    // eroare = "nu a gasit utilizatorul";
                    eroare = -2; /* eroare baza de date */
                }
                else if (rezSelect.rowCount == 0) {
                    eroare = -1; /* nu a gasit niciun utilizator in BD */
                }
        
                let u = new Utilizator(rezSelect.rows[0]);
                proceseazaUtiliz(u, obparam, eroare);

                // let u = new Utilizator(
                    // {
                    //     id:rezSelect.rows[0].id, 
                    //     username:rezSelect.rows[0].username, 
                    //     nume:rezSelect.rows[0].nume, 
                    //     prenume:rezSelect.rows[0].prenume, 
                    //     email:rezSelect.rows[0].email, 
                    //     parola:rezSelect.rows[0].parola, 
                    //     data_nastere:rezSelect.rows[0].data_nastere, 
                    //     rol:rezSelect.rows[0].rol, 
                    //     culoare_chat:rezSelect.rows[0].culoare_chat, 
                    //     poza:rezSelect.rows[0].poza, 
                    //     blocat:rezSelect.rows[0].blocat
                    // }
                // )
                // proceseazaUtiliz(u, obparam);
            }
        );
    }

    areDreptul(drept) {
        return this.rol.areDreptul(drept);
    }

}



module.exports = {Utilizator:Utilizator}