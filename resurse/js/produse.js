
window.addEventListener("load", function () {
    x = 100;


    // preluare date cos virtual din localStorage
    // "cos_virtual:" "3,1,10,4,2"
    // cantitate: "3|2, 5|1" produsul 3(2 bucati), produsul 5(1 bucata)
    
    let iduriProduse = localStorage.getItem("cos_virtual");
    iduriProduse = iduriProduse?iduriProduse.split(','):[];

    for(let idp of iduriProduse) {
        let ch = document.querySelector(`[value='${idp}'].select-cos`);
        if (ch) {
            ch.checked = true;
        } else {
            console.log("id cos virtual inexistent: ", idp);
        }

    }

    // adaugare date in cos virtual
    let checkboxuri = document.getElementsByClassName("select-cos");
    for(let ch of checkboxuri) {
        ch.onchange = function() {
            let iduriProduse = localStorage.getItem("cos_virtual");
            iduriProduse = iduriProduse?iduriProduse.split(','):[];

            if(this.checked) {
                iduriProduse.push(this.value);
            } else {
                let poz = iduriProduse.indexOf(this.value);
                if(poz != -1) {
                    iduriProduse.splice(poz, 1);
                }
            }

            localStorage.setItem("cos_virtual", iduriProduse.join(','));
        }
    }
    


    document.getElementById("inp-inaltime").onchange = function() {
        document.getElementById("infoRange").innerHTML = `(${this.value})`
    }


    document.getElementById("i_textarea").onchange = function() {
        if (!this.value.toLowerCase().trim().match(new RegExp("^[a-zA-Z\- 0-9]*$"))) {
            this.classList.add("is-invalid");
        } else {
            this.classList.remove("is-invalid");
        }
    }


    // document.getElementById("filtrare").onclick = function() {    
    function filtreaza () {
        // verificare input-uri
        condValidare = true;
        var inpNume = document.getElementById("inp-nume").value.toLowerCase().trim();
        var inpTextarea = document.getElementById("i_textarea").value.toLowerCase().trim();
        // condValidare = condValidare && inpNume.match(new RegExp("^[a-zA-Z]*$")) && inpTextarea.match(new RegExp("^[a-zA-Z\- 0-9]*$"));
        // if (!condValidare) {
        //     alert("inputuri gresite");
        //     return;
        // }

        var inpTip = document.getElementById("inp-tip").value.toLowerCase().trim();

        var radioAll = document.getElementById("toater");
        var radioTrue = document.getElementById("truer");
        var radioFalse = document.getElementById("falser");

        var inpInaltime = parseInt(document.getElementById("inp-inaltime").value);


        prodAfisate = 0;
        var produse = document.getElementsByClassName("produs");
        for (let produs of produse) {
            var cond1 = false, cond2 = false, cond3 = false, cond4 = false, cond5 = false;
            produs.style.display = "none";


            let nume = produs.getElementsByClassName("val-nume")[0].innerHTML.toLowerCase().trim();
            if (nume.includes(inpNume)) {
                cond1 = true;
            }

            let categorie = produs.getElementsByClassName("val-tip_produs")[0].innerHTML.toLowerCase().trim();
            if (inpTip == "oricare" || categorie == inpTip) {
                cond2 = true;
            }

            let usurinta = produs.getElementsByClassName("val-intretinere")[0].innerHTML.trim();
            if (radioAll.checked || (radioTrue.checked && usurinta == "da") || (radioFalse.checked && usurinta == "nu")) {
                cond3 = true;
            }

            let dim = parseInt(produs.getElementsByClassName("val-inaltime")[0].innerHTML);
            if (dim >= inpInaltime) {
                cond4=true;
            }

            let descriere = produs.getElementsByClassName("val-descriere")[0].innerHTML.toLowerCase().trim();
            if (descriere.includes(inpTextarea)) {
                cond5 = true;
            }      
            
           
            if (cond1 && cond2 && cond3 && cond4 && cond5) {
                produs.style.display = "block";
                prodAfisate++;
            }
        }

        msj = document.getElementById("mesaj");
        if (!prodAfisate) {
            if (!msj) {
                mesaj = document.createElement('p');
                mesaj.id = 'mesaj';
                mesaj.innerHTML = 'nu exista produse conform filtrarii curente';

                var prod= document.getElementById('produse');
                prod.appendChild(mesaj);
                mesaj.style = `text-align:center; `
            }
            else {
                if (msj) {
                    msj.remove();
                }
            }
        }

    }
    
    document.getElementById("resetare").onclick = function() {

        var confirmResetare = confirm('vrei sa resetezi filtrele?');
        if(confirmResetare) {} else { return; }
        

        // resetare produse 
        var produse = document.getElementsByClassName("produs");
        for (let produs of produse) {
            produs.style.display = "block";
        }

        // resetare filtre
        document.getElementById("inp-nume").value = "";
        document.getElementById("sel-toate").selected = true;
        document.getElementById("toater").checked = true;
        document.getElementById("i_textarea").value = "";
        // document.getElementById("i_textarea").classList.remove("is-invaid");

        document.getElementById("inp-inaltime").value = document.getElementById("inp-inaltime").min;
        document.getElementById("infoRange").innerHTML = '(' + parseInt(document.getElementById("minRange").textContent) + ')';
    }


    function sorteaza(semn) { 
        var produse = document.getElementsByClassName("produs");
        var v_produse = Array.from(produse) 

        v_produse.sort(function(a, b) {
            var c1_a = parseFloat(a.getElementsByClassName("val-inaltime")[0].innerHTML)/(a.getElementsByClassName("val-pret")[0].innerHTML);
            var c1_b = parseFloat(b.getElementsByClassName("val-inaltime")[0].innerHTML)/(b.getElementsByClassName("val-pret")[0].innerHTML);
            if (c1_a == c1_b) {
                var c2_a = a.getElementsByClassName("val-origine")[0].innerHTML;
                var c2_b = b.getElementsByClassName("val-origine")[0].innerHTML;
                return semn * c2_a.localeCompare(c2_b);
            }
            return semn * (c1_a - c1_b);
        })

        for (let produs of v_produse) {
            produs.parentNode.appendChild(produs);
        }
    }

    document.getElementById("sortCrescNume").onclick = function() {
        sorteaza(1);
    }
    document.getElementById("sortDescrescNume").onclick = function() {
        sorteaza(-1);
    }


    document.getElementById("calculare").onclick = function(){
        var produse = document.getElementsByClassName("produs");
        let suma = 0;
        for(let prod of produse) {
            if(prod.style.display != "none") {
                suma += parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
            }
        }
        suma = suma / produse.length;

        if(!document.getElementById("rezultat")) {
            rezultat = document.createElement("div");
            rezultat.id = "rezultat";
            rezultat.innerHTML = "media preturilor: " + suma + " lei";

            var ps = document.getElementById("butoaneFiltrare");
            ps.parentNode.insertBefore(rezultat, ps);
            rezultat.style = `
                position: fixed;
                right: 90px;
            `
            setTimeout(function(){
                document.getElementById("rezultat").remove();
            }, 2000);
        }
    }


    // window.onkeydown = function(e) {
    //     console.log(e);
    //     if (e.key == 'c' && e.altKey) {
    //         var produse = document.getElementsByClassName("produs");
    //         let suma = 0;
    //         for (let prod of produse) {
    //             if (prod.style.display != "none") {
    //                 suma += parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
    //             }
    //         }
    //         if (!document.getElementById("rezultat")) { 
    //             rezultat = document.createElement("p");
    //             rezultat.id = "rezultat";
    //             rezultat.innerHTML="Pret total: " + suma;
    //             document.getElementById("produse").appendChild(rezultat);
    //             var ps = document.getElementById("p-suma");
    //             ps.parentNode.insertBefore(rezultat, ps.nextSibling);
    //             rezultat.style.border = "1px solid blue";
    //             rezultat.onclick = function() {
    //                 this.remove();
    //             }
    //             setTimeout(function() {
    //                 document.getElementById("rezultat").remove();

    //             }, 2000);

    //         }
    //     }
    // }



    // filtrare onchange 
    document.getElementById("inp-nume").onchange = filtreaza;
    document.getElementById("i_textarea").onchange = filtreaza;
    document.getElementById("inp-tip").onchange = filtreaza;
    document.getElementById("toater").onchange = filtreaza;
    document.getElementById("truer").onchange = filtreaza;
    document.getElementById("falser").onchange = filtreaza;
    document.getElementById("inp-inaltime").onchange = function() {
        filtreaza();
        document.getElementById("infoRange").innerHTML = '(' + parseInt(this.value) +')';
    };

})