const {Client} = require("pg"); 


class AccesBD {
    static #instanta = null;
    static #initializat = false;

    constructor() {
        if(AccesBD.#instanta) {
            throw new Error("deja a fost instantiat");
        }
        // AccesBD.#instanta = -1;
        else if(!AccesBD.#initializat) {
            throw new Error("trebuie apelat doar din getInstanta; fara sa fi aruncat vreo eroare");
        }
    }

    initLocal() {
        this.client = new Client({
            database:"tehnici_web",
            user: "raluca",
            password: "raluca",
            host: "localhost",
            port: 5432
        });
        this.client.connect();
    }

    getClient() {
        if(!AccesBD.#instanta || AccesBD.#instanta == -1) {
            throw new Error("nu a fost instantiata clasa");
        }
        return this.client;
    }

    static getInstanta({init="local"}={}) {
        // console.log(this); // this-ul e clasa, nu instanta pt ca metodica statica
        if(!this.#instanta) {
            this.#initializat = true;
            this.#instanta = new AccesBD();

            // initializarea poate arunca erori
            // vom adauga aici cazurile de initializare 
            // pentru baza de date cu care vrem sa lucram
            try {
                switch(init) {
                    case "local":this.#instanta.initLocal();
                }

                // daca ajunge aici inseamna ca nu s-a produs eroare la initializare
            }
            catch (e) {
                console.log("eroare la initializarea bazei de date");
            }
            
        }
        return this.#instanta;
    }

    select ({tabel="", campuri=[], conditiiAnd=[]}={}, callback) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0) {
            conditieWhere = `where ${conditiiAnd.join(" and ")} `;
        }
        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere} `;
        console.log(comanda);
        this.client.query(comanda, callback);
    }
    
    async selectAsync ({tabel="", campuri=[], conditiiAnd=[]}={}) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0) {
            conditieWhere = `where ${conditiiAnd.join(" and ")} `;
        }
        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere} `;
        console.log("selectAsync: ", comanda);
        this.client.query(comanda);
        try {
            let rez = await this.client.query(comanda);
            console.log("selectasync: ", rez);
            return rez;
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

    insert ({tabel="", campuri=[], valori=[]}={}, callback) {
        if (campuri.length != valori.length) {
            throw new Error("nr campuri difera de nr valori");
        }
        let comanda = `insert into ${tabel}(${campuri.join(",")}) values (${valori.join(",")}) `;
        console.log(comanda);
        this.client.query(comanda, callback);
    }

    update({tabel="",campuri=[],valori=[], conditiiAnd=[]} = {}, callback){
        if(campuri.length!=valori.length)
            throw new Error("Numarul de campuri difera de nr de valori")
        let campuriActualizate=[];
        for(let i=0;i<campuri.length;i++)
            campuriActualizate.push(`${campuri[i]}='${valori[i]}'`);
        let conditieWhere="";
        if(conditiiAnd.length>0)
            conditieWhere=`where ${conditiiAnd.join(" and ")}`;
        let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda,callback)
    }

    delete({tabel="",conditiiAnd=[]} = {}, callback){
        let conditieWhere="";
        if(conditiiAnd.length>0)
            conditieWhere=`where ${conditiiAnd.join(" and ")}`;
        
        let comanda=`delete from ${tabel} ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda,callback)
    }
}

module.exports = AccesBD;