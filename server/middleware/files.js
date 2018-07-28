const { check, validationResult } = require('express-validator/check')
const { sanitizeParam, sanitizeQuery } = require('express-validator/filter')

module.exports = {
  get: {
    inputValidationConfig: [
      sanitizeQuery('page').trim(),
      check('page')
        .exists().withMessage('MissingPageParameterError')
        .isInt({ min: 1 }).withMessage('InvalidPageParameterError'),
      sanitizeQuery('tags').trim(),
      check('tags')
        .optional()
        .isArray().withMessage('InvalidTagsParameterError')
        .isLength({ min: 1 }).withMessage('InvalidTagsParameterError'),
      sanitizeQuery('sort').trim(),
      check('sort')
        .optional()
        .isString().withMessage('InvalidSortParameterError')
        .isLength({ min: 1 }).withMessage('InvalidSortParameterError')
        .isIn(
          ['id', 'size', 'width', 'height', 'random', 'namespace']
        ).withMessage('InvalidSortParameterError'),
      sanitizeQuery('namespace').trim(),
      check('namespace')
        .optional()
        .isArray().withMessage('InvalidNamespaceParameterError')
        .isLength({ min: 1 }).withMessage('InvalidNamespaceParameterError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customName: err.array()[0].msg
        })
      }

      if (req.query.sort === 'namespace' && (!req.query.namespace)) {
        return next({
          customStatus: 400,
          customName: 'MissingNamespaceParameterError'
        })
      }

      next()
    }
  },
  getSingle: {
    inputValidationConfig: [
      sanitizeParam('id').trim(),
      check('id')
        .exists().withMessage('MissingIdParameterError')
        .isInt({ min: 1 }).withMessage('InvalidIdParameterError')
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
