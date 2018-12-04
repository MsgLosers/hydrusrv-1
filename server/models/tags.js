const db = require('../db')
const config = require('../config')

module.exports = {
  get (page, sort = 'id', direction = null) {
    const orderBy = this.generateOrderBy(sort, direction)

    return db.content.prepare(
      `SELECT
        name,
        file_count AS fileCount
      FROM
        tags
      ORDER BY
        ${orderBy.method}
      LIMIT
        ${config.tagsPerPage}
      OFFSET
        ${(page - 1) * config.tagsPerPage}`
    ).all(...orderBy.params)
  },
  getContaining (page, contains, sort = 'id', direction = null) {
    contains = contains.split('_').join('^_')

    const orderBy = this.generateOrderBy(sort, direction, contains)

    return db.content.prepare(
      `SELECT
        name,
        file_count AS fileCount
      FROM
        tags
      WHERE
        name LIKE ? ESCAPE '^'
      ORDER BY
        ${orderBy.method}
      LIMIT
        ${config.tagsPerPage}
      OFFSET
        ${(page - 1) * config.tagsPerPage}`
    ).all(`%${contains}%`, ...orderBy.params)
  },
  getOfFile (fileId) {
    return db.content.prepare(
      `SELECT
        tags.name,
        tags.file_count AS fileCount
      FROM
        files
      LEFT JOIN
        mappings
        ON
          mappings.file_tags_id = files.tags_id
      LEFT JOIN
        tags
        ON
          tags.id = mappings.tag_id
      WHERE
        files.id = ?
      ORDER BY
        tags.name`
    ).all(fileId)
  },
  complete (partialTag) {
    partialTag = partialTag.split('_').join('^_')

    return db.content.prepare(
      `SELECT
        name,
        file_count AS fileCount
      FROM
        tags
      WHERE
        name LIKE ? ESCAPE '^'
      ORDER BY
        CASE
          WHEN name LIKE ? ESCAPE '^' THEN 0
          ELSE 1
        END,
        file_count DESC
      LIMIT
        ${config.autocompleteLimit}`
    ).all(`%${partialTag}%`, `${partialTag}`)
  },
  getNamespaces () {
    return db.content.prepare(
      'SELECT name FROM namespaces ORDER BY name'
    ).all()
  },
  getTotalCount () {
    return db.content.prepare(
      'SELECT COUNT(*) as count FROM tags'
    ).get()
  },
  generateOrderBy (sort, direction, contains = null) {
    direction = ['asc', 'desc'].includes(direction) ? direction : null

    if (sort === 'contains' && contains) {
      return {
        method: `
          CASE
            WHEN name LIKE ? ESCAPE '^' THEN 0
            ELSE 1
          END,
          name ${direction || 'ASC'}
        `,
        params: [`${contains}%`]
      }
    }

    switch (sort) {
      case 'name':
      case 'contains':
        return {
          method: `name ${direction || 'ASC'}`,
          params: []
        }
      case 'files':
        return {
          method: `file_count ${direction || 'DESC'}`,
          params: []
        }
      case 'random':
        return {
          method: 'random ASC',
          params: []
        }
      default:
        return {
          method: `id ${direction || 'DESC'}`,
          params: []
        }
    }
  }
}
