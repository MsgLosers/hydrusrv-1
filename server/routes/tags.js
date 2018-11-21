const router = require('express').Router()

const middleware = require('../middleware')
const controllers = require('../controllers')

router.get('/',
  middleware.auth.validateToken,
  middleware.tags.get.inputValidationConfig,
  middleware.tags.get.validateInput,
  (req, res, next) => {
    const data = {}

    try {
      data.tags = controllers.tags.getTags(req.query)
    } catch (err) {
      return next(err)
    }

    res.send(data.tags)
  }
)

module.exports = router
