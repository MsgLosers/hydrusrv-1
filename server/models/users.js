const upash = require('upash')

const db = require('../db')

upash.install('argon2', require('@phc/argon2'))

module.exports = {
  getById (userId) {
    return db.authentication.prepare(
      `SELECT
        id,
        username,
        password,
        created
      FROM
        users
      WHERE
        id = ?`
    ).get(userId)
  },
  getByName (username) {
    return db.authentication.prepare(
      `SELECT
        id,
        username,
        password,
        created
      FROM
        users
      WHERE
        username = ?`
    ).get(username)
  },
  async getValid (nameOrId, password, getByName = false) {
    const user = getByName ? this.getByName(nameOrId) : this.getById(nameOrId)

    if (!user) {
      return false
    }

    if (await upash.verify(user.password, password)) {
      return user
    }

    return false
  },
  async create (username, password) {
    const passwordHash = await upash.hash(password)

    db.authentication.prepare(
      'INSERT INTO users (username, password, created) VALUES (?, ?, ?)'
    ).run(username, passwordHash, Math.floor(Date.now() / 1000))
  },
  async update (userId, data) {
    const placeholders = []
    const params = []

    if (data.username) {
      placeholders.push('username = ?')
      params.push(data.username)
    }

    if (data.password) {
      placeholders.push('password = ?')
      params.push(await upash.hash(data.password))
    }

    params.push(userId)

    db.authentication.prepare(
      `UPDATE users SET ${placeholders.join(',')} WHERE id = ?`
    ).run(...params)
  },
  delete (userId) {
    db.authentication.prepare('DELETE FROM users WHERE id = ?').run(userId)
  }
}
