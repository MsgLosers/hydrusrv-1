const crypto = require('crypto')

const db = require('../db')

module.exports = {
  async create (userId, expires) {
    const hash = await this.createHash(64)
    const mediaHash = await this.createHash(64)

    const newTokenId = db.authentication.prepare(
      `INSERT INTO tokens (
        user_id, hash, media_hash, expires
      ) VALUES (
        ?, ?, ?, ?
      )`
    ).run(userId, hash, mediaHash, expires).lastInsertRowid

    return this.getById(newTokenId)
  },
  delete (userId, hash) {
    db.authentication.prepare(
      `DELETE FROM tokens WHERE ${hash ? 'hash' : 'user_id'} = ?`
    ).run(hash || userId)
  },
  getById (tokenId) {
    return db.authentication.prepare(
      `SELECT
        id,
        user_id as userId,
        hash,
        media_hash as mediaHash,
        expires
      FROM
        tokens
      WHERE
        id = ?`
    ).get(tokenId)
  },
  getByHash (hash) {
    return db.authentication.prepare(
      `SELECT
        id,
        user_id as userId,
        hash,
        media_hash as mediaHash,
        expires
      FROM
        tokens
      WHERE
        hash = ?`
    ).get(hash)
  },
  getByMediaHash (hash) {
    return db.authentication.prepare(
      `SELECT
        id,
        user_id as userId,
        hash,
        media_hash as mediaHash,
        expires
      FROM
        tokens
      WHERE
        media_Hash = ?`
    ).get(hash)
  },
  createHash (bytes) {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(bytes, (err, buffer) => {
        if (err) {
          reject(err)
        }

        resolve(buffer.toString('hex'))
      })
    })
  }
}
