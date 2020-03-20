const express = require('express');
//var morgan = require('morgan');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PORT = 8080; //default port 8080
const bcrypt = require('bcrypt');
//const hashedPassword = bcrypt.hashSync(password, 10);
const saltRounds = 10;

//app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  b2xVn2: {
    shortURL: 'b2xVn2',
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'userRandomID'
  },
  '9sm5xK': {
    shortURL: '9sm5xK',
    longURL: 'http://www.google.com',
    userID: 'user2RandomID'
  }
};

const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: bcrypt.hashSync('hello', 10)
    // password: 'purple-monkey-dinosaur'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync('123', 10)
    // password: 'dishwasher-funk'
  }
};
const urlsForUser = id => {
  let result = [];
  for (let urlId in urlDatabase) {
    if (urlDatabase[urlId].userID === id) {
      result.push(urlDatabase[urlId]);
    }
  }
  console.log(result);
  return result;
};

const addURL = (longURL, userID) => {
  let shortURL = generateRandomString(6);
  const newObj = {
    shortURL,
    longURL,
    userID
  };
  urlDatabase[shortURL] = newObj;
  return shortURL;
};

const checkIfValidUser = email => {
  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return false;
}; // check if user is in DB

const addNewUser = (email, password) => {
  const userId = generateRandomString(13);
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);

  const newUserObj = {
    id: userId,
    email,
    password: hash
  };

  users[userId] = newUserObj;
  return userId;
};

const updateURL = (shortURL, longURL) => {
  urlDatabase[shortURL].longURL = longURL;
  return true;
};

app.post('/register', (req, res) => {
  const email = req.body.email;
  const passwordHash = req.body.password;
  if (email === '' || password === '') {
    res.status(400).send('Enter valid email and/or password');
  } else if (!checkIfValidUser(email)) {
    const userId = addNewUser(email, password);
    res.cookie('user_id', userId);
    res.redirect('/urls');
  } else {
    res.status(403).send('Email already exists in our records');
  }
}); // POST Registration

app.get('/register', (req, res) => {
  const userId = req.cookies['user_id'];
  const loggedInUser = users[userId];
  let templateVars = { currentUser: loggedInUser };
  res.render('urls_register', templateVars);
}); // GET Registration
express;

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId = checkIfValidUser(email);

  if (email === '' || password === '') {
    res.status(403).send('Email and/or password does not match our records');
  } else if (!userId.email) {
    res.status(403).send('This user not found');
  } else if (userId.email) {
    if (!bcrypt.compareSync(password, userId.password)) {
      res.status(403).send('Wrong password');
    } else {
      res.cookie('user_id', userId.id);
      res.redirect('/urls');
    }
  }
}); // POST Login

app.get('/login', (req, res) => {
  const userId = req.cookies['user_id'];
  const loggedInUser = users[userId];
  let templateVars = { currentUser: loggedInUser };
  res.render('urls_login', templateVars);
}); // GET Login

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
}); // LOGOUT

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  updateURL(shortURL, longURL);
  res.redirect('/urls');
}); // edit

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  if (shortURL === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
  } else {
    //might remove else after checking it works
    res.redirect('/urls');
  }
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls', (req, res) => {
  const userId = req.cookies['user_id'];
  const longURL = req.body.longURL;
  const shortURL = addURL(longURL, userId);
  const loggedInUser = users[userId];
  let templateVars = { shortURL, longURL, currentUser: loggedInUser };
  res.render('urls_show', templateVars);
});

app.get('/urls/json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/users/json', (req, res) => {
  res.json(users);
});

app.get('/urls/new', (req, res) => {
  const userId = req.cookies['user_id'];
  const loggedInUser = users[userId];
  let templateVars = { currentUser: loggedInUser };
  if (userId) {
    res.render('urls_new', templateVars);
  } else {
    //might remove else after checking it works
    res.render('urls_login', templateVars);
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.cookies['user_id'];
  const loggedInUser = users[userId];
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    currentUser: loggedInUser
  };
  if (shortURL === urlDatabase[shortURL].userID) {
    res.render('urls_show', templateVars);
  }
});

app.get('/urls', (req, res) => {
  const userId = req.cookies['user_id'];
  const loggedInUser = users[userId];
  const urls = urlsForUser(userId);
  let templateVars = { urls, currentUser: loggedInUser };
  res.render('urls_index', templateVars);
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
