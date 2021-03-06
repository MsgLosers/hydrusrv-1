const router = require('express').Router()

const config = require('../config')
const middleware = require('../middleware')
const controllers = require('../controllers')
const mediaHelper = require('../util/media-helper')

router.get('/original/:mediaHash',
  middleware.media.get.inputValidationConfig,
  middleware.media.get.validateInput,
  async (req, res, next) => {
    if (config.authenticationIsRequired) {
      try {
        if (!controllers.authentication.isValidMediaToken(req.query.token)) {
          return next({
            customStatus: 404,
            customName: 'NotFoundError'
          })
        }
      } catch (err) {
        return next(err)
      }
    }

    if (!mediaHelper.fileExists('original', req.params.mediaHash)) {
      return next()
    }

    const fileData = await mediaHelper.getFileData(
      'original', req.params.mediaHash
    )

    res.sendFile(fileData.path, {
      headers: {
        'Content-Type': fileData.mimeType
      }
    })
  }
)

router.get('/thumbnails/:mediaHash',
  middleware.media.get.inputValidationConfig,
  middleware.media.get.validateInput,
  async (req, res, next) => {
    if (config.authenticationIsRequired) {
      try {
        if (!controllers.authentication.isValidMediaToken(req.query.token)) {
          return next({
            customStatus: 404,
            customName: 'NotFoundError'
          })
        }
      } catch (err) {
        return next(err)
      }
    }

    if (!mediaHelper.fileExists('thumbnail', req.params.mediaHash)) {
      return next()
    }

    const fileData = await mediaHelper.getFileData(
      'thumbnail', req.params.mediaHash
    )

    res.sendFile(fileData.path, {
      headers: {
        'Content-Type': fileData.mimeType
      }
    })
  }
)

module.exports = router
