

window.addEventListener ("DOMContentLoaded", function() {

    temaCurenta = localStorage.getItem("tema");
    if(temaCurenta) // se verifica daca exista tema curenta
        document.body.classList.add(temaCurenta);

    document.getElementById("tema").onclick = function() {
        if(document.body.classList.contains("dark")) {
            document.body.classList.remove("dark");
            localStorage.removeItem("tema");
        }
        else {
            document.body.classList.add("dark");
            localStorage.setItem("tema", "dark");
        }

    }
})


// localStorage.clear() 