const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')

//Stores all our users tiny URLS
const urlPerUserDatabase = {
    userRandomID: {
        'b2xVn2': 'http://www.lighthouselabs.ca',
        '9sm5xK': 'http://www.google.com'
    },
    user2RandomID: {
        'test': 'test.com'
    }
};
//stores all the URLS for the public to access
const allURLS = {
    'b2xVn2': 'http://www.lighthouselabs.ca',
    '9sm5xK': 'http://www.google.com',
    'test': 'test.com'
}
//stores all our users information
//The two currently present are for testing only
const users = {
    'userRandomID': {
        id: 'userRandomID',
        email: 'user@example.com',
        password: bcrypt.hashSync('1', 10)
    },
    'user2RandomID': {
        id: 'user2RandomID',
        email: 'user2@example.com',
        password: bcrypt.hashSync('2', 10)
    }
}

//generates a random string which is used as a key
function generateRandomString() {
    var rand = Math.floor(Math.random() * 100000000).toString();
    return rand.hashCode();
}

//default hash function implemented in javas .toHash function
//returns a string from the hashed value
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

//Check if user is currently logged in
//needs refactoring
function checkLoggedIn(req, res, next) {
    const currentUser = req.session.user_id;
    if (currentUser) {
        console.log("logged in!");
        next();
    } else {
        //This regular expression tests for if the user is trying to access anything 
        //other then the login, register or / page (if they are we send them to the error page 
        //and tell them to log in first)
        if (!req.path.match(/^\/login\/?$|^\/register\/?$|^\/?$|\/u\//)) {
            console.log("logged in first!");
            let errorMessage = {
                message: 'Please login first!',
                sendTo: '/login'
            }
            res.render('errors', errorMessage);
        } else {
            console.log("allowed!");
            next();
        }
    }
}

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2', 'key3'],

    // Cookie Options
    // Session length is 2 hours
    maxAge: 2 * 60 * 60 * 1000
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(checkLoggedIn);



//ROUTES BEGIN

// Home page, if user is logged in --> redirect to /urls
// if user is not logged in --> redirect to login
app.get('/', (req, res) => {
    if (req.session.user_id) {
        res.render('http://localhost:8080/urls')
    } else {
        res.redirect('http://localhost:8080/login')
    }
})

//render the urls_index.ejs file whenever we try to access /urls
// Do not need to check if user is logged in because middleware does
// that for us and redirects the user to log in.
app.get('/urls', (req, res) => {
    let templateVars = {
        urlList: urlPerUserDatabase[req.session.user_id],
        user: users[req.session.user_id]
    };
    res.render('urls_index', templateVars);
});

//handle a post form sent to /urls. Essentially generates a new URL,
//adds this url/tinurl to the urlDarabase and redirects the user to /urls/tinyURL.
app.post('/urls', (req, res) => {
    var tinyURL = generateRandomString();
    urlPerUserDatabase[req.session.user_id][tinyURL] = req.body.longURL;
    allURLS[tinyURL] = req.body.longURL;
    res.status(302).redirect(`http://localhost:8080/urls/${tinyURL}`);
});

//if the user is logged in, then we redirect them to /urls
//if the user is not logged in, then we render the login page
app.get('/login', (req, res) => {
    console.log("in login GET");
    if (!req.session.user_id) {
        res.render('login');
    } else {
        res.redirect('http://localhost:8080/urls/');
    }
});

//Checks if the user email and login infomation match, if it does then 
//we set the request session user_id to the users id found in the user database
//If there were problems authenticating the user, we render an
//error.ejs page with an appropriate error message and a link to go 
//back to the login page
app.post('/login', (req, res) => {
    delete req.session.user_id;
    let attemptLogin;
    let flag = false;
    //check each user email and find the user object that belongs to that email
    for (let user in users) {
        if (users[user].email === req.body.email) {
            attemptLogin = users[user];
            flag = true;
            break;
        }
    }
    //if the flag is true, then we found the user object
    if (!flag) {
        let errorMessage = {
            message: 'Sorry, your login information is incorrect.',
            sendTo: 'login'
        }
        res.render('errors', errorMessage);
    }
    //if the password inputted and password of the user object do not match
    //then we render an error page with the appropriate error message
    if (!bcrypt.compareSync(req.body.password, attemptLogin.password)) {
        let errorMessage = {
            message: 'Sorry, your login information is incorrect.',
            sendTo: 'login'
        }
        res.render('errors', errorMessage);
    }
    //if we get here, the user password and email have matched and we redirect the user
    //to the urls page
    req.session.user_id = attemptLogin.id;
    res.redirect('http://localhost:8080/urls/');
});

//when the register page is accessed with a GET request.
//If the user is already logged in, we redirect them to urls
// If not, we redirect them to register
app.get('/register', (req, res) => {
    if (req.session.user_id) {
        res.redirect('http://localhost:8080/urls');
    }
    res.render('register');
});

//When the user presses the submit button on the register page, we first clear
//the cookie in the session and then check that the email or password fields are
// not empty. If they are empty we render the errors.ejs page with the appropriate message.
//Next we check if the user email has already been registered. If not,
// then we create a new user and add it to the user database and also create
// an object for the user in the urlPerUserDatabase to track their short URLs.
app.post('/register', (req, res) => {
    delete req.session.user_id;
    if (!req.body.email || !req.body.password) {
        let errorMessage = {
            message: 'Do not leave anything blank....',
            sendTo: 'register'
        }
        res.render('errors', errorMessage);
    }
    for (let user in users) {
        if (users[user].email === req.body.email) {
            let errorMessage = {
                message: 'That email is taken!',
                sendTo: 'register'
            }
            res.render('errors', errorMessage);
        }
    }
    let userID = generateRandomString();
    users[userID] = {
        id: userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
    }
    urlPerUserDatabase[userID] = {};
    req.session.user_id = userID;
    res.status(301).redirect('http://localhost:8080/urls/');
});

//If there is a GET to urls/new, we first check if the user is logged in.
//If not logged in, we redirect them to the login page or else we render
//the urls_new page with the user object passed to the urls_new.ejs
app.get('/urls/new/', (req, res) => {
    if (req.session.user_id === undefined) {
        res.status(403).redirect('http://localhost:8080/login');
    }
    let templateVars = {
        user: users[req.session.user_id]
    }

    res.status(200).render('urls_new', templateVars);
});

//When using the tinyURL, if the GET request is for a tinyURL that has not
//been generated, then we render the error.ejs page with the appropriate message
//If the tinyURL is present in the urlPerUserDatabase, then we redirect the user to
//the longURL assosciated with that key
app.get('/u/:shortURL', (req, res) => {
    // if (!urlPerUserDatabase[req.session.user_id][req.params.shortURL]) {
    //     let errorMessage = {
    //         message: 'That tinyURL does not exist!',
    //         sendTo: 'urls'
    //     }
    //     res.status(302).render('errors', errorMessage);
    // } else {
    if (!allURLS[req.params.shortURL]) {
        let redirect = '';
        if (req.session.id) {
            redirect = '/urls'
        } else {
            redirect = '/login'
        }
        let errorMessage = {
            message: 'That tinyURL does not exist!',
            sendTo: redirect
        }
        res.status(302).render('errors', errorMessage);
    } else {
        let longURL = allURLS[req.params.shortURL];
        res.redirect(longURL);
    }
});

//first we get the usersURLs from the urlPerUserDatabase
//If this is undefined, then that user is not in the urlPerUserDatabase
//so we send them to the errors.ejs page and tell them to log in first
//If it is not undefined, then we have to check if the url they are trying
//to access is in their urlsDatabase object. If it is not,
//then we tell them they have not created that tinyURL
//Otherwise we render the url_show.ejs page with the correct information
app.get('/urls/:id', (req, res) => {
    var usersURLs = urlPerUserDatabase[req.session.user_id];
    if (usersURLs === undefined) {
        var errorMessage = {
            message: 'Please login first!',
            sendTo: '/'
        }
        return res.render('errors', errorMessage);
    }
    //TODO: Review this piece of code
    if (!usersURLs.hasOwnProperty(req.params.id)) {
        var errorMessage = {
            message: 'You have not created that tinyURL!',
            sendTo: '/'
        }
        return res.render('errors', errorMessage);
    }
    let templateVars = {
        tinyURL: req.params.id,
        urlPerUserDatabase: urlPerUserDatabase[req.session.user_id],
        user: users[req.session.user_id]
    };
    res.render('url_show', templateVars);
});

//When a user tries to POST a new URL to the database, we first check if 
//they are logged in, if not send them to errors.ejs.
//If they are logged in we get their orresponding urlPerUserDatabase object associated 
//to that person and find the URL associated to that hash and we update the value
//of it to the new URL the user wants to link to.
app.post('/urls/:id', (req, res) => {
    if (!req.session.user_id) {
        var errorMessage = {
            message: 'You have not created that tinyURL!',
            sendTo: '/'
        }
        return res.render('errors', errorMessage);
    }
    urlPerUserDatabase[req.session.user_id][req.params.id] = req.body.newURL;
    allURLS[req.params.id] = req.body.newURL;
    res.status(301).redirect('http://localhost:8080/urls/');
});

//If the user clicks the delete button on url_index.ejs, then we delete
//that entry in the urlPerUserDatabase associated to that user with the specified hash
//We have a setTimeout here to show the popup before the page redirects
app.post('/urls/:id/delete', (req, res) => {
    delete urlPerUserDatabase[req.session.user_id][req.params.id];
    delete allURLS[req.params.id];
    setTimeout(function () {
        res.status(301).redirect('http://localhost:8080/urls/')
    }, 1000);
});

//if the user clicks the logout button, then we delete the cookie and redirect them
//to login
app.post('/logout', (req, res) => {
    delete req.session.user_id;
    res.status(301).redirect('http://localhost:8080/login/');
});

//Listening to the specified port
app.listen(PORT, () => {
    console.log(`tinyApp listening on port ${PORT}!`);
});