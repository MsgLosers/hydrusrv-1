const fs = require('fs')

const Database = require('better-sqlite3')

const config = require('../config')
const logger = require('../util/logger')

module.exports = {
  connect () {
    this.authentication = new Database(config.authenticationDbPath, {
      fileMustExist: true
    })

    this.content = new Database(config.contentDbPath, {
      fileMustExist: true
    })

    this.setWalMode()
  },
  close () {
    if (this.checkpointInterval) {
      clearInterval(this.checkpointInterval)
    }

    this.authentication.close()
    this.content.close()
  },
  setWalMode () {
    this.authentication.pragma('journal_mode = WAL')
    this.content.pragma('journal_mode = WAL')
  },
  checkpoint (db) {
    try {
      db.checkpoint()
    } catch (err) {
      logger.log(
        'could not checkpoint, will try again in ' +
        `${config.dbCheckpointInterval} seconds.`
      )
    }
  },
  vacuumAuthenticationDb () {
    this.authentication.prepare('VACUUM').run()
  },
  setCheckpointInterval () {
    this.checkpointInterval = setInterval(() => {
      this.checkpointIfNeeded(this.authentication, config.authenticationDbPath)
    }, config.dbCheckpointInterval * 1000)
  },
  checkpointIfNeeded (db, dbPath) {
    fs.access(`${dbPath}-wal`, err => {
      if (err) {
        return
      }

      fs.stat(`${dbPath}-wal`, (err, stats) => {
        if (err) {
          return
        }

        this.checkpoint(db);
      })
    })
  }
}
