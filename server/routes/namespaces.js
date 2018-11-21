const router = require('express').Router()

const middleware = require('../middleware')
const controllers = require('../controllers')

router.get('/',
  middleware.auth.validateToken,
  (req, res, next) => {
    const data = {}

    try {
      data.namespaces = controllers.tags.getNamespaces()
    } catch (err) {
      return next(err)
    }

    res.send(data.namespaces)
  }
)

module.exports = router
