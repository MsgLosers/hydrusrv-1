const Database = require('better-sqlite3')

const appConfig = require('../config/app-db')
const hydrusConfig = require('../config/hydrus-db')

module.exports = {
  connect () {
    this.app = new Database(appConfig.dbPath, {
      fileMustExist: true
    })

    this.app.function(
      'regexp', (pattern, string) => {
        if (pattern && string) {
          return string.match(new RegExp(pattern)) !== null ? 1 : 0
        }

        return null
      }
    )
  },
  attachHydrusDatabases () {
    try {
      this.app.prepare(
        `ATTACH '${hydrusConfig.serverDbPath}' AS hydrus_server_db`
      ).run()
      this.app.prepare(
        `ATTACH '${hydrusConfig.masterDbPath}' AS hydrus_master_db`
      ).run()
      this.app.prepare(
        `ATTACH '${hydrusConfig.mappingsDbPath}' AS hydrus_mappings_db`
      ).run()
    } catch (err) {
      console.error('error while trying to attach hydrus databases.', err)

      process.exit(1)
    }
  },
  detachHydrusDatabases () {
    try {
      this.app.prepare('DETACH hydrus_server_db').run()
      this.app.prepare('DETACH hydrus_master_db').run()
      this.app.prepare('DETACH hydrus_mappings_db').run()
    } catch (err) {
      console.error('error while trying to detach hydrus databases.', err)

      process.exit(1)
    }
  },
  close () {
    this.app.close()
  }
}
