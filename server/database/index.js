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
        if (pattern && string)
          return string.match(new RegExp(pattern)) !== null ? 1 : 0
        return null
      }
    )
  },

  attachHydrus () {
    try {
      this.app.prepare(
        `attach '${hydrusConfig.serverDbPath}' as hydrus_server_db`
      ).run()
      this.app.prepare(
        `attach '${hydrusConfig.masterDbPath}' as hydrus_master_db`
      ).run()
      this.app.prepare(
        `attach '${hydrusConfig.mappingsDbPath}' as hydrus_mappings_db`
      ).run()
    } catch(e) { 
      console.log(e.stack) 
    }
  },

  detachHydrus () {
    try {
      this.app.prepare(
        `detach hydrus_server_db`
      ).run()
      this.app.prepare(
        `detach hydrus_master_db`
      ).run()
      this.app.prepare(
        `detach hydrus_mappings_db`
      ).run()
    } catch(e) { 
      console.log(e.stack) 
    }
  },

  close () {
    this.app.close()
  }
}
