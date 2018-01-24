const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(express.static('public'))
app.set("view engine", "ejs")
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));

var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

app.get('/urls', (req, res) => {
    let templateVars = {
        urlList: urlDatabase,
        username: req.cookies.username
    };
    res.render("urls_index", templateVars);
});

app.get("/urls/new/", (req, res) => {
    let templateVars = {
        username: req.cookies.username
    }
    res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    //if the requested URL doesnt exist
    if(!urlDatabase[req.url.slice(3)]) {
        console.log('That is not a valid tiny-url!');
        // res.status(303).send('Invalid URL. Please double check the URL.');
        res.status(302).redirect('/urls/new');
    } else {
        let longURL = urlDatabase[req.url.slice(3)];
        res.redirect(longURL);
    }
});

app.post("/urls", (req, res) => {
    // console.log(req.body); // debug statement to see POST parameters
    var tinyURL = generateRandomString();
    urlDatabase[tinyURL] = req.body.longURL;
    // console.log("Database updated\n", urlDatabase);
    //TODO: CHECK STATUS CODE
    res.status(302).redirect(`http://localhost:8080/urls/${tinyURL}`);
});

app.get("/urls/:id", (req, res) => {
    let templateVars = {
        tinyURL: req.params.id,
        urlDatabase: urlDatabase,
        username: req.cookies.username
    };
    res.render("url_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
    // console.log(req.params.id, req.body.newURL);
    urlDatabase[req.params.id] = req.body.newURL;

    res.status(301).redirect('http://localhost:8080/urls/');
});

app.post("/urls/:id/delete", (req, res) => {
    delete urlDatabase[req.params.id];
    setTimeout(function(){res.status(301).redirect('http://localhost:8080/urls/')}, 1000);
});

app.post("/login", (req, res) => {
    // console.log("HERE");
    res.cookie("username", req.body.username);
    res.status(301).redirect('http://localhost:8080/urls/');
});

app.post("/logout", (req, res) => {
    res.status(301).clearCookie("username").redirect('http://localhost:8080/urls/');
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
    var rand = Math.floor(Math.random() * 100000000).toString();
    return rand.hashCode();
}

String.prototype.hashCode = function () {
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        rand = Math.floor(Math.random() * 100);
        hash = ((hash << 5) - hash) + char - rand;
        hash = Math.abs(hash & hash); // Convert to 32bit integer
    }
    return hash.toString(32);
}