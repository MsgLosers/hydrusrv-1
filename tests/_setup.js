const path = require('path')

module.exports = {
  setTestEnvironment () {
    process.env.NODE_ENV = 'test'
    process.env.URL = 'http://localhost'
    process.env.AUTHENTICATION_DB_PATH = path.resolve(
      __dirname, 'storage/authentication.db'
    )
    process.env.CONTENT_DB_PATH = path.resolve(__dirname, 'storage/content.db')
    process.env.HYDRUS_FILES_PATH = path.resolve(
      __dirname, 'hydrus-server-dummy/server_files'
    )
    process.env.FILES_PER_PAGE = 4
    process.env.TAGS_PER_PAGE = 4
  }
}
