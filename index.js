/**
 * Passport Framework for koa
 */
var _authenticate = require('passport/lib/middleware/authenticate')

exports.initialize = function(passport) {
  return function *(next) {
    var req = this.req
    var session = req.session || this.session
    req._passport = {
      session: session && session[passport._key] || {}
    }
    req._passport.instance = passport;
    req.session = session
    yield next
  }
}


exports.authenticate = function(passport, strategy, options, callback) {

  var middleware = _authenticate(passport, strategy, options, callback)

  function authenticate(next) {
    middleware(this.req, this.res, next)
  }

  return function *(next) {
    yield authenticate
    if (next) yield next
  }
}
