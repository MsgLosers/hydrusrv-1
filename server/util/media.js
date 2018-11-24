const fs = require('fs')
const fileType = require('file-type')
const readChunk = require('read-chunk')

const hydrusConfig = require('../config/hydrus')

module.exports = {
  async fileExists (type, hash) {
    const directory = hash.substring(0, 2)
    const extension = type === 'thumbnail' ? '.thumbnail' : ''
    const filePath =
      `${hydrusConfig.filesPath}/${directory}/${hash}${extension}`

    return new Promise((resolve, reject) => {
      fs.access(filePath, err => {
        if (err) {
          reject(err)
        }

        resolve()
      })
    })
  },
  async getFileData (type, hash) {
    const directory = hash.substring(0, 2)
    const extension = type === 'thumbnail' ? '.thumbnail' : ''
    const filePath =
      `${hydrusConfig.filesPath}/${directory}/${hash}${extension}`

    return {
      path: filePath,
      mimeType: fileType(await readChunk(filePath, 0, 4100)).mime
    }
  }
}
