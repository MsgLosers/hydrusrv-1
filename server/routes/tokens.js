const router = require('express').Router()

const middleware = require('../middleware')
const controllers = require('../controllers')

router.post('/',
  middleware.auth.createToken.inputValidationConfig,
  middleware.auth.createToken.validateInput,
  async (req, res, next) => {
    let validUser

    try {
      validUser = await controllers.auth.getValidUser(
        req.body.username, req.body.password, true
      )

      if (!validUser) {
        return next({
          customStatus: 400,
          customName: 'InvalidUserError'
        })
      }
    } catch (err) {
      return next(err)
    }

    const data = {}

    try {
      data.token = controllers.auth.createToken(
        validUser.id, req.body.long
      )
    } catch (err) {
      return next(err)
    }

    res.send({
      token: data.token.hash,
      mediaToken: data.token.mediaHash
    })
  }
)

router.delete('/',
  middleware.auth.validateToken,
  middleware.auth.deleteToken.inputValidationConfig,
  middleware.auth.deleteToken.validateInput,
  (req, res, next) => {
    try {
      controllers.auth.deleteTokens(
        res.locals.userId, res.locals.token, req.body.all
      )
    } catch (err) {
      return next(err)
    }

    res.send({
      deletedTokens: true
    })
  }
)

module.exports = router
