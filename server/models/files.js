const db = require('../db')
const config = require('../config')
const tagsModel = require('./tags')

module.exports = {
  getById (id) {
    const file = db.content.prepare(
      `SELECT
        id,
        mime,
        size,
        width,
        height,
        hash
      FROM
        hydrusrv_files
      WHERE
        id = ?`
    ).get(id)

    return this.prepareFile(file)
  },
  get (page, sort = 'id', direction = null, namespaces = []) {
    const orderBy = this.generateOrderBy(sort, direction, namespaces)

    if (!orderBy) {
      return this.get(page)
    }

    const files = db.content.prepare(
      `SELECT
        id,
        mime,
        size,
        width,
        height,
        hash
      FROM
        hydrusrv_files
      ORDER BY
        ${orderBy}
      LIMIT
        ${config.filesPerPage}
      OFFSET
        ${(page - 1) * config.filesPerPage}`
    ).all()

    return files.map(file => this.prepareFile(file))
  },
  getByTags (page, tags, sort = 'id', direction = null, namespaces = []) {
    tags = [...new Set(tags)]

    let excludeTagsSubQuery = ''
    let params = [tags, tags.length]

    const excludeTags = tags.filter(
      tag => tag.startsWith('-')
    ).map(
      tag => tag.replace('-', '')
    )

    tags = tags.filter(tag => !tag.startsWith('-'))
    tags = tags.map(tag => tag.replace('\\-', '-'))

    if (excludeTags.length) {
      if (!tags.length) {
        return this.getByExcludeTags(
          page, excludeTags, sort, direction, namespaces
        )
      }

      excludeTagsSubQuery = `
        EXCEPT SELECT file_tags_id from hydrusrv_mappings
        WHERE tag_id IN (
          SELECT id FROM hydrusrv_tags
          WHERE name IN (${',?'.repeat(excludeTags.length).replace(',', '')})
        )
      `

      params = [tags, tags.length, excludeTags]
    }

    const orderBy = this.generateOrderBy(sort, direction, namespaces)

    if (!orderBy) {
      return this.getByTags(page, tags)
    }

    const files = db.content.prepare(
      `SELECT
        hydrusrv_files.id,
        hydrusrv_files.mime,
        hydrusrv_files.size,
        hydrusrv_files.width,
        hydrusrv_files.height,
        hydrusrv_files.hash
      FROM
        hydrusrv_files
      WHERE
        hydrusrv_files.tags_id IN (
          SELECT file_tags_id FROM hydrusrv_mappings
          WHERE tag_id IN (
            SELECT id FROM hydrusrv_tags
            WHERE name IN (${',?'.repeat(tags.length).replace(',', '')})
          )
          GROUP BY file_tags_id
          HAVING COUNT(*) = ?
          ${excludeTagsSubQuery}
        )
      ORDER BY
        ${orderBy}
      LIMIT
        ${config.filesPerPage}
      OFFSET
        ${(page - 1) * config.filesPerPage}`
    ).all(...params)

    return files.map(file => this.prepareFile(file))
  },
  getByExcludeTags (
    page,
    excludeTags,
    sort = 'id',
    direction = null,
    namespaces = []
  ) {
    const orderBy = this.generateOrderBy(sort, direction, namespaces)

    if (!orderBy) {
      return this.getByExcludeTags(page, excludeTags)
    }

    const files = db.content.prepare(
      `SELECT
        hydrusrv_files.id,
        hydrusrv_files.mime,
        hydrusrv_files.size,
        hydrusrv_files.width,
        hydrusrv_files.height,
        hydrusrv_files.hash
      FROM
        hydrusrv_files
      WHERE
        tags_id IN (
          SELECT tags_id FROM hydrusrv_files WHERE tags_id NOT IN (
            SELECT file_tags_id FROM hydrusrv_mappings WHERE tag_id IN (
              SELECT id FROM hydrusrv_tags
              WHERE name IN (${',?'.repeat(excludeTags.length).replace(',', '')})
            )
          )

          UNION

          SELECT tags_id FROM hydrusrv_files WHERE tags_id NOT IN (
            SELECT file_tags_id FROM hydrusrv_mappings
          )
        )
      ORDER BY
        ${orderBy}
      LIMIT
        ${config.filesPerPage}
      OFFSET
        ${(page - 1) * config.filesPerPage}`
    ).all(excludeTags)

    return files.map(file => this.prepareFile(file))
  },
  getTotalCount () {
    return db.content.prepare(
      'SELECT COUNT(*) as count FROM hydrusrv_files'
    ).get()
  },
  generateOrderBy (sort, direction, namespaces) {
    direction = ['asc', 'desc'].includes(direction) ? direction : null

    if (sort === 'namespaces' && namespaces.length) {
      const namespacesOrderBy = this.generateNamespacesOrderBy(
        namespaces, direction
      )

      if (!namespacesOrderBy.length) {
        return null
      }

      return `${namespacesOrderBy.join(',')}, hydrusrv_files.id DESC`
    }

    switch (sort) {
      case 'size':
        return `hydrusrv_files.size ${direction || 'DESC'}`
      case 'width':
        return `hydrusrv_files.width ${direction || 'DESC'}`
      case 'height':
        return `hydrusrv_files.height ${direction || 'DESC'}`
      case 'mime':
        return `hydrusrv_files.mime ${direction || 'ASC'}`
      case 'random':
        return 'hydrusrv_files.random ASC'
      default:
        return `hydrusrv_files.id ${direction || 'DESC'}`
    }
  },
  generateNamespacesOrderBy (namespaces, direction) {
    namespaces = [...new Set(namespaces)]

    const validNamespaces = tagsModel.getNamespaces().map(
      namespace => namespace.name
    )

    namespaces = namespaces.filter(
      namespace => validNamespaces.includes(namespace)
    )

    if (!namespaces.length) {
      return []
    }

    const namespacesOrderBy = []

    for (let namespace of namespaces) {
      namespace = namespace.split(' ').join('_')

      namespacesOrderBy.push(
        `CASE
          WHEN namespace_${namespace} IS NULL THEN 1
          ELSE 0
        END,
        CASE
          WHEN namespace_${namespace} GLOB '*[^0-9]*'
            THEN namespace_${namespace}
          ELSE CAST(namespace_${namespace} AS DECIMAL)
        END ${direction || 'ASC'}`
      )
    }

    return namespacesOrderBy
  },
  generateFilePath (type, hash) {
    if (type === 'thumbnail') {
      return `${config.url}${config.mediaBase}/thumbnails/` +
        hash.toString('hex')
    }

    return `${config.url}${config.mediaBase}/original/${hash.toString('hex')}`
  },
  prepareFile (file) {
    if (!file) {
      return file
    }

    file.mime = config.availableMimeTypes[file.mime]
    file.mediaUrl = this.generateFilePath('original', file.hash)
    file.thumbnailUrl = this.generateFilePath('thumbnail', file.hash)

    delete file.hash

    return file
  }
}
