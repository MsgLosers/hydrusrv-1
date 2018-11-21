const router = require('express').Router()

const middleware = require('../middleware')
const controllers = require('../controllers')

router.get('/',
  middleware.auth.validateToken,
  middleware.files.get.inputValidationConfig,
  middleware.files.get.validateInput,
  (req, res, next) => {
    const data = {}

    try {
      data.files = controllers.files.getFiles(req.query)
    } catch (err) {
      return next(err)
    }

    res.send(data.files)
  }
)

router.get('/:id',
  middleware.auth.validateToken,
  middleware.files.getSingle.inputValidationConfig,
  middleware.files.getSingle.validateInput,
  (req, res, next) => {
    const data = {}

    try {
      data.file = controllers.files.getFileById(req.params.id)
    } catch (err) {
      return next(err)
    }

    if (!data.file) {
      return next({
        customStatus: 404,
        customName: 'NotFoundError'
      })
    }

    let tags

    try {
      tags = controllers.tags.getTagsOfFile(req.params.id)
    } catch (err) {
      return next(err)
    }

    data.file.tags = tags

    res.send(data.file)
  }
)

module.exports = router
