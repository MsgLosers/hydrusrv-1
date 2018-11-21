const crypto = require('crypto')

const db = require('../database')

module.exports = {
  create (userId, expires) {
    const hash = crypto.randomBytes(
      Math.ceil(128 / 2)
    ).toString('hex').slice(0, 128)

    const mediaHash = crypto.randomBytes(
      Math.ceil(128 / 2)
    ).toString('hex').slice(0, 128)

    const newTokenId = db.app.prepare(
      `INSERT INTO tokens (
        user_id, hash, media_hash, expires
      ) VALUES (
        ?, ?, ?, ?
      )`
    ).run(userId, hash, mediaHash, expires).lastInsertRowid

    return this.getById(newTokenId)
  },
  delete (userId, hash) {
    db.app.prepare(
      `DELETE FROM tokens WHERE ${hash ? 'hash' : 'user_id'} = ?`
    ).run(hash || userId)
  },
  getById (tokenId) {
    return db.app.prepare(
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
    return db.app.prepare(
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
    return db.app.prepare(
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
  }
}
