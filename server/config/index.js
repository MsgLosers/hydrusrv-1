const path = require('path')

let authenticationDbPath = process.env.AUTHENTICATION_DB_PATH

if (authenticationDbPath.startsWith('.')) {
  authenticationDbPath = path.resolve(__dirname, '../..', authenticationDbPath)
}

let contentDbPath = process.env.CONTENT_DB_PATH

if (contentDbPath.startsWith('.')) {
  contentDbPath = path.resolve(__dirname, '../..', contentDbPath)
}

module.exports = {
  version: '4.4.0',
  url: process.env.URL,
  port: process.env.PORT || 8000,
  apiBase: process.env.API_BASE || '/api',
  mediaBase: process.env.MEDIA_BASE || '/media',
  allowCrossOrigin: (process.env.ALLOW_CROSS_ORIGIN === 'true'),
  authenticationDbPath: authenticationDbPath,
  contentDbPath: contentDbPath,
  hydrusFilesPath: process.env.HYDRUS_FILES_PATH,
  numberOfWorkers: process.env.NUMBER_OF_WORKERS || require('os').cpus().length,
  dbCheckpointInterval: process.env.DB_CHECKPOINT_INTERVAL || 3600,
  registrationEnabled: (process.env.REGISTRATION_ENABLED === 'true'),
  authenticationRequired: process.env.AUTHENTICATION_REQUIRED
    ? (process.env.AUTHENTICATION_REQUIRED === 'true')
    : true,
  minPasswordLength: process.env.MIN_PASSWORD_LENGTH || 16,
  filesPerPage: process.env.FILES_PER_PAGE || 42,
  tagsPerPage: process.env.TAGS_PER_PAGE || 42,
  autocompleteLimit: process.env.AUTOCOMPLETE_LIMIT || 10,
  accessLoggingEnabled: (process.env.ACCESS_LOGGING_ENABLED === 'true'),
  accessLogfilePath: process.env.OVERRIDE_ACCESS_LOGFILE_PATH ||
    path.resolve(__dirname, '../../logs/access.log'),
  availableMimeTypes: {
    1: 'image/jpeg',
    2: 'image/png',
    3: 'image/gif',
    4: 'image/bmp',
    9: 'video/x-flv',
    14: 'video/mp4',
    18: 'video/x-ms-wmv',
    20: 'video/x-matroska',
    21: 'video/webm',
    23: 'image/apng',
    25: 'video/mpeg',
    26: 'video/quicktime',
    27: 'video/x-msvideo'
  }
}
