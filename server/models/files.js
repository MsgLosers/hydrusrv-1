const objectHash = require('object-hash')

const db = require('../db')
const config = require('../config')
const tagsModel = require('./tags')
const constraintsHelper = require('../util/constraints-helper')

module.exports = {
  getById (id) {
    const file = db.content.prepare(
      `SELECT
        id,
        hash,
        mime,
        size,
        width,
        height,
        tag_count AS tagCount
      FROM
        files
      WHERE
        id = ?`
    ).get(id)

    return this.prepareFile(file)
  },
  get (page, sort = 'id', direction = null, namespaces = []) {
    const data = {}

    const orderBy = this.generateOrderBy(sort, direction, namespaces)

    if (!orderBy) {
      return this.get(page)
    }

    data.files = db.content.prepare(
      `SELECT
        id,
        hash,
        mime,
        size,
        width,
        height,
        tag_count AS tagCount
      FROM
        files
      ORDER BY
        ${orderBy}
      LIMIT
        ${config.filesPerPage}
      OFFSET
        ${(page - 1) * config.filesPerPage}`
    ).all().map(file => this.prepareFile(file))

    if (config.countsAreEnabled) {
      let fileCount, hash

      if (config.countsCachingIsEnabled) {
        hash = objectHash({
          tags: [],
          excludeTags: [],
          constraints: []
        })

        fileCount = this.getCachedCount(hash)
      }

      if (!fileCount) {
        fileCount = db.content.prepare(
          `SELECT
            COUNT(*)
          FROM
            files`
        ).pluck().get()

        this.addCachedCount(hash, fileCount)
      }

      data.fileCount = fileCount
    }

    return data
  },
  getByTags (page, tags, sort = 'id', direction = null, namespaces = []) {
    const data = {}

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
        EXCEPT SELECT file_tags_id from mappings
        WHERE tag_id IN (
          SELECT id FROM tags
          WHERE name IN (${',?'.repeat(excludeTags.length).replace(',', '')})
        )
      `

      params = [tags, tags.length, excludeTags]
    }

    const orderBy = this.generateOrderBy(sort, direction, namespaces)

    if (!orderBy) {
      return this.getByTags(page, tags)
    }

    data.files = db.content.prepare(
      `SELECT
        files.id,
        files.hash,
        files.mime,
        files.size,
        files.width,
        files.height,
        files.tag_count AS tagCount
      FROM
        files
      WHERE
        files.tags_id IN (
          SELECT file_tags_id FROM mappings WHERE tag_id IN (
            SELECT id FROM tags
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
    ).all(...params).map(file => this.prepareFile(file))

    if (config.countsAreEnabled) {
      let fileCount, hash

      if (config.countsCachingIsEnabled) {
        hash = objectHash({
          tags: tags.sort(),
          excludeTags: excludeTags.sort(),
          constraints: []
        })

        fileCount = this.getCachedCount(hash)
      }

      if (!fileCount) {
        fileCount = db.content.prepare(
          `SELECT
            COUNT(*)
          FROM
            files
          WHERE
            files.tags_id IN (
              SELECT file_tags_id FROM mappings WHERE tag_id IN (
                SELECT id FROM tags
                WHERE name IN (${',?'.repeat(tags.length).replace(',', '')})
              )
              GROUP BY file_tags_id
              HAVING COUNT(*) = ?
              ${excludeTagsSubQuery}
            )`
        ).pluck().get(...params)

        this.addCachedCount(hash, fileCount)
      }

      data.fileCount = fileCount
    }

    return data
  },
  getByExcludeTags (
    page,
    excludeTags,
    sort = 'id',
    direction = null,
    namespaces = []
  ) {
    const data = {}

    const orderBy = this.generateOrderBy(sort, direction, namespaces)

    if (!orderBy) {
      return this.getByExcludeTags(page, excludeTags)
    }

    data.files = db.content.prepare(
      `SELECT
        files.id,
        files.hash,
        files.mime,
        files.size,
        files.width,
        files.height,
        files.tag_count AS tagCount
      FROM
        files
      WHERE
        tags_id NOT IN (
          SELECT file_tags_id FROM mappings WHERE tag_id IN (
            SELECT id FROM tags
            WHERE name IN (${',?'.repeat(excludeTags.length).replace(',', '')})
          )
        )
      OR
        tags_id IS NULL
      ORDER BY
        ${orderBy}
      LIMIT
        ${config.filesPerPage}
      OFFSET
        ${(page - 1) * config.filesPerPage}`
    ).all(excludeTags).map(file => this.prepareFile(file))

    if (config.countsAreEnabled) {
      let fileCount, hash

      if (config.countsCachingIsEnabled) {
        hash = objectHash({
          tags: [],
          excludeTags: excludeTags.sort(),
          constraints: []
        })

        fileCount = this.getCachedCount(hash)
      }

      if (!fileCount) {
        fileCount = db.content.prepare(
          `SELECT
            COUNT(*)
          FROM
            files
          WHERE
            tags_id NOT IN (
              SELECT file_tags_id FROM mappings WHERE tag_id IN (
                SELECT id FROM tags
                WHERE name IN (${',?'.repeat(excludeTags.length).replace(',', '')})
              )
            )
          OR
            tags_id IS NULL`
        ).pluck().get(excludeTags)

        this.addCachedCount(hash, fileCount)
      }

      data.fileCount = fileCount
    }

    return data
  },
  getByConstraints (
    page,
    constraints,
    sort = 'id',
    direction = null,
    namespaces = []
  ) {
    const data = {}

    const orderBy = this.generateOrderBy(sort, direction, namespaces)

    if (!orderBy) {
      return this.getByConstraints(page, constraints)
    }

    const constraintConditions = this.generateConstraintConditions(constraints)

    constraintConditions.clauses[0] = constraintConditions.clauses[0].replace(
      'AND', 'WHERE'
    )

    data.files = db.content.prepare(
      `SELECT
        id,
        hash,
        mime,
        size,
        width,
        height,
        tag_count AS tagCount
      FROM
        files
      ${constraintConditions.clauses.join(' ')}
      ORDER BY
        ${orderBy}
      LIMIT
        ${config.filesPerPage}
      OFFSET
        ${(page - 1) * config.filesPerPage}`
    ).all(...constraintConditions.params).map(file => this.prepareFile(file))

    if (config.countsAreEnabled) {
      let fileCount, hash

      if (config.countsCachingIsEnabled) {
        hash = objectHash({
          tags: [],
          excludeTags: [],
          constraints: constraints.sort()
        })

        fileCount = this.getCachedCount(hash)
      }

      if (!fileCount) {
        fileCount = db.content.prepare(
          `SELECT
            COUNT(*)
          FROM
            files
          ${constraintConditions.clauses.join(' ')}`
        ).pluck().get(...constraintConditions.params)

        this.addCachedCount(hash, fileCount)
      }

      data.fileCount = fileCount
    }

    return data
  },
  getByTagsAndConstraints (
    page,
    tags,
    constraints,
    sort = 'id',
    direction = null,
    namespaces = []
  ) {
    const data = {}

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
        return this.getByExcludeTagsAndConstraints(
          page, excludeTags, constraints, sort, direction, namespaces
        )
      }

      excludeTagsSubQuery = `
        EXCEPT SELECT file_tags_id from mappings
        WHERE tag_id IN (
          SELECT id FROM tags
          WHERE name IN (${',?'.repeat(excludeTags.length).replace(',', '')})
        )
      `

      params = [tags, tags.length, excludeTags]
    }

    const orderBy = this.generateOrderBy(sort, direction, namespaces)

    if (!orderBy) {
      return this.getByTagsAndConstraints(page, tags, constraints)
    }

    const constraintConditions = this.generateConstraintConditions(constraints)

    data.files = db.content.prepare(
      `SELECT
        files.id,
        files.hash,
        files.mime,
        files.size,
        files.width,
        files.height,
        files.tag_count AS tagCount
      FROM
        files
      WHERE
        files.tags_id IN (
          SELECT file_tags_id FROM mappings WHERE tag_id IN (
            SELECT id FROM tags
            WHERE name IN (${',?'.repeat(tags.length).replace(',', '')})
          )
          GROUP BY file_tags_id
          HAVING COUNT(*) = ?
          ${excludeTagsSubQuery}
        )
      ${constraintConditions.clauses.join(' ')}
      ORDER BY
        ${orderBy}
      LIMIT
        ${config.filesPerPage}
      OFFSET
        ${(page - 1) * config.filesPerPage}`
    ).all(...params, ...constraintConditions.params).map(
      file => this.prepareFile(file)
    )

    if (config.countsAreEnabled) {
      let fileCount, hash

      if (config.countsCachingIsEnabled) {
        hash = objectHash({
          tags: tags.sort(),
          excludeTags: excludeTags.sort(),
          constraints: constraints.sort()
        })

        fileCount = this.getCachedCount(hash)
      }

      if (!fileCount) {
        fileCount = db.content.prepare(
          `SELECT
            COUNT(*)
          FROM
            files
          WHERE
            files.tags_id IN (
              SELECT file_tags_id FROM mappings WHERE tag_id IN (
                SELECT id FROM tags
                WHERE name IN (${',?'.repeat(tags.length).replace(',', '')})
              )
              GROUP BY file_tags_id
              HAVING COUNT(*) = ?
              ${excludeTagsSubQuery}
            )
          ${constraintConditions.clauses.join(' ')}`
        ).pluck().get(...params, ...constraintConditions.params)

        this.addCachedCount(hash, fileCount)
      }

      data.fileCount = fileCount
    }

    return data
  },
  getByExcludeTagsAndConstraints (
    page,
    excludeTags,
    constraints,
    sort = 'id',
    direction = null,
    namespaces = []
  ) {
    const data = {}

    const orderBy = this.generateOrderBy(sort, direction, namespaces)

    if (!orderBy) {
      return this.getByExcludeTagsAndConstraints(
        page, excludeTags, constraints
      )
    }

    const constraintConditions = this.generateConstraintConditions(constraints)

    data.files = db.content.prepare(
      `SELECT
        files.id,
        files.hash,
        files.mime,
        files.size,
        files.width,
        files.height,
        files.tag_count AS tagCount
      FROM
        files
      WHERE (
        tags_id NOT IN (
          SELECT file_tags_id FROM mappings WHERE tag_id IN (
            SELECT id FROM tags
            WHERE name IN (${',?'.repeat(excludeTags.length).replace(',', '')})
          )
        )
        OR
          tags_id IS NULL
      )
      ${constraintConditions.clauses.join(' ')}
      ORDER BY
        ${orderBy}
      LIMIT
        ${config.filesPerPage}
      OFFSET
        ${(page - 1) * config.filesPerPage}`
    ).all(excludeTags, ...constraintConditions.params).map(
      file => this.prepareFile(file)
    )

    if (config.countsAreEnabled) {
      let fileCount, hash

      if (config.countsCachingIsEnabled) {
        hash = objectHash({
          tags: [],
          excludeTags: excludeTags.sort(),
          constraints: constraints.sort()
        })

        fileCount = this.getCachedCount(hash)
      }

      if (!fileCount) {
        fileCount = db.content.prepare(
          `SELECT
            COUNT(*)
          FROM
            files
          WHERE
            tags_id NOT IN (
              SELECT file_tags_id FROM mappings WHERE tag_id IN (
                SELECT id FROM tags
                WHERE name IN (${',?'.repeat(excludeTags.length).replace(',', '')})
              )
            )
          OR
            tags_id IS NULL
          ${constraintConditions.clauses.join(' ')}`
        ).pluck().get(excludeTags, ...constraintConditions.params)

        this.addCachedCount(hash, fileCount)
      }

      data.fileCount = fileCount
    }

    return data
  },
  getMimeTypes () {
    return db.content.prepare(
      'SELECT id AS name FROM mime_types'
    ).all().map(row => ({ name: config.availableMimeTypes[row.name] }))
  },
  getTotalCount () {
    return db.content.prepare(
      'SELECT COUNT(*) FROM files'
    ).pluck().get()
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

      return `${namespacesOrderBy.join(',')}, files.id DESC`
    }

    switch (sort) {
      case 'size':
        return `files.size ${direction || 'DESC'}`
      case 'width':
        return `files.width ${direction || 'DESC'}`
      case 'height':
        return `files.height ${direction || 'DESC'}`
      case 'mime':
        return `files.mime ${direction || 'ASC'}`
      case 'tags':
        return `files.tag_count ${direction || 'DESC'}`
      case 'random':
        return 'files.random ASC'
      default:
        return `files.id ${direction || 'DESC'}`
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
  generateConstraintConditions (constraints) {
    const orConditions = {
      id: { clauses: [], params: [] },
      hash: { clauses: [], params: [] },
      size: { clauses: [], params: [] },
      width: { clauses: [], params: [] },
      height: { clauses: [], params: [] },
      mime: { clauses: [], params: [] },
      tags: { clauses: [], params: [] }
    }
    const andConditions = {
      id: { clauses: [], params: [] },
      hash: { clauses: [], params: [] },
      size: { clauses: [], params: [] },
      width: { clauses: [], params: [] },
      height: { clauses: [], params: [] },
      mime: { clauses: [], params: [] },
      tags: { clauses: [], params: [] }
    }

    for (let constraint of constraints) {
      constraint = constraintsHelper.getConstraintParts(constraint)

      const field = constraint.field === 'tags'
        ? 'tag_count'
        : constraint.field

      switch (constraint.field) {
        case 'id':
        case 'width':
        case 'height':
        case 'tags':
          switch (constraint.comparator) {
            case '=':
            case '>':
            case '<':
              constraint.value = parseInt(constraint.value)

              orConditions[constraint.field].clauses.push(
                `files.${field} ${constraint.comparator} ?`
              )
              orConditions[constraint.field].params.push(constraint.value)

              break
            case '!=':
              constraint.value = parseInt(constraint.value)

              andConditions[constraint.field].clauses.push(
                `files.${field} ${constraint.comparator} ?`
              )
              andConditions[constraint.field].params.push(constraint.value)

              break
            case '~=':
              constraint.value = parseInt(constraint.value)

              const deviance = constraintsHelper.getDeviance(constraint.value)

              orConditions[constraint.field].clauses.push(
                `(files.${field} >= ? AND files.${field} <= ?)`
              )
              orConditions[constraint.field].params.push(
                Math.round(constraint.value - deviance)
              )
              orConditions[constraint.field].params.push(
                Math.round(constraint.value + deviance)
              )

              break
            case '><':
              const rangeValues = constraint.value.split(',').map(
                value => parseInt(value)
              )

              rangeValues.sort((a, b) => a - b)

              orConditions[constraint.field].clauses.push(
                `files.${field} > ? AND files.${field} < ?`
              )
              orConditions[constraint.field].params.push(rangeValues[0])
              orConditions[constraint.field].params.push(rangeValues[1])
          }

          break
        case 'size':
          switch (constraint.comparator) {
            case '=':
            case '>':
            case '<':
              constraint.value = constraintsHelper.getSizeInBytes(
                constraint.value
              )

              orConditions[constraint.field].clauses.push(
                `files.${field} ${constraint.comparator} ?`
              )
              orConditions[constraint.field].params.push(constraint.value)

              break
            case '!=':
              constraint.value = constraintsHelper.getSizeInBytes(
                constraint.value
              )

              andConditions[constraint.field].clauses.push(
                `files.${field} ${constraint.comparator} ?`
              )
              andConditions[constraint.field].params.push(constraint.value)

              break
            case '~=':
              constraint.value = constraintsHelper.getSizeInBytes(
                constraint.value
              )

              const deviance = constraintsHelper.getDeviance(constraint.value)

              orConditions[constraint.field].clauses.push(
                `(files.${field} >= ? AND files.${field} <= ?)`
              )
              orConditions[constraint.field].params.push(
                Math.round(constraint.value - deviance)
              )
              orConditions[constraint.field].params.push(
                Math.round(constraint.value + deviance)
              )

              break
            case '><':
              const rangeValues = constraint.value.split(',').map(
                value => constraintsHelper.getSizeInBytes(value)
              )

              rangeValues.sort((a, b) => a - b)

              orConditions[constraint.field].clauses.push(
                `files.${field} > ? AND files.${field} < ?`
              )
              orConditions[constraint.field].params.push(rangeValues[0])
              orConditions[constraint.field].params.push(rangeValues[1])
          }

          break
        case 'hash':
          switch (constraint.comparator) {
            case '=':
              orConditions[constraint.field].clauses.push(
                `files.${field} ${constraint.comparator} ?`
              )
              orConditions[constraint.field].params.push(constraint.value)

              break
            case '!=':
              andConditions[constraint.field].clauses.push(
                `files.${field} ${constraint.comparator} ?`
              )
              andConditions[constraint.field].params.push(constraint.value)
          }

          break
        case 'mime':
          switch (constraint.comparator) {
            case '=':
              orConditions[constraint.field].clauses.push(
                `files.${field} ${constraint.comparator} ?`
              )
              orConditions[constraint.field].params.push(
                constraintsHelper.getMimeId(constraint.value)
              )

              break
            case '!=':
              andConditions[constraint.field].clauses.push(
                `files.${field} ${constraint.comparator} ?`
              )
              andConditions[constraint.field].params.push(
                constraintsHelper.getMimeId(constraint.value)
              )
          }
      }
    }

    const keys = ['id', 'hash', 'size', 'width', 'height', 'mime', 'tags']

    for (const key of keys) {
      if (orConditions.hasOwnProperty(key)) {
        if (!orConditions[key].clauses.length) {
          delete orConditions[key]
        }
      }

      if (andConditions.hasOwnProperty(key)) {
        if (!andConditions[key].clauses.length) {
          delete andConditions[key]
        }
      }
    }

    const constraintClauses = []
    const constraintParams = []

    for (const key of keys) {
      if (orConditions.hasOwnProperty(key)) {
        constraintClauses.push('AND (')

        if (andConditions.hasOwnProperty(key)) {
          constraintClauses.push('(')
          constraintClauses.push(andConditions[key].clauses.join(' AND '))
          constraintClauses.push(')')
          constraintClauses.push(' AND (')

          constraintParams.push(...andConditions[key].params)
        }

        constraintClauses.push(orConditions[key].clauses.join(' OR '))
        constraintClauses.push(')')

        if (andConditions.hasOwnProperty(key)) {
          constraintClauses.push(')')
        }

        constraintParams.push(...orConditions[key].params)
      } else if (andConditions.hasOwnProperty(key)) {
        constraintClauses.push('AND (')
        constraintClauses.push(andConditions[key].clauses.join(' AND '))
        constraintClauses.push(')')

        constraintParams.push(...andConditions[key].params)
      }
    }

    return {
      clauses: constraintClauses,
      params: constraintParams
    }
  },
  generateFilePath (type, hash) {
    if (type === 'thumbnail') {
      return `${config.url}${config.mediaBase}/thumbnails/${hash}`
    }

    return `${config.url}${config.mediaBase}/original/${hash}`
  },
  prepareFile (file) {
    if (!file) {
      return file
    }

    file.mime = config.availableMimeTypes[file.mime]
    file.mediaUrl = this.generateFilePath('original', file.hash)
    file.thumbnailUrl = this.generateFilePath('thumbnail', file.hash)

    return file
  },
  getCachedCount (hash) {
    return db.content.prepare(
      `SELECT
        count
      FROM
        file_counts
      WHERE
        hash = ?`
    ).pluck().get(hash)
  },
  addCachedCount (hash, fileCount) {
    if (!config.countsCachingIsEnabled) {
      return
    }

    db.content.prepare(
      'INSERT OR IGNORE INTO file_counts (hash, count) VALUES (?, ?)'
    ).run(hash, fileCount)
  }
}
