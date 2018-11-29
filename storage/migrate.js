const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const config = require('../server/config')
const migrations = require('./migrations/runner')

migrations.run(config.authenticationDbPath)
