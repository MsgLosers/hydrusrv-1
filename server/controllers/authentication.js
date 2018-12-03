const users = require('../models/users')
const tokens = require('../models/tokens')

module.exports = {
  async createUser (username, password) {
    await users.create(username, password)
  },
  async updateUser (userId, data) {
    await users.update(userId, data)
  },
  deleteUser (userId) {
    users.delete(userId)
  },
  getUserByName (username) {
    return users.getByName(username)
  },
  getValidUser (nameOrId, password, getByName = false) {
    if (getByName) {
      return users.getValid(nameOrId, password, true)
    }

    return users.getValid(nameOrId, password)
  },
  createToken (userId, long) {
    return tokens.create(
      userId,
      long
        ? Math.floor(Date.now() / 1000) + 7776000
        : Math.floor(Date.now() / 1000) + 86400
    )
  },
  deleteTokens (userId, hash, all) {
    if (all) {
      tokens.delete(userId)

      return
    }

    tokens.delete(userId, hash)
  },
  validateTokenAndGetUserId (hash) {
    const token = tokens.getByHash(hash)

    if (
      !token ||
      (token.expires && token.expires < Math.floor(Date.now() / 1000))
    ) {
      return false
    }

    return users.getById(token.userId).id
  },
  isValidMediaToken (hash) {
    const token = tokens.getByMediaHash(hash)

    if (
      !token ||
      (token.expires && token.expires < Math.floor(Date.now() / 1000))
    ) {
      return false
    }

    return true
  }
}
