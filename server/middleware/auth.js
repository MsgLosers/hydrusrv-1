const { check, validationResult } = require('express-validator/check')
const { sanitizeBody } = require('express-validator/filter')
const config = require('../config/app')
const auth = require('../controllers/auth')

module.exports = {
  validateToken: (req, res, next) => {
    if (!req.headers.authorization) {
      return next({
        customStatus: 403,
        customName: 'MissingTokenError'
      })
    }

    let userId
    const hash = req.headers.authorization.replace('Bearer ', '')

    try {
      userId = auth.validateTokenAndGetUserId(hash)
    } catch (err) {
      return next(err)
    }

    if (userId === false) {
      return next({
        customStatus: 403,
        customName: 'InvalidTokenError'
      })
    }

    res.locals.token = hash
    res.locals.userId = userId

    next()
  },
  createUser: {
    inputValidationConfig: [
      sanitizeBody('username').trim(),
      check('username')
        .exists().withMessage('MissingUsernameFieldError')
        .isString().withMessage('InvalidUsernameFieldError')
        .isLength({ min: 1, max: 128 }).withMessage(
          'InvalidUsernameFieldError'
        ),
      sanitizeBody('password').trim(),
      check('password')
        .exists().withMessage('MissingPasswordFieldError')
        .isString().withMessage('InvalidPasswordFieldError')
        .isLength({
          min: config.minPasswordLength,
          max: 128
        }).withMessage('InvalidPasswordFieldError')
    ],
    validateInput: (req, res, next) => {
      if (config.registrationEnabled !== 'true') {
        return next({
          customStatus: 400,
          customName: 'RegistrationDisabledError'
        })
      }

      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customName: err.array()[0].msg
        })
      }

      next()
    }
  },
  updateUser: {
    inputValidationConfig: [
      sanitizeBody('username').trim(),
      check('username')
        .optional()
        .isString().withMessage('InvalidUsernameFieldError')
        .isLength({ min: 1, max: 128 }).withMessage(
          'InvalidUsernameFieldError'
        ),
      sanitizeBody('password').trim(),
      check('password')
        .optional()
        .isString().withMessage('InvalidPasswordFieldError')
        .isLength({
          min: config.minPasswordLength,
          max: 128
        }).withMessage('InvalidPasswordFieldError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customName: err.array()[0].msg
        })
      }

      next()
    }
  },
  createToken: {
    inputValidationConfig: [
      sanitizeBody('username').trim(),
      check('username')
        .exists().withMessage('MissingUsernameFieldError')
        .isString().withMessage('InvalidUsernameFieldError')
        .isLength({ min: 1, max: 128 }).withMessage(
          'InvalidUsernameFieldError'
        ),
      sanitizeBody('password').trim(),
      check('password')
        .exists().withMessage('MissingPasswordFieldError')
        .isString().withMessage('InvalidPasswordFieldError')
        .isLength({
          min: config.minPasswordLength,
          max: 128
        }).withMessage('InvalidPasswordFieldError'),
      check('long')
        .optional()
        .isBoolean().withMessage('InvalidLongFieldError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customName: err.array()[0].msg
        })
      }

      next()
    }
  },
  deleteToken: {
    inputValidationConfig: [
      check('all')
        .optional()
        .isBoolean().withMessage('InvalidAllFieldError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customName: err.array()[0].msg
        })
      }

      next()
    }
  }
}