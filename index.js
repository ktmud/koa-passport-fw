/**
 * Passport Framework for koa
 */

var authenticate = require('passport')._framework.authenticate

exports.initialize = function(passport) {
  return function *(next) {
    var req = this.req
    var session = req.session || this.session

    // to ensuer request has a session
    req.session = session

    req._passport = { instance: passport }

    if (session && session[passport._key]) {
      // load data from existing session
      req._passport.session = session[passport._key];
    } else if (session) {
      // initialize new session
      session[passport._key] = {};
      req._passport.session = session[passport._key];
    } else {
      // no session is available
      req._passport.session = {};
    }
    yield next
  }
}


function isRedirected(res) {
  return res.status < 400 && res.status >= 300
}


exports.authenticate = function(passport, strategy, options) {
  options = options || {}

  var middleware = authenticate.bind(this, passport, strategy, options)

  function auth(next) {
    function cb(err, user, info, failure) {
      next(err, {
        user: user,
        info: info,
        failure: failure
      })
    }
    middleware(cb)(this.req, this.res, next)
  }

  function login(user) {
    return function(next) {
      this.req.logIn(user, options, next)
    }
  }

  function transformAuthInfo(info) {
    return function(next) {
      passport.transformAuthInfo(info, this.req, next)
    }
  }

  return function *(next) {
    var result = yield auth

    // no result means this strategy is passed
    if (!result) {
      if (next) yield next
      return
    }

    var req = this.req
    var user = result.user
    if (user === false) {
      if (options.failureRedirect) {
        this.redirect(options.failureRedirect);
      } else {
        this.status = 401
      }
      return
    }

    if (options.assignProperty) {
      req[options.assignProperty] = user;
    } else {
      yield login(user)
      if (options.authInfo !== false) {
        req.authInfo = yield transformAuthInfo(result.info);
      }
      if (options.successReturnToOrRedirect) {
        var url = options.successReturnToOrRedirect;
        if (this.session && this.session.returnTo) {
          url = this.session.returnTo;
          delete this.session.returnTo;
        }
        return this.redirect(url);
      }
      if (options.successRedirect) {
        return this.redirect(options.successRedirect);
      }
    }

    if (next) {
      yield next
    }
  }
}
