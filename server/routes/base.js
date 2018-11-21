const router = require('express').Router()

const config = require('../config/app')

router.get('/', (req, res, next) => {
  res.send({
    hydrusrv: {
      version: config.version
    }
  })
})

module.exports = router
