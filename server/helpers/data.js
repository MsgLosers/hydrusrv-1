const config = require('../config/app')
const db = require('../database')
const hydrusConfig = require('../config/hydrus')
const hydrusTables = require('../config/hydrus-db-tables')

module.exports = {
  sync (keepTablesAfterError = false) {
    if (db.updatingData) {
      return
    }

    db.updatingData = true

    let updateSuccessful = true

    let namespaces, tags, files, mappings

    try {
      namespaces = this.getNamespaces()
      tags = this.getTags()
      files = this.getFiles(namespaces)
      mappings = this.getMappings()

      this.createTempNamespacesTable()
      this.createTempTagsTable()
      this.createTempFilesTable(namespaces)
      this.createTempMappingsTable()
    } catch (err) {
      updateSuccessful = false

      console.warn(
        'hydrus server has no repositories set up yet or there has been an ' +
          'error. This can happen if, for example, hydrus server was in the ' +
          'process of writing data while hydrusrv tried to read. hydrusrv ' +
          'will try updating again after the period set via ' +
          `\`DATA_UPDATE_INTERVAL\` (${config.dataUpdateInterval} seconds) ` +
          'has passed.'
      )
    }

    if (updateSuccessful) {
      this.fillTempNamespacesTable(namespaces)
      this.fillTempTagsTable(tags)
      this.fillTempFilesTable(files, namespaces)
      this.fillTempMappingsTable(mappings)

      this.replaceCurrentTempTables()
    } else if (keepTablesAfterError) {
      this.dropTempTables()

      this.createTempNamespacesTable()
      this.createTempTagsTable()
      this.createTempFilesTable()
      this.createTempMappingsTable()

      this.replaceCurrentTempTables()
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
  fillTempTagsTable (tags) {
    for (const tag of tags) {
      db.app.prepare(
        `INSERT INTO hydrusrv_tags_new (
          id, name, file_count, random
        ) VALUES (
          ?, ?, ?, ?
        )`
      ).run(
        tag.id,
        tag.name,
        tag.fileCount,
        (Math.floor(Math.random() * 10000) + 10000).toString().substring(1)
      )
    }
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
        hash BLOB_BYTES UNIQUE NOT NULL,
        random TEXT NOT NULL
        ${namespaceColumns.length ? ',' + namespaceColumns.join(',') : ''}
      )`
    ).run()
  },
  fillTempFilesTable (files, namespaces) {
    const namespaceColumns = []

    for (const namespace of namespaces) {
      namespaceColumns.push(
        `namespace_${namespace.split(' ').join('_')}`
      )
    }

    for (const file of files) {
      const namespaceParameters = []

      for (const namespace of namespaces) {
        namespaceParameters.push(
          file[`namespace_${namespace.split(' ').join('_')}`]
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
        ) VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
          ${',?'.repeat(namespaceColumns.length)}
        )`
      ).run(
        file.id,
        file.tagsId,
        file.mime,
        file.size,
        file.width,
        file.height,
        file.hash,
        (Math.floor(Math.random() * 10000) + 10000).toString().substring(1),
        ...namespaceParameters
      )
    }
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
  fillTempMappingsTable (mappings) {
    for (const mapping of mappings) {
      db.app.prepare(
        'INSERT INTO hydrusrv_mappings_new (file_tags_id, tag_id) VALUES (?, ?)'
      ).run(mapping.fileTagsId, mapping.tagId)
    }
  },
  getNamespaces () {
    return db.hydrus.prepare(
      `SELECT DISTINCT
        SUBSTR(
          ${hydrusTables.tags}.tag,
          INSTR(${hydrusTables.tags}.tag, ':'),
          -INSTR(${hydrusTables.tags}.tag, ':')
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
        ${hydrusTables.tags}.tag LIKE '%:%'
      AND
        ${hydrusTables.tags}.tag NOT LIKE ':%'
      AND
        ${hydrusTables.tags}.tag NOT LIKE '%:'
      AND
        SUBSTR(
          ${hydrusTables.tags}.tag,
          INSTR(${hydrusTables.tags}.tag, ':'),
          -INSTR(${hydrusTables.tags}.tag, ':')
        ) REGEXP '^[a-zA-Z0-9_]*$'
      AND
        ${hydrusTables.filesInfo}.mime IN (${hydrusConfig.supportedMimeTypes})
      ORDER BY
        name`
    ).pluck().all()
  },
  getTags () {
    return db.hydrus.prepare(
      `SELECT
        ${hydrusTables.currentMappings}.service_tag_id AS id,
        ${hydrusTables.tags}.tag AS name,
        COUNT(*) as fileCount
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
    ).all()
  },
  getFiles (namespaces) {
    const files = db.hydrus.prepare(
      `SELECT
        ${hydrusTables.currentFiles}.service_hash_id AS id,
        ${hydrusTables.hashes}.master_hash_id AS masterHashId,
        ${hydrusTables.repositoryHashIdMapTags}.service_hash_id AS tagsId,
        ${hydrusTables.hashes}.hash,
        ${hydrusTables.filesInfo}.mime,
        ${hydrusTables.filesInfo}.size,
        ${hydrusTables.filesInfo}.width,
        ${hydrusTables.filesInfo}.height
      FROM
        ${hydrusTables.hashes}
      NATURAL JOIN
        ${hydrusTables.filesInfo}
      NATURAL JOIN
        ${hydrusTables.repositoryHashIdMapFiles}
      LEFT JOIN
        ${hydrusTables.repositoryHashIdMapTags}
        ON ${hydrusTables.repositoryHashIdMapTags}.master_hash_id =
          ${hydrusTables.hashes}.master_hash_id
      NATURAL JOIN
        ${hydrusTables.currentFiles}
      WHERE
        ${hydrusTables.filesInfo}.mime IN (${hydrusConfig.supportedMimeTypes})`
    ).all()

    let indexedFiles = []

    for (const file of files) {
      indexedFiles[file.tagsId] = file
    }

    for (const namespace of namespaces) {
      const namespacedTags = db.hydrus.prepare(
        `SELECT
          ${hydrusTables.tags}.tag,
          ${hydrusTables.repositoryHashIdMapTags}.service_hash_id AS tagsId
        FROM
          ${hydrusTables.currentMappings}
        NATURAL JOIN
          ${hydrusTables.repositoryTagIdMap}
        NATURAL JOIN
          ${hydrusTables.tags}
        NATURAL JOIN
          ${hydrusTables.repositoryHashIdMapTags}
        WHERE
          ${hydrusTables.tags}.tag LIKE '${namespace}:%'
        ORDER BY
          ${hydrusTables.tags}.tag`
      ).all()

      const reducedNamespacedTags = []
      const usedFileIds = []

      for (const namespacedTag of namespacedTags) {
        if (!usedFileIds[namespacedTag.tagsId]) {
          usedFileIds[namespacedTag.tagsId] = namespacedTag.tagsId

          reducedNamespacedTags.push(namespacedTag)
        }
      }

      for (const namespacedTag of reducedNamespacedTags) {
        if (!namespacedTag) {
          continue
        }

        if (indexedFiles[namespacedTag.tagsId]) {
          const cleanedNamespace = namespace.split(' ').join('_')

          indexedFiles[namespacedTag.tagsId][`namespace_${cleanedNamespace}`] =
            namespacedTag.tag.replace(`${cleanedNamespace}:`, '')
        }
      }
    }

    return indexedFiles.filter(file => file)
  },
  getMappings () {
    return db.hydrus.prepare(
      `SELECT
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
    ).all()
  }
}
