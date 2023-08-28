

sirAlphaNum = "";
v_intervale=[[48,57],[65,90],[97,122]]

for(let interval of v_intervale){
    for(let i=interval[0]; i<=interval[1]; i++)
        sirAlphaNum+=String.fromCharCode(i)
}

console.log(sirAlphaNum);

function genereazaToken(n){
    let token=""
    // cate caractere vrem sa aiba parola
    // n = nr de caractere din parola
    for (let i=0;i<n; i++){
        token+=sirAlphaNum[Math.floor(Math.random()*sirAlphaNum.length)]
        // Math.random() returneaza un nr intre 0 si 1
        // Math.floor() il trunchiaza
    }
    return token;
}

module.exports.genereazaToken=genereazaToken;