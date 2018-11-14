const config = require('../config/app')
const db = require('../database')
const hydrusConfig = require('../config/hydrus')
const hydrusTables = require('../config/hydrus-db-tables')

module.exports = {

  sync (keepTablesAfterError = false) {
    if (db.updatingData) {
      return
    }

    var profiling = {
      t0: null,
      t1: null,
      init: function() { 
        this.t0 = process.hrtime()
        this.t1 = this.t0 },
      differential: function() { 
        var result = this.formatTime(process.hrtime(this.t1))
        this.t1 = process.hrtime()
        return result},
      cumulative: function() { 
        return this.formatTime(process.hrtime(this.t0))},
      formatTime: function(hrtime){
        var ms = Math.trunc(hrtime[1] * 1e-6 )
        ms = new Array(3).concat([ms]).join('0').slice(-3)
        var s = hrtime[0]
        return s + '.' + ms + 's'},
      log: function(message) { 
        if(process.env.NODE_ENV !== 'development')
          return
        if(!message) {
          this.differential()
          return
        }
        process.stdout.write(
          message
            .replace('{datetime}', (new Date().toLocaleString()))
            .replace('{dt}', this.differential())
            .replace('{t}', this.cumulative())
        )}
    }
    profiling.init()
    db.updatingData = true
    let updateSuccessful = true
    let namespaces
    profiling.log('{datetime}: updating db...\n')

    db.attachHydrus()

    try {
      namespaces = this.getNamespaces()
      profiling.log('getNamespaces: {dt}\n')

      this.createTempNamespacesTable()
      this.createTempTagsTable()
      this.createTempFilesTable(namespaces)
      this.createTempMappingsTable()

      this.fillTempNamespacesTable(namespaces)
      profiling.log('fillTempNamespacesTable: {dt}\n')
      this.fillTempTagsTable()
      profiling.log('fillTempTagsTable: {dt}\n')
      this.fillTempFilesTable(namespaces)
      profiling.log('fillTempFilesTable: {dt}\n')
      this.fillTempMappingsTable()
      profiling.log('fillTempMappingsTable: {dt}\n')
    } catch (e) {
      updateSuccessful = false
      console.warn(e.stack)
    }

    db.detachHydrus()

    profiling.log() //dt -> 0

    if (updateSuccessful) {
      this.replaceCurrentTempTables()
      profiling.log('replaceCurrentTempTables: {dt}\n')
    } else if (keepTablesAfterError) {
      this.dropTempTables()

      this.createTempNamespacesTable()
      this.createTempTagsTable()
      this.createTempFilesTable()
      this.createTempMappingsTable()

      this.replaceCurrentTempTables()
    }

    profiling.log(`total: {t}\n\n`)

    if(process.env.NODE_ENV === 'development'){
      const timings = {}
      db.app.prepare(`
        select count(*) from hydrusrv_namespaces
          union
        select count(*) from hydrusrv_files
          union
        select count(*) from hydrusrv_tags
          union
        select count(*) from hydrusrv_mappings
      `)
      .all()
      .map((s,i) => { timings[['namespaces', 'files', 'tags', 'mappings'][i]] = s['count(*)']})

      console.log(timings)
    }

    db.updatingData = false
  },
  replaceCurrentTempTables () {
    db.app.prepare('drop table if exists hydrusrv_namespaces').run()
    db.app.prepare('drop table if exists hydrusrv_mappings').run()
    db.app.prepare('drop table if exists hydrusrv_tags').run()
    db.app.prepare('drop table if exists hydrusrv_files').run()

    db.app.prepare(
      'alter table hydrusrv_namespaces_new rename to hydrusrv_namespaces'
    ).run()

    db.app.prepare(
      'alter table hydrusrv_tags_new rename to hydrusrv_tags'
    ).run()

    db.app.prepare(
      'alter table hydrusrv_files_new rename to hydrusrv_files'
    ).run()

    db.app.prepare(
      'alter table hydrusrv_mappings_new rename to hydrusrv_mappings'
    ).run()
  },
  dropTempTables () {
    db.app.prepare('drop table if exists hydrusrv_namespaces_new').run()
    db.app.prepare('drop table if exists hydrusrv_mappings_new').run()
    db.app.prepare('drop table if exists hydrusrv_tags_new').run()
    db.app.prepare('drop table if exists hydrusrv_files_new').run()
  },
  createTempNamespacesTable () {
    db.app.prepare(
      `create temp table hydrusrv_namespaces_new (
        id integer not null primary key autoincrement unique,
        name text not null unique
      )`
    ).run()
  },
  fillTempNamespacesTable (namespaces) {
    for (const namespace of namespaces) {
      db.app.prepare(
        'insert into hydrusrv_namespaces_new (name) values (?)'
      ).run(namespace)
    }
  },
  createTempTagsTable () {
    db.app.prepare(
      `create temp table hydrusrv_tags_new (
        id integer not null primary key unique,
        name text not null unique,
        file_count integer not null,
        random text not null
      )`
    ).run()
  },
  fillTempTagsTable () {
    db.app.prepare(`
      insert into hydrusrv_tags_new
        select
          ${hydrusTables.currentMappings}.service_tag_id as id,
          ${hydrusTables.tags}.tag as name,
          count(*) as fileCount,
          substr(''||random(), -4) as random
        from
          ${hydrusTables.currentMappings}
        natural join
          ${hydrusTables.repositoryTagIdMap}
        natural join
          ${hydrusTables.tags}
        natural join
          ${hydrusTables.repositoryHashIdMapTags}
        natural join
          ${hydrusTables.filesInfo}
        where
          ${hydrusTables.filesInfo}.mime in (${hydrusConfig.supportedMimeTypes})
        group by
          ${hydrusTables.tags}.tag
    `).run()
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

    db.app.prepare(`
      create temp table hydrusrv_files_new (
        id integer not null primary key unique,
        tags_id integer unique default null,
        mime integer not null,
        size integer not null,
        width integer not null,
        height integer not null,
        hash blob_bytes unique not null,
        random text not null
        ${namespaceColumns.length ? ',' + namespaceColumns.join(',') : ''}
      )
    `).run()
  },
  fillTempFilesTable (namespaces) {

    const namespaceColumns = []

    for (const namespace of namespaces) {
      namespaceColumns.push(
        `namespace_${namespace.split(' ').join('_')}`
      )
    }

    db.app.prepare(`
      insert into hydrusrv_files_new (
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
        select
          ${hydrusTables.currentFiles}.service_hash_id as id,
          ${hydrusTables.repositoryHashIdMapTags}.service_hash_id as tags_id,
          ${hydrusTables.filesInfo}.mime,
          ${hydrusTables.filesInfo}.size,
          ${hydrusTables.filesInfo}.width,
          ${hydrusTables.filesInfo}.height,
          ${hydrusTables.hashes}.hash,
          substr(''||random(), -4) as random
          ${namespaceColumns.length ? ', null as ' + namespaceColumns.join(', null as') : ''}
        from
          ${hydrusTables.hashes}
        natural join
          ${hydrusTables.filesInfo}
        natural join
          ${hydrusTables.repositoryHashIdMapFiles}
        left join
          ${hydrusTables.repositoryHashIdMapTags}
          on ${hydrusTables.repositoryHashIdMapTags}.master_hash_id =
            ${hydrusTables.hashes}.master_hash_id
        natural join
          ${hydrusTables.currentFiles}
        where
          ${hydrusTables.filesInfo}.mime in (${hydrusConfig.supportedMimeTypes})`
    ).run()

    db.app.prepare(`
      create temp table namespaces_reduced_subquery as
        select 
          master_tag_id, tag
        from
          ${hydrusTables.tags}
        where
          tag LIKE '%_:_%'
    `).run()

    const stmt_select = db.app.prepare(`
      select
        replace(namespaces_reduced_subquery.tag, :namespace, '') as tag,
        ${hydrusTables.repositoryHashIdMapTags}.service_hash_id as tags_id
      from
        ${hydrusTables.currentMappings}
      natural join
        ${hydrusTables.repositoryTagIdMap}
      natural join
        namespaces_reduced_subquery
      natural join
        ${hydrusTables.repositoryHashIdMapTags}
      where
        namespaces_reduced_subquery.tag like :namespace || '_%'
      group by tags_id
    `)

    const stmts_update = {}

    namespaces.map((namespace, i) => {
      stmts_update[namespaces[i]] = db.app.prepare(`
        update hydrusrv_files_new
        set
        namespace_${namespace.replace(' ', '_')} = :tag
        where tags_id = :tags_id
      `)
    })

    db.app.transaction((namespaces) => {
      for (const namespace of namespaces){

        const tags = stmt_select.all({namespace: namespace + ':'})

        db.app.transaction((tags) => {
          for (const tag of tags) stmts_update[namespace].run(tag);
        })(tags)
      }
    })(namespaces)


    db.app.prepare(`
      drop table namespaces_reduced_subquery
    `).run()
  },
  createTempMappingsTable () {
    db.app.prepare(
      `create temp table hydrusrv_mappings_new (
        file_tags_id integer not null,
        tag_id integer not null,
        foreign key(file_tags_id) references hydrusrv_files_new(tags_id)
          on update cascade
          on delete cascade,
        foreign key(tag_id) references hydrusrv_tags_new(id)
          on update cascade
          on delete cascade
      )`
    ).run()
  },
  fillTempMappingsTable () {
    db.app.prepare(`
      insert into temp.hydrusrv_mappings_new
        select
          ${hydrusTables.currentMappings}.service_hash_id as fileTagsId,
          ${hydrusTables.currentMappings}.service_tag_id as tagId
        from
          ${hydrusTables.currentMappings}
        natural join
          ${hydrusTables.repositoryHashIdMapTags}
        natural join
          ${hydrusTables.filesInfo}
        inner join
          ${hydrusTables.repositoryHashIdMapFiles}
          on ${hydrusTables.repositoryHashIdMapFiles}.master_hash_id =
            ${hydrusTables.filesInfo}.master_hash_id
        inner join
          ${hydrusTables.currentFiles}
          on ${hydrusTables.currentFiles}.service_hash_id =
            ${hydrusTables.repositoryHashIdMapFiles}.service_hash_id
        where
          ${hydrusTables.filesInfo}.mime in (${hydrusConfig.supportedMimeTypes})`
    ).run()
  },
  getNamespaces () {
    return db.app.prepare(`
      select name from (

        select distinct substr (
          ${hydrusTables.tags}.tag,
          0,
          instr(${hydrusTables.tags}.tag, ':')
        ) as name from
          ${hydrusTables.currentMappings}
        natural join
          ${hydrusTables.repositoryTagIdMap}
        natural join
          ${hydrusTables.tags}
        natural join
          ${hydrusTables.repositoryHashIdMapTags}
        natural join
          ${hydrusTables.filesInfo}
        where
          ${hydrusTables.tags}.tag like '%_:_%'
        and
          ${hydrusTables.filesInfo}.mime in (${hydrusConfig.supportedMimeTypes})
      )
      where 
        name regexp '^[a-zA-Z0-9_]+$'
      order by
        name
    `).pluck().all()
  }
}
