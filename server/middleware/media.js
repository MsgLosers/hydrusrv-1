const { check, validationResult } = require('express-validator/check')
const { sanitizeParam, sanitizeQuery } = require('express-validator/filter')

const config = require('../config/app')

module.exports = {
  get: {
    inputValidationConfig: [
      sanitizeParam('mediaHash').trim(),
      check('mediaHash')
        .exists().withMessage('MissingMediaHashParameterError')
        .isString().withMessage('InvalidMediaHashParameterError')
        .isLength({ min: 1 }).withMessage('InvalidMediaHashParameterError'),
      sanitizeQuery('token').trim(),
      check('token')
        .optional()
        .exists().withMessage('MissingMediaTokenError')
        .isString().withMessage('InvalidMediaTokenError')
        .isLength({ min: 128, max: 128 }).withMessage('InvalidMediaTokenError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customName: err.array()[0].msg
        })
      }

      if (config.authenticationRequired && !req.query.token) {
        return next({
          customStatus: 400,
          customName: 'MissingMediaTokenError'
        })
      }

      next()
    }
  }
}
