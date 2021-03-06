const config = require('../config')
const infoRouter = require('./info')
const usersRouter = require('./users')
const tokensRouter = require('./tokens')
const namespacesRouter = require('./namespaces')
const mimeTypesRouter = require('./mime-types')
const tagsRouter = require('./tags')
const autocompleteRouter = require('./autocomplete')
const filesRouter = require('./files')
const mediaRouter = require('./media')
const baseRouter = require('./base')

module.exports = app => {
  app.use(`${config.apiBase}/info`, infoRouter)
  app.use(`${config.apiBase}/users`, usersRouter)
  app.use(`${config.apiBase}/tokens`, tokensRouter)
  app.use(`${config.apiBase}/namespaces`, namespacesRouter)
  app.use(`${config.apiBase}/mime-types`, mimeTypesRouter)
  app.use(`${config.apiBase}/tags`, tagsRouter)
  app.use(`${config.apiBase}/autocomplete-tag`, autocompleteRouter)
  app.use(`${config.apiBase}/files`, filesRouter)
  app.use(config.mediaBase, mediaRouter)
  app.use(config.apiBase, baseRouter)
}
