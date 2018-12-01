const router = require('express').Router()

const config = require('../config')
const middleware = require('../middleware')
const controllers = require('../controllers')
const media = require('../util/media')

router.get('/original/:mediaHash',
  middleware.media.get.inputValidationConfig,
  middleware.media.get.validateInput,
  async (req, res, next) => {
    if (config.authenticationRequired) {
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

    if (!media.fileExists('original', req.params.mediaHash)) {
      return next()
    }

    const fileData = await media.getFileData(
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
    if (config.authenticationRequired) {
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

    if (!media.fileExists('thumbnail', req.params.mediaHash)) {
      return next()
    }

    const fileData = await media.getFileData(
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
