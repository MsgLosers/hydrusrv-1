const hydrusConfig = require('./hydrus')

module.exports = {
  tags: 'hydrus_master_db.tags',
  hashes: 'hydrus_master_db.hashes',
  filesInfo: 'hydrus_server_db.files_info',
  currentMappings:
    `hydrus_mappings_db.current_mappings_${hydrusConfig.tagRepository}`,
  repositoryTagIdMap:
    `hydrus_master_db.repository_tag_id_map_${hydrusConfig.tagRepository}`,
  repositoryHashIdMapTags:
    `hydrus_master_db.repository_hash_id_map_${hydrusConfig.tagRepository}`,
  repositoryHashIdMapFiles:
    `hydrus_master_db.repository_hash_id_map_${hydrusConfig.fileRepository}`,
  currentFiles:
    `hydrus_server_db.current_files_${hydrusConfig.fileRepository}`
}
