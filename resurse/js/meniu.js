

window.addEventListener("DOMContentLoaded", function() {

    window.onresize = function() {
        if(window.innerWidth > 700) {
            document.getElementById("ch-menu").checked = false;

            var submeniuri = document.querySelectorAll("ul.meniu ul");
            for (var i = 0; i < submeniuri.length; i++) {
                submeniuri[i].style.display = "none";
            }
        }
    }


    // pagina curenta
    locatieMeniu = document.querySelectorAll(`a[href='${window.location.pathname}']`)[0];
    locatieMeniu.style = `
        font-weight: bold;
        color: #af557d;
    `
    
});