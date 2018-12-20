const files = require('../models/files')

module.exports = {
  getFiles (query) {
    if (query.tags) {
      return query.constraints
        ? files.getByTagsAndConstraints(
          query.page,
          query.tags,
          query.constraints,
          query.sort || 'id',
          query.direction || null,
          query.namespaces || []
        )
        : files.getByTags(
          query.page,
          query.tags,
          query.sort || 'id',
          query.direction || null,
          query.namespaces || []
        )
    }

    return query.constraints
      ? files.getByConstraints(
        query.page,
        query.constraints,
        query.sort || 'id',
        query.direction || null,
        query.namespaces || []
      )
      : files.get(
        query.page,
        query.sort || 'id',
        query.direction || null,
        query.namespaces || []
      )
  },
  getTotalFileCount () {
    return files.getTotalCount()
  },
  getFileById (id) {
    return files.getById(id)
  }
}
