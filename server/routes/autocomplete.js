const router = require('express').Router()

const middleware = require('../middleware')
const controllers = require('../controllers')

router.post('/',
  middleware.auth.validateToken,
  middleware.tags.autocomplete.inputValidationConfig,
  middleware.tags.autocomplete.validateInput,
  (req, res, next) => {
    const data = {}

    try {
      data.tags = controllers.tags.completeTag(req.body.partialTag)
    } catch (err) {
      return next(err)
    }

    res.send(data.tags)
  }
)

module.exports = router
