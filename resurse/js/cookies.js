function setCookie(nume, val, timpExpirare) {
    // timp expirare in ms
    d = new Date();
    d.setTime(d.getTime() + timpExpirare) 
    document.cookie = `${nume} = ${val}; expires=${d.toUTCString()}`
}

function getCookie(nume) {
    vectorParametri =  document.cookie.split(";");
    for (let param of vectorParametri) {
        if (param.trim().startsWith(nume+"="))
            return param.split("=")[1];
    }
    return null;
}

function deleteCookie(nume) {
    document.cookie = `${nume}=0; expires=${(new Date()).toUTCString()}`
}

function deleteAllCookies() {
    allCookies =  document.cookie.split(";");
    for (let cookie of allCookies) {
        nume = c.split("=")[0].trim();
        deleteCookie(nume);
    }
}


window.addEventListener("load", function() {
    if (getCookie("acceptat_banner")) {
        // document.getElementById("banner").style.display = "none";
    }

    document.getElementById("ok_cookies").onclick = function() {
        // setCookie("acceptat_banner", true, 60000); 
        setCookie("acceptat_banner", true, 12 * 60 * 60 * 1000); // jumatate de zi 
        document.getElementById("banner").style.display = "none";
    }
})
