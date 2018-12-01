const path = require('path')

module.exports = {
  setTestEnvironment () {
    process.env.NODE_ENV = 'test'

    process.env.URL = 'http://localhost'
    process.env.API_BASE = '/api'
    process.env.MEDIA_BASE = '/media'

    process.env.AUTHENTICATION_DB_PATH = path.resolve(
      __dirname, 'storage/authentication.db'
    )
    process.env.CONTENT_DB_PATH = path.resolve(__dirname, 'storage/content.db')

    process.env.REGISTRATION_ENABLED = true
    process.env.MIN_PASSWORD_LENGTH = 16
    process.env.DATA_UPDATE_INTERVAL = 3600
    process.env.FILES_PER_PAGE = 4
    process.env.TAGS_PER_PAGE = 4
    process.env.ACCESS_LOGGING_ENABLED = false
    process.env.OVERRIDE_ACCESS_LOGFILE_PATH = path.resolve(
      __dirname, '../server/logs/access.log'
    )

    process.env.HYDRUS_FILES_PATH = path.resolve(
      __dirname, 'hydrus-server-dummy/server_files'
    )
  }
}
