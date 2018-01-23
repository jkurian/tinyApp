// const express = require("express");
// const app = express();
// const PORT = process.env.PORT || 8080; // default port 8080
// const bodyParser = require("body-parser");

// app.set("view engine", "ejs")
// app.use(bodyParser.urlencoded({
//     extended: true
// }));

// var urlDatabase = {
//     "b2xVn2": "http://www.lighthouselabs.ca",
//     "9sm5xK": "http://www.google.com"
// };

// app.get('/urls', (req, res) => {
//     let templateVars = {
//         urlList: urlDatabase
//     };
//     res.render("urls_index", templateVars);
// });

// app.get("/urls/new/", (req, res) => {
//     res.render("urls_new");
// });

// app.get("/urls/:id", (req, res) => {
//     let templateVars = {
//         tinyURL: req.params.id,
//         urlDatabase: urlDatabase
//     };
//     res.render("url_show", templateVars);
// });

// app.post("/urls", (req, res) => {
//     console.log(req.body); // debug statement to see POST parameters
//     res.send("Ok"); // Respond with 'Ok' (we will replace this)
// });

// app.listen(PORT, () => {
//     console.log(`Example app listening on port ${PORT}!`);
// });

function generateRandomString() {
    var rand = Math.floor(Math.random()*100000000).toString();
    return rand.hashCode();
}

String.prototype.hashCode = function () {
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        rand = Math.floor(Math.random()*100);
        hash = ((hash << 5) - hash) + char - rand;
        hash = Math.abs(hash & hash); // Convert to 32bit integer
    }
    return hash.toString(16);
}
console.log(generateRandomString("www.gmail.com"));