const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')

app.use(express.static('public'))
app.set("view engine", "ejs")
app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2', 'key3'],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({
    extended: true
}));

var urlDatabase = {
    userRandomID: {
        "b2xVn2": "http://www.lighthouselabs.ca",
        "9sm5xK": "http://www.google.com"
    },
    user2RandomID: {
        "test": "test.come"
    }
};
const users = {
    "userRandomID": {
        id: "userRandomID",
        email: "user@example.com",
        password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
    },
    "user2RandomID": {
        id: "user2RandomID",
        email: "user2@example.com",
        password: bcrypt.hashSync("dishwasher-funk", 10)
    }
}

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

function findUser(req) {
    console.log("FInding user logged");
    if(req.session.user_id) {
        return true;
    }
}

function checkUserLoginMiddleware(req, res, next) {
    if(req.path.match(/login|register/) || findUser(req)) {
        next()
    } else {
        res.status(403).redirect('http://localhost:8080/login/')
    }
}

app.use(checkUserLoginMiddleware);
/*
 * Routes below 
 */
app.get('/urls', (req, res) => {
    console.log("Rendering...", req.session.user_id);
    let templateVars = {
        urlList: urlDatabase[req.session.user_id],
        user: users[req.session.user_id]
    };
    res.render("urls_index", templateVars);
});

app.get('/login', (req, res) => {
    delete req.session.user_id;
    res.render("login");
});

app.post('/login', (req, res) => {
    // console.log('attempting');
    delete req.session.user_id;
    let attemptLogin;
    let flag = false;
    for (let user in users) {
        if (users[user].email === req.body.email) {
            console.log("found you!")
            console.log("ID is: ", users[user]);
            attemptLogin = users[user];
            flag = true;
            break;
        }
    }
    if (!flag) {
        return res.status(403).send();
    }
    // console.log(req.body);
    if (!bcrypt.compareSync(req.body.password, attemptLogin.password)) {
        return res.status(403).send();
    }
    req.session.user_id = attemptLogin.id;
    console.log("logging in", req.session.user_id, attemptLogin.id);
    console.log(users);
    res.redirect("http://localhost:8080/urls/");
    //res.cookie('user_id', attemptLogin.id).redirect("http://localhost:8080/urls/");
});

app.get('/register', (req, res) => {
    delete req.session.user_id;
    res.render('register');
});
app.post('/register', (req, res) => {
    //console.log(users);
    delete req.session.user_id;
    if (!req.body.email || !req.body.password) {
        return res.status(400).send();
    }
    for (let user in users) {
        if (users[user].email === req.body.email) {
            return res.status(400).send();
        }
    }
    let userID = generateRandomString();
    users[userID] = {
        id: userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
    }
    urlDatabase[userID] = {};
    console.log("user_id = ", userID);
    req.session.user_id = userID;
    console.log("user registered: ", users);
    console.log("urlDatabase updated: ", urlDatabase);
    // res.cookie("user_id", userID);
    res.status(301).redirect("http://localhost:8080/urls/");
});

app.get("/urls/new/", (req, res) => {
    if (req.session.user_id === undefined) {
        res.status(403).render("login");
    }
    let templateVars = {
        user: users[req.session.user_id]
    }

    res.status(200).render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    //if the requested URL doesnt exist
    //LAST CHANGE
    // console.log(req.params.shortURL);
    // console.log("Here");
    if (!urlDatabase[req.session.user_id][req.params.shortURL]) {
        console.log('That is not a valid tiny-url!');
        // res.status(303).send('Invalid URL. Please double check the URL.');
        res.status(302).redirect('/urls/new');
    } else {
        let longURL = urlDatabase[req.session.user_id][req.params.shortURL];
        // console.log("redirect to: ", longURL)
        res.redirect(longURL);
    }
});

app.post("/urls", (req, res) => {
    // console.log(req.body); // debug statement to see POST parameters
    // console.log(req.cookies);
    console.log("urlDatabase: ", urlDatabase);
    var tinyURL = generateRandomString();
    urlDatabase[req.session.user_id][tinyURL] = req.body.longURL;
    console.log("URL added!", urlDatabase)
    // console.log("Database updated\n", urlDatabase);
    // TODO: CHECK STATUS CODE
    res.status(302).redirect(`http://localhost:8080/urls/${tinyURL}`);
});

app.get("/urls/:id", (req, res) => {

    let templateVars = {
        tinyURL: req.params.id,
        urlDatabase: urlDatabase[req.session.user_id],
        user: users[req.session.user_id]
    };
    res.render("url_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
    // console.log(req.params.id, req.body.newURL);
    urlDatabase[req.session.user_id][req.params.id] = req.body.newURL;

    res.status(301).redirect('http://localhost:8080/urls/');
});

app.post("/urls/:id/delete", (req, res) => {
    // console.log(req.cookies["user_id"]);
    delete urlDatabase[req.session.user_id][req.params.id];
    setTimeout(function () {
        res.status(301).redirect('http://localhost:8080/urls/')
    }, 1000);
});

app.post("/logout", (req, res) => {
    delete req.session.user_id;
    res.status(301).redirect('http://localhost:8080/urls/');
});

app.listen(PORT, () => {
    console.log(`tinyApp listening on port ${PORT}!`);
});