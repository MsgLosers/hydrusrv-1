const router = require('express').Router()

const middleware = require('../middleware')
const controllers = require('../controllers')

router.post('/',
  middleware.auth.createUser.inputValidationConfig,
  middleware.auth.createUser.validateInput,
  async (req, res, next) => {
    try {
      if (controllers.auth.getUserByName(req.body.username)) {
        return next({
          customStatus: 400,
          customName: 'UsernameExistsError'
        })
      }
    } catch (err) {
      return next(err)
    }

    try {
      await controllers.auth.createUser(
        req.body.username, req.body.password
      )
    } catch (err) {
      return next(err)
    }

    res.send({
      createdUser: true
    })
  }
)

router.put('/',
  middleware.auth.validateToken,
  middleware.auth.updateUser.inputValidationConfig,
  middleware.auth.updateUser.validateInput,
  async (req, res, next) => {
    if (req.body.username) {
      try {
        if (controllers.auth.getUserByName(req.body.username)) {
          return next({
            customStatus: 400,
            customName: 'UsernameExistsError'
          })
        }
      } catch (err) {
        return next(err)
      }
    }

    let validUser

    try {
      validUser = await controllers.auth.getValidUser(
        res.locals.userId, req.body.currentPassword
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

    try {
      controllers.auth.updateUser(
        res.locals.userId, req.body
      )
    } catch (err) {
      return next(err)
    }

    res.send({
      updatedUser: true
    })
  }
)

router.delete('/',
  middleware.auth.validateToken,
  middleware.auth.deleteUser.inputValidationConfig,
  middleware.auth.deleteUser.validateInput,
  async (req, res, next) => {
    let validUser

    try {
      validUser = await controllers.auth.getValidUser(
        res.locals.userId, req.body.password
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

    try {
      controllers.auth.deleteUser(
        res.locals.userId
      )
    } catch (err) {
      return next(err)
    }

    res.send({
      deletedUser: true
    })
  }
)

module.exports = router
