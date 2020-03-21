const express = require('express');
const cookieSession = require('cookie-session');
const app = express();
const PORT = 3000; //default port 8080
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const { getUserFromEmail } = require('./helpers.js');
//const hashedPassword = bcrypt.hashSync(password, 10);
//const morgan = require('morgan');

//app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(cookieParser());
app.set('view engine', 'ejs');

app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
  })
);

const checkIfPasswordMatches = function(user, password) {
  return bcrypt.compareSync(password, user.password);
};

const urlDatabase = {
  b2xVn2: { longURL: 'http://www.lighthouselabs.ca', userId: 'userRandomID' },
  '9sm5xK': { longURL: 'http://www.google.com', userId: 'user2RandomID' }
};

// Users database
const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: bcrypt.hashSync('hello', 10)
    //password: 'purple-monkey-dinosaur'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync('dishwasher-funk', 10)
    //password: 'dishwasher-funk'
  }
};

const urlsForUser = function(id) {
  let urlsForUser = [];
  for (let shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userId === id) {
      urlsForUser.push({
        ...urlDatabase[shortUrl],
        shortUrl: shortUrl
      });
    }
  }
  return urlsForUser;
};

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/urls', (req, res) => {
  let userId = req.session.userId;
  if (users[userId]) {
    let urls = urlsForUser(req.session.userId);
    let templateVars = { user: users[req.session.userId], urls: urls };
    res.render('urls_index', templateVars);
  } else {
    res.render('urls_login', { notification: 'Must login.' });
  }
});

// URL Index
app.post('/urls', (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userId: req.session.userId
  };
  res.redirect(`/urls/${shortURL}`);
});

// POST logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// New URL
app.get('/urls/new', (req, res) => {
  let templateVars = { user: users[req.session.userId] };
  if (req.session.userId) {
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

// GET Register
app.get('/register', (req, res) => {
  let templateVars = { user: users[req.session.userId] };
  res.render('urls_register', templateVars);
});

// POST Register
app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.send('Not valid email or password');
  } else if (getUserFromEmail(req.body.email, users)) {
    res.status(400);
    res.send('Email already exists');
  } else {
    let userId = generateRandomString();
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.userId = userId;
    res.redirect('/urls');
  }
});

// GET Login
app.get('/login', (req, res) => {
  let templateVars = { user: users[req.session.userId] };
  res.render('urls_login', templateVars);
});

// POST Login
app.post('/login', (req, res) => {
  let user = getUserFromEmail(req.body.email, users);
  if (!user) {
    res.status(403);
    res.send('Email not in out records');
  } else if (!checkIfPasswordMatches(user, req.body.password)) {
    res.send('Password does not match account');
    res.status(403);
  } else {
    req.session.userId = user.id;
    res.redirect('/urls');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let userId = req.session.userId;
  if (userId === urlDatabase[shortURL].userId) {
    let templateVars = {
      user: users[req.session.userId],
      shortURL,
      longURL: urlDatabase[shortURL].longURL
    };
    res.render('urls_show', templateVars);
  } else if (users[userId]) {
    res.render('urls_index', {
      notification: 'This URL is not your accounts',
      urls: []
    });
  } else {
    res.render('urls_login', { notification: 'Must log in' });
  }
});

// Edit URL
app.post('/urls/:shortURL', (req, res) => {
  let userId = req.session.userId;
  let shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = req.body.longURL;
  if (userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

//Delete URL
app.post('/urls/:shortURL/delete', (req, res) => {
  let userId = req.session.userId;
  let shortURL = req.params.shortURL;
  if (userId) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let result = Math.random()
    .toString(36)
    .substring(7);
  return result;
}
