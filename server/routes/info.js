const router = require('express').Router()

const config = require('../config')
const middleware = require('../middleware')
const controllers = require('../controllers')

router.get('/',
  ...(config.authenticationIsRequired
    ? [middleware.authentication.validateToken]
    : []
  ),
  (req, res, next) => {
    const data = {}

    try {
      data.tags = controllers.tags.getTotalTagCount()
    } catch (err) {
      return next(err)
    }

    try {
      data.files = controllers.files.getTotalFileCount()
    } catch (err) {
      return next(err)
    }

    res.send({
      tagCount: data.tags.count,
      fileCount: data.files.count
    })
  }
)

module.exports = router
