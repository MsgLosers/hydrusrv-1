const db = require('../database')
const config = require('../config/app')
const hydrusConfig = require('../config/hydrus')
const tagsModel = require('./tags')

module.exports = {
  getById (id) {
    const file = db.app.prepare(
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

    const files = db.app.prepare(
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
        AND NOT EXISTS (
          SELECT
            *
          FROM
            hydrusrv_mappings
          INNER JOIN
            hydrusrv_tags
            ON hydrusrv_tags.id = hydrusrv_mappings.tag_id
          WHERE
            hydrusrv_mappings.file_tags_id = hydrusrv_files.tags_id
          AND
            hydrusrv_tags.name IN (
              ${',?'.repeat(excludeTags.length).replace(',', '')}
            )
        )
      `

      params = [tags, excludeTags, tags.length]
    }

    const orderBy = this.generateOrderBy(sort, direction, namespaces)

    if (!orderBy) {
      return this.getByTags(page, tags)
    }

    const files = db.app.prepare(
      `SELECT
        hydrusrv_files.id,
        hydrusrv_files.mime,
        hydrusrv_files.size,
        hydrusrv_files.width,
        hydrusrv_files.height,
        hydrusrv_files.hash
      FROM
        hydrusrv_files
      LEFT JOIN
        hydrusrv_mappings
        ON hydrusrv_mappings.file_tags_id = hydrusrv_files.tags_id
      LEFT JOIN
        hydrusrv_tags
        ON hydrusrv_tags.id = hydrusrv_mappings.tag_id
      WHERE
        hydrusrv_tags.name IN (${',?'.repeat(tags.length).replace(',', '')})
      ${excludeTagsSubQuery}
      GROUP BY
        hydrusrv_files.id
      HAVING
        count(DISTINCT hydrusrv_tags.id) = ?
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

    const files = db.app.prepare(
      `SELECT
        hydrusrv_files.id,
        hydrusrv_files.mime,
        hydrusrv_files.size,
        hydrusrv_files.width,
        hydrusrv_files.height,
        hydrusrv_files.hash
      FROM
        hydrusrv_files
      WHERE NOT EXISTS (
        SELECT
          *
        FROM
          hydrusrv_mappings
        INNER JOIN
          hydrusrv_tags
          ON hydrusrv_tags.id = hydrusrv_mappings.tag_id
        WHERE
          hydrusrv_mappings.file_tags_id = hydrusrv_files.tags_id
        AND
          hydrusrv_tags.name IN (
            ${',?'.repeat(excludeTags.length).replace(',', '')}
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
    return db.app.prepare(
      'SELECT COUNT(id) as count FROM hydrusrv_files'
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
        namespace_${namespace} ${direction || 'ASC'}`
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

    file.mime = hydrusConfig.availableMimeTypes[file.mime]
    file.mediaUrl = this.generateFilePath('original', file.hash)
    file.thumbnailUrl = this.generateFilePath('thumbnail', file.hash)

    delete file.hash

    return file
  }
}
