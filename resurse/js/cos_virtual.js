window.addEventListener("load",function(){

	produse = localStorage.getItem("cos_virtual");
	if (produse){
		produse = produse.split(",");
		var vect_ids = [];
		var vect_cant = [];

		for(prod of produse){
			vect_ids.push(prod.split("|")[0]);
			vect_cant.push(prod.split("|")[1])
		}
		fetch("/produse_cos", {		

			method: "POST",
			headers:{'Content-Type': 'application/json'},
			
			mode: 'cors',		
			cache: 'default',
			body: JSON.stringify({
				a:10,
				b:20,

				ids_prod: vect_ids,
				// cant_prod: vect_cant

			})
		})
		.then(function(rasp){ 
            console.log(rasp); 
            x=rasp.json(); 
            console.log(x); 
            return x
        })

		.then(function(objson) {
			console.log(objson);//objson e vectorul de produse
			let main=document.getElementsByTagName("main")[0];
			let btn=document.getElementById("cumpara");
			// console.log(vect_ids, vect_cant)

			for (let prod of objson){
				// let poz = vect_ids.indexOf(prod.id.toString())
				// let cant = vect_cant[poz]
				// console.log(cant)
				
				let article=document.createElement("article");
				article.classList.add("cos-virtual");
				var h2=document.createElement("h2");
                h2.innerHTML=prod.nume;
                
				article.appendChild(h2);
				let imagine=document.createElement("img");
				imagine.src="/resurse/imagini/produse/"+prod.imagine;
				article.appendChild(imagine);
				
				let descriere=document.createElement("p");
                // descriere.innerHTML = prod.descriere + "<b> Pret: </b>"+prod.pret;

                // trebuie adaugata si cantitatea
                descriere.innerHTML = `
                    <br><b>Pret: </b> ${prod.pret}
                    <br><b>Origine: </b> ${prod.origine}
                    <br><b>Inaltime: </b> ${prod.inaltime}
                    <br><b>Tip: </b> ${prod.tip_produs}
                `
            
                article.appendChild(descriere);
				main.insertBefore(article, btn);			
			}
		}
		).catch(function(err){console.log(err)});



    document.getElementById("cumpara").onclick=function(){
        prod_sel=localStorage.getItem("cos_virtual");// "1,2,3"
        // produse = localStorage.getItem("cos_virtual");
        
        // if (produse){
        //     produse = produse.split(",");
        //     var vect_ids = [];
        //     var vect_cant = [];

        //     for(prod of produse){
        //         vect_ids.push(prod.split("|")[0]);
        //         vect_cant.push(prod.split("|")[1])
        //     }
        if(prod_sel) {
            var vect_ids = prod_sel.split(",");

            fetch("/cumpara", {		
    
                method: "POST",
                headers:{'Content-Type': 'application/json'},
                
                mode: 'cors',		
                cache: 'default',
                body: JSON.stringify({
                    ids_prod: vect_ids,
                    // cant_prod: vect_cant,
                    a:10,
                    b:"abc"
                })
            })
            .then(function(rasp){ console.log(rasp); return rasp.text()})
            .then(function(raspunsText) {
        
                console.log(raspunsText);
                if(raspunsText){
                    localStorage.removeItem("cos_virtual")
                    let p=document.createElement("p");
                    p.innerHTML=raspunsText;
                    document.getElementsByTagName("main")[0].innerHTML="";
                    document.getElementsByTagName("main")[0].appendChild(p)
                }
            }).catch(function(err){console.log(err)});
        }
    }
    
}
else{
    document.getElementsByTagName("main")[0].innerHTML="<h2>Nu aveti nimic in cos!</h2>";
}
	
});