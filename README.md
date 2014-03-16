# koa-passport-fw

[Passport](https://github.com/jaredhanson/passport) support to [koajs](http://koajs.com/),
with passport's great framework mechanism.

Passport >= 0.2.0 needed.

## Usage

```javascript
var passport = require('passport')

passport.use(require('koa-passport-fw'))
```

Example of LocalStrategy

```javascript
var co = require('co')
var User = require_('models/user')
var passport = require('passport')

passport.framework(require('koa-passport-fw'))

function LocalStrategy(verify) {
  passport.Strategy.call(this)
  this.name = 'local'
  this._verify = verify
}

util.inherits(LocalStrategy, passport.Strategy)

LocalStrategy.prototype.authenticate = function(req, options) {
  options = options || {}
  // falsy logout first, to prevent later middlewares find a user
  req.user = null
  var username = req.body.username
  var password = req.body.password
  if (!username || !password) {
    return this.fail(new Error('Missing credentials'))
  }
  var self = this
  this._verify(username, password, function done(err, user) {
    if (err) return self.error(err)
    if (user) return self.success(user)
    self.fail()
  })
}

/**
 * User model constructor
 */
function User() {
}

User.find = function(id, done) {
  //
  // to get user from database
  // Use ORMs or run a SQL directly
  //
  done(new User({ id: id }))
}

User.get = co(User.find)

User.getByPassword = function* getByPassword(uid, password) {
  var user = yield User.get(uid)
  if (!user) {
    console.log('user "%s" doesnt exit', uid)
    return false
  }
  var ok = yield user.comparePassword(password)
  if (!ok) {
    console.log('user "%s" password missmatch.', uid)
    return false
  }
  return user
}

// The User.getByPassword is a generator function, so we wrap it with `co`
passport.use(new LocalStrategy(co(User.getByPassword)))

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(function(id, done) {
  // callback style still works
  User.find(id, done)
})
// or:
// passport.deserializeUser(co(User.get))
```


See it in action:

```javascript
var app = require('koa')
var session = require('koa-sess')

app.use(session({
  store: new RedisStore({
    prefix: conf.sessionStore.prefix,
    client: redisc
  })
}))
app.use(passport.initialize())
app.use(passport.session())


var localAuth = passport.authenticate('local')

app.use(function *authPOST(next) {
  var form = this.req.body

  // use https://github.com/eivindfjeldstad/http-assert
  assert(form.username && form.password, 401, ERRORS.MISSING_FIELD)

  yield localAuth

  assert(this.req.user, 200, ERRORS.LOGIN_FAILED)

  this.body = {
    user: this.req.user,
  }
})

```


### Credit

You may also wanna try [rkusa/koa-passport](https://github.com/rkusa/koa-passport).


## License

MIT
