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
const users = {
    "userRandomID": {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur"
    },
    "user2RandomID": {
        id: "user2RandomID",
        email: "user2@example.com",
        password: "dishwasher-funk"
    }
}

app.get('/urls', (req, res) => {
    let templateVars = {
        urlList: urlDatabase,
        user: users[req.cookies["user_id"]]
    };
    res.render("urls_index", templateVars);
});
app.get('/login', (req, res) => {
    res.render("login");
});

app.post('/login', (req, res) => {
    // console.log('attempting');
    let attemptLogin;
    let flag = false;
    for(let user in users) {
        if(users[user].email === req.body.email){
            // console.log("found you!")
            attemptLogin = users[user];
            flag = true;
            break;
        }
    }
    if(!flag){
       return res.status(403).send();
    }
    // console.log(req.body);
    if(req.body.password !== attemptLogin.password) {
        return res.status(403).send();
    }

    res.cookie('user_id', attemptLogin.id).redirect("http://localhost:8080/urls/");
});

app.get('/register', (req, res) => {
    res.render('register');
});
app.post('/register', (req, res) => {
    //console.log(users);
    if(!req.body.email || !req.body.password) {
       return res.status(400).send();
    } 
    for(let user in users) {
       if(users[user].email === req.body.email) {
            return res.status(400).send();
         }
    }
    let userID = generateRandomString();
    users[userID] = {
        id: userID,
        email: req.body.email,
        password: req.body.password
    }

    res.cookie("user_id", userID);
    res.status(301).redirect("http://localhost:8080/urls/");
});

app.get("/urls/new/", (req, res) => {
    if(req.cookies["user_id"] === undefined) {
        res.status(403).render("login");
    }
    let templateVars = {
        user: users[req.cookies["user_id"]]
    }
    
    res.status(200).render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    //if the requested URL doesnt exist
    if (!urlDatabase[req.url.slice(3)]) {
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
        user: users[req.cookies["user_id"]]
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
    setTimeout(function () {
        res.status(301).redirect('http://localhost:8080/urls/')
    }, 1000);
});

app.post("/logout", (req, res) => {
    res.status(301).clearCookie("user_id").redirect('http://localhost:8080/urls/');
});

app.listen(PORT, () => {
    console.log(`tinyApp listening on port ${PORT}!`);
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