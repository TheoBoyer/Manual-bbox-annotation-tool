function makeid(length=10) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

let identity = makeid(10);
document.addEventListener('DOMContentLoaded', function() {
    if(document.cookie.indexOf("identity") == -1) {
        document.cookie = "identity=" + identity;
    } else {
        identity = document.cookie.split("=")[1];
    }
})