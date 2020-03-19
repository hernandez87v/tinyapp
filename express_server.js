const express = require('express');
var morgan = require('morgan');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PORT = 8080; //default port 8080

app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xk': 'http://www.google.com'
};

const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

const checkIfValidUser = email => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
}; // check if user is in DB

const newUser = (email, password) => {
  const user = generateRandomString();
  const newUserDB = {
    id: user,
    email,
    password
  };
  users[user] = newUserDB;
  return user;
};

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = checkIfValidUser(email);

  if (email === '' || password === '') {
    res.status(403).send('Not a valid email and/or password.');
  } else if (!user.email) {
    res.status(403).send('No user with this email.');
  } else {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  }
}); // POST Login

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
}); // LOGOUT

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls`);
}); // edit

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.cookies['user_id'] };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    user: req.cookies['user_id']
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: req.cookies['user_id']
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls'); // delete
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === '' || password === '') {
    res.status(400).send('Not a registered user');
  } else if (!checkIfValidUser(email)) {
    const user = newUser(email, password);
    res.cookie('user_id', user);
    res.redirect('/urls');
  } else {
    res.status(403).send('This email is already registered.');
  }
}); // POST Registration form

app.get('/register', (req, res) => {
  const user = req.cookies['user_id'];
  const loggedInUser = users[user];
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: loggedInUser
  };
  res.render('urls_register', templateVars);
}); //GET Registration form

app.get('/login', (req, res) => {
  const user = req.cookies['user_id'];
  const loggedInUser = users[user];
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: loggedInUser
  };
  res.render('urls_login', templateVars);
}); // GET Login

app.listen(PORT, () => {
  console.log(`Example app listening on port ${8080}!`);
});

function generateRandomString() {
  let rando = Math.random()
    .toString(36)
    .substring(7);
  return rando;
}
