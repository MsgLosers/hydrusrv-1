const config = require('../config/app')
const db = require('../database')
const hydrusConfig = require('../config/hydrus')
const hydrusTables = require('../config/hydrus-db-tables')
const profiler = require('./profiler')

module.exports = {
  sync (keepTablesAfterError = false) {
    if (db.updatingData) {
      return
    }

    db.updatingData = true

    let updateSuccessful = true

    profiler.init()

    profiler.log('{datetime}: updating db...\n')

    db.attachHydrusDatabases()

    try {
      const namespaces = this.getNamespaces()
      profiler.log('get namespaces: {dt}\n')

      this.createTempNamespacesTable()
      this.createTempTagsTable()
      this.createTempFilesTable(namespaces)
      this.createTempMappingsTable()

      this.fillTempNamespacesTable(namespaces)
      profiler.log('fill temporary namespaces table: {dt}\n')

      this.fillTempTagsTable()
      profiler.log('fill temporary tags table: {dt}\n')

      this.fillTempFilesTable(namespaces)
      profiler.log('fill temporary files table: {dt}\n')

      this.fillTempMappingsTable()
      profiler.log('fill temporary mappings table: {dt}\n')
    } catch (err) {
      updateSuccessful = false

      console.warn(
        'hydrus server has no repositories set up yet or there has been an ' +
          'error. This can happen if, for example, hydrus server was in the ' +
          'process of writing data while hydrusrv tried to read. hydrusrv ' +
          'will try updating again after the period set via ' +
          `\`DATA_UPDATE_INTERVAL\` (${config.dataUpdateInterval} seconds) ` +
          `has passed. Error:\n${err.stack}`
      )
    }

    db.detachHydrusDatabases()

    profiler.log()

    if (updateSuccessful) {
      this.replaceCurrentTempTables()
      profiler.log('replace current temporary tables: {dt}\n')
    } else if (keepTablesAfterError) {
      this.dropTempTables()

      this.createTempNamespacesTable()
      this.createTempTagsTable()
      this.createTempFilesTable()
      this.createTempMappingsTable()

      this.replaceCurrentTempTables()
    }

    profiler.log(`total: {t}\n\n`)

    if (process.env.NODE_ENV === 'development') {
      const totals = []

      db.app.prepare(
        `SELECT COUNT(*) FROM hydrusrv_namespaces
          UNION
        SELECT COUNT(*) FROM hydrusrv_files
          UNION
        SELECT COUNT(*) FROM hydrusrv_tags
          UNION
        SELECT COUNT(*) FROM hydrusrv_mappings`
      ).all().map((s, i) => {
        totals[['namespaces', 'files', 'tags', 'mappings'][i]] = s['COUNT(*)']
      })

      console.info(totals)
    }

    db.updatingData = false
  },
  replaceCurrentTempTables () {
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_namespaces').run()
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_mappings').run()
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_tags').run()
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_files').run()

    db.app.prepare(
      'ALTER TABLE hydrusrv_namespaces_new RENAME TO hydrusrv_namespaces'
    ).run()

    db.app.prepare(
      'ALTER TABLE hydrusrv_tags_new RENAME TO hydrusrv_tags'
    ).run()

    db.app.prepare(
      'ALTER TABLE hydrusrv_files_new RENAME TO hydrusrv_files'
    ).run()

    db.app.prepare(
      'ALTER TABLE hydrusrv_mappings_new RENAME TO hydrusrv_mappings'
    ).run()
  },
  dropTempTables () {
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_namespaces_new').run()
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_mappings_new').run()
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_tags_new').run()
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_files_new').run()
  },
  createTempNamespacesTable () {
    db.app.prepare(
      `CREATE TEMP TABLE hydrusrv_namespaces_new (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        name TEXT NOT NULL UNIQUE
      )`
    ).run()
  },
  fillTempNamespacesTable (namespaces) {
    for (const namespace of namespaces) {
      db.app.prepare(
        'INSERT INTO hydrusrv_namespaces_new (name) VALUES (?)'
      ).run(namespace)
    }
  },
  createTempTagsTable () {
    db.app.prepare(
      `CREATE TEMP TABLE hydrusrv_tags_new (
        id INTEGER NOT NULL PRIMARY KEY UNIQUE,
        name TEXT NOT NULL UNIQUE,
        file_count INTEGER NOT NULL,
        random TEXT NOT NULL
      )`
    ).run()
  },
  fillTempTagsTable () {
    db.app.prepare(
      `INSERT INTO hydrusrv_tags_new
        SELECT
          ${hydrusTables.currentMappings}.service_tag_id AS id,
          ${hydrusTables.tags}.tag AS name,
          COUNT(*) AS fileCount,
          SUBSTR(''||random(), -4) AS random
        FROM
          ${hydrusTables.currentMappings}
        NATURAL JOIN
          ${hydrusTables.repositoryTagIdMap}
        NATURAL JOIN
          ${hydrusTables.tags}
        NATURAL JOIN
          ${hydrusTables.repositoryHashIdMapTags}
        NATURAL JOIN
          ${hydrusTables.filesInfo}
        WHERE
          ${hydrusTables.filesInfo}.mime IN (${hydrusConfig.supportedMimeTypes})
        GROUP BY
          ${hydrusTables.tags}.tag`
    ).run()
  },
  createTempFilesTable (namespaces) {
    const namespaceColumns = []

    if (Array.isArray(namespaces)) {
      for (const namespace of namespaces) {
        namespaceColumns.push(
          `namespace_${namespace.split(' ').join('_')} TEXT`
        )
      }
    }

    db.app.prepare(
      `CREATE TEMP TABLE hydrusrv_files_new (
        id INTEGER NOT NULL PRIMARY KEY UNIQUE,
        tags_id INTEGER UNIQUE DEFAULT NULL,
        mime INTEGER NOT NULL,
        size INTEGER NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        hash blob_bytes UNIQUE NOT NULL,
        random text NOT NULL
        ${namespaceColumns.length ? ',' + namespaceColumns.join(',') : ''}
      )`
    ).run()
  },
  fillTempFilesTable (namespaces) {
    const namespaceColumns = []

    for (const namespace of namespaces) {
      namespaceColumns.push(
        `namespace_${namespace.split(' ').join('_')}`
      )
    }

    db.app.prepare(
      `INSERT INTO hydrusrv_files_new (
        id,
        tags_id,
        mime,
        size,
        width,
        height,
        hash,
        random
        ${namespaceColumns.length ? ',' + namespaceColumns.join(',') : ''}
      )
        SELECT
          ${hydrusTables.currentFiles}.service_hash_id AS id,
          ${hydrusTables.repositoryHashIdMapTags}.service_hash_id AS tags_id,
          ${hydrusTables.filesInfo}.mime,
          ${hydrusTables.filesInfo}.size,
          ${hydrusTables.filesInfo}.width,
          ${hydrusTables.filesInfo}.height,
          ${hydrusTables.hashes}.hash,
          SUBSTR(''||random(), -4) AS random
          ${namespaceColumns.length ? ', null AS ' + namespaceColumns.join(', null AS') : ''}
        FROM
          ${hydrusTables.hashes}
        NATURAL JOIN
          ${hydrusTables.filesInfo}
        NATURAL JOIN
          ${hydrusTables.repositoryHashIdMapFiles}
        LET JOIN
          ${hydrusTables.repositoryHashIdMapTags}
          ON ${hydrusTables.repositoryHashIdMapTags}.master_hash_id =
            ${hydrusTables.hashes}.master_hash_id
        NATURAL JOIN
          ${hydrusTables.currentFiles}
        WHERE
          ${hydrusTables.filesInfo}.mime IN (${hydrusConfig.supportedMimeTypes})`
    ).run()

    db.app.prepare(
      `CREATE TEMP TABLE namespaces_reduced_subquery AS
        SELECT
          master_tag_id, tag
        FROM
          ${hydrusTables.tags}
        WHERE
          tag LIKE '%_:_%'`
    ).run()

    const selectStatement = db.app.prepare(
      `SELECT
        REPLACE(namespaces_reduced_subquery.tag, :namespace, '') AS tag,
        ${hydrusTables.repositoryHashIdMapTags}.service_hash_id AS tags_id
      FROM
        ${hydrusTables.currentMappings}
      NATURAL JOIN
        ${hydrusTables.repositoryTagIdMap}
      NATURAL JOIN
        namespaces_reduced_subquery
      NATURAL JOIN
        ${hydrusTables.repositoryHashIdMapTags}
      WHERE
        namespaces_reduced_subquery.tag LIKE :namespace || '_%'
      GROUP BY tags_id`
    )

    const updateStatements = []

    namespaces.map((namespace, i) => {
      updateStatements[namespaces[i]] = db.app.prepare(
        `UPDATE hydrusrv_files_new
          SET
            namespace_${namespace.replace(' ', '_')} = :tag
          WHERE
            tags_id = :tags_id`
      )
    })

    db.app.transaction(namespaces => {
      for (const namespace of namespaces) {
        const tags = selectStatement.all({
          namespace: `${namespace}:`
        })

        db.app.transaction(tags => {
          for (const tag of tags) {
            updateStatements[namespace].run(tag)
          }
        })(tags)
      }
    })(namespaces)

    db.app.prepare('DROP TABLE namespaces_reduced_subquery').run()
  },
  createTempMappingsTable () {
    db.app.prepare(
      `CREATE TEMP TABLE hydrusrv_mappings_new (
        file_tags_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        FOREIGN KEY(file_tags_id) REFERENCES hydrusrv_files_new(tags_id)
          ON UPDATE CASCADE
          ON DELETE CASCADE,
        FOREIGN KEY(tag_id) REFERENCES hydrusrv_tags_new(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE
      )`
    ).run()
  },
  fillTempMappingsTable () {
    db.app.prepare(
      `INSERT INTO temp.hydrusrv_mappings_new
        SELECT
          ${hydrusTables.currentMappings}.service_hash_id AS fileTagsId,
          ${hydrusTables.currentMappings}.service_tag_id AS tagId
        FROM
          ${hydrusTables.currentMappings}
        NATURAL JOIN
          ${hydrusTables.repositoryHashIdMapTags}
        NATURAL JOIN
          ${hydrusTables.filesInfo}
        INNER JOIN
          ${hydrusTables.repositoryHashIdMapFiles}
          ON ${hydrusTables.repositoryHashIdMapFiles}.master_hash_id =
            ${hydrusTables.filesInfo}.master_hash_id
        INNER JOIN
          ${hydrusTables.currentFiles}
          ON ${hydrusTables.currentFiles}.service_hash_id =
            ${hydrusTables.repositoryHashIdMapFiles}.service_hash_id
        WHERE
          ${hydrusTables.filesInfo}.mime IN (${hydrusConfig.supportedMimeTypes})`
    ).run()
  },
  getNamespaces () {
    return db.app.prepare(
      `SELECT name FROM (
        SELECT DISTINCT SUBSTR(
          ${hydrusTables.tags}.tag,
          0,
          INSTR(${hydrusTables.tags}.tag, ':')
        ) AS name
        FROM
          ${hydrusTables.currentMappings}
        NATURAL JOIN
          ${hydrusTables.repositoryTagIdMap}
        NATURAL JOIN
          ${hydrusTables.tags}
        NATURAL JOIN
          ${hydrusTables.repositoryHashIdMapTags}
        NATURAL JOIN
          ${hydrusTables.filesInfo}
        WHERE
          ${hydrusTables.tags}.tag LIKE '%_:_%'
        AND
          ${hydrusTables.filesInfo}.mime IN (${hydrusConfig.supportedMimeTypes})
      )
      WHERE
        name REGEXP '^[a-zA-Z0-9_]+$'
      ORDER BY
        name`
    ).pluck().all()
  }
}
