const router = require('express').Router()

const middleware = require('../middleware')
const controllers = require('../controllers')

router.post('/',
  middleware.authentication.createToken.inputValidationConfig,
  middleware.authentication.createToken.validateInput,
  async (req, res, next) => {
    let validUser

    try {
      validUser = await controllers.authentication.getValidUser(
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
      data.token = controllers.authentication.createToken(
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
  middleware.authentication.validateToken,
  middleware.authentication.deleteToken.inputValidationConfig,
  middleware.authentication.deleteToken.validateInput,
  (req, res, next) => {
    try {
      controllers.authentication.deleteTokens(
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
