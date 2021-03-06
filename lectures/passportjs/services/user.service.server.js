var app = require('../../../express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new LocalStrategy(localStrategy));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

app.post('/api/lecture-morning/login', passport.authenticate('local'), login);
app.post('/api/lecture-morning/loggedin', loggedin);
app.post('/api/lecture-morning/logout', logout);
app.post('/api/lecture-morning/register', register);
app.post('/api/lecture-morning/isAdmin', isAdmin);
app.get('/api/lecture-morning/admin/user', findAllUsers);
app.delete('/api/lecture-morning/admin/user/:userId', deleteUser);
app.delete('/api/lecture-morning/user/:userId', unregisterUser);
app.put('/api/lecture-morning/admin/user/:userId', checkAdmin, updateUser);
app.put('/api/lecture-morning/user/:userId', checkSameUser, updateProfile);

app.get('/lecture-morning/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
app.get('/google/oauth/callback',
    passport.authenticate('google', {
        successRedirect: '/lectures/passport/#!/profile',
        failureRedirect: '/lectures/passport/#!/login'
    }));

var userModel = require('../models/user.model.server');

function localStrategy(username, password, done) {
    userModel
        .findUserByCredentials(username, password)
        .then(
            function(user) {
                if (!user) {
                    return done(null, false);
                }
                return done(null, user);
            },
            function(err) {
                if (err) { return done(err); }
            }
        );
}

var googleConfig = {
    clientID     : process.env.GOOGLE_CLIENT_ID_SPRING_2017,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET_SPRING_2017,
    callbackURL  : process.env.GOOGLE_CALLBACK_URL_SPRING_2017
};

passport.use(new GoogleStrategy(googleConfig, googleStrategy));

function googleStrategy(token, refreshToken, profile, done) {
    console.log(1);
    console.log(profile);
    userModel
        .findUserByGoogleId(profile.id)
        .then(
            function(user) {
                if(user) {
                    return done(null, user);
                } else {
                    var email = profile.emails[0].value;
                    var emailParts = email.split("@");
                    var newGoogleUser = {
                        username:  emailParts[0],
                        firstName: profile.name.givenName,
                        lastName:  profile.name.familyName,
                        email:     email,
                        google: {
                            id:    profile.id,
                            token: token
                        }
                    };
                    return userModel.createUser(newGoogleUser)
                }
            },
            function(err) {
                if (err) { return done(err); }
            }
        )
        .then(
            function(user){
                return done(null, user);
            },
            function(err){
                if (err) { return done(err); }
            }
        );
}

function checkSameUser(req, res, next) {
    if (req.user && req.user._id == req.params.userId) {
        next();
    } else {
        res.send(401);
    }
}

function checkAdmin(req, res, next) {
    if(req.user && req.user.role == 'ADMIN') {
        next();
    } else {
        res.send(401);
    }
}

function updateProfile(req, res) {
    userModel
        .updateUser(req.params.userId, req.body)
        .then(function (status) {
            res.send(status);
        });
}

function updateUser(req, res) {
    userModel
        .updateUser(req.params.userId, req.body)
        .then(function (status) {
            res.send(status);
        });
}

function unregisterUser(req, res) {
    if(req.user && req.user._id == req.params.userId) {
        userModel
            .deleteUser(req.params.userId)
            .then(function (status) {
                res.send(200);
            });
    } else {
        res.send(401);
    }
}

function deleteUser(req, res) {
    if (req.user && req.user.role == 'ADMIN') {
        userModel
            .deleteUser(req.params.userId)
            .then(function (status) {
                res.send(200);
            });
    } else {
        res.send(401);
    }
}

function findAllUsers(req, res) {
    if(req.user && req.user.role=='ADMIN') {
        userModel
            .findAllUsers()
            .then(function (users) {
                res.json(users);
            });
    } else {
        res.send(401);
    }
}

function register(req, res) {
    var user = req.body;
    userModel
        .createUser(user)
        .then(function (user) {
            req.login(user, function (err) {
                if(err) {
                    res.send(400)
                } else {
                    res.json(user);
                }
            });
        }, function (err) {
            console.log(err);
            res.sendStatus(400).send(err);
        });
}

function isAdmin(req, res) {
    res.send(req.isAuthenticated() && req.user.role == 'ADMIN' ? req.user : '0');
}

function login(req, res) {
    var user = req.user;
    res.json(user);
}

function loggedin(req, res) {
    res.send(req.isAuthenticated() ? req.user : '0');
}

function logout(req, res) {
    req.logout();
    res.send(200);
}

function serializeUser(user, done) {
    done(null, user);
}

function deserializeUser(user, done) {
    userModel
        .findUserById(user._id)
        .then(
            function(user){
                done(null, user);
            },
            function(err){
                done(err, null);
            }
        );
}