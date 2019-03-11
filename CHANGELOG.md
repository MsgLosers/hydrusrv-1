# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed

+ Removed FOSSA badge

## [8.1.0] - 2018-02-15

### Changed

+ Updated dependencies
+ Excluded `.git` directory from Docker image

## [8.0.0] - 2018-01-29

### Added

+ Added support for searching files with wildcarded tags

### Changed

+ Updated dependencies

## [7.0.0] - 2018-01-15

### Added

+ Added a route for getting users
+ Added a route for getting tokens

### Changed

+ Added various fields to the `users` and `tokens` tables and adjusted the API
  responses accordingly
+ Normalized the API responses for creating and updating users
+ Moved API documentation to separate file
+ Refactored code
+ Updated dependencies

### Fixed

+ Added the missing `hash` property to the file routes API documentation

## [6.0.0] - 2018-12-28

### Added

+ Added the ability to filter files by hydrus-like _system constraints_
+ Added the ability to sort files by `tag_count`
+ Added the `hash` field to the output of file routes
+ Added a route (`mime-types`) for fetching all available MIME types

### Changed

+ Changed checkpointing so the WAL file gets truncated
+ Updated dependencies

### Fixed

+ Fixed test `content.db` not being Git-ignored
+ Fixed test files not being cleaned up correctly (especially on error)

## [5.0.0] - 2018-12-09

### Added

+ Added ability to (optionally) output counts when listing files and tags
+ Added counts caching
+ Added basic error prevention when two requests trying to insert the same data
  happen almost exactly at the same time

### Changed

+ Normalized API responses to make expanding them easier in the future
+ Updated dependencies

## [4.4.0] - 2018-12-05

### Changed

+ Cleaned up environment variables
+ Updated dependencies

### Fixed

+ Removed unneeded module import

## [4.3.0] - 2018-12-05

### Changed

+ Improved "exclude tags" query performance
+ Improved checkpoint handling
+ Updated dependencies

### Fixed

+ Fixed issue where querying a file with no tags would responds with a
  malformed `tags` array causing hydrusrvue to crash

## [4.2.1] - 2018-12-04

### Fixed

+ Fixed regression introduced when increasing query performance in
  [`4.2.0`][4.2.0] that caused tags being fetched incorrectly

## [4.2.0] - 2018-12-03

### Changed

+ Improved performance of various queries
+ Improved async code
+ Refactored code
+ Dropped `hydrusrv` prefix from content database tables to be consistent with
  the application database naming scheme
+ Updated dependencies

## [4.1.0] - 2018-12-02

### Changed

+ Reduced Docker image size

### Fixed

+ Removed unintended `console.log()` statement
+ Fixed letter case in readme

## [4.0.0] - 2018-12-01

### Added

+ Added clustering to improve performance when multiple concurrent requests
  happen

### Changed

+ Split up application database into authentication database and content
  database (holding the users/tokens and hydrus server content respectively)
+ Switched to WAL mode and added checkpoint handling
+ Moved data update handling into a separate tool called
  [hydrusrv-sync](https://github.com/mserajnik/hydrusrv-sync)
+ Changed Docker configuration to make it configurable when starting a
  container and enabled automatic builds on Docker Hub
+ Improved application status logging
+ Updated dependencies

## [3.17.0] - 2018-11-25

### Added

+ Added an `AUTHENTICATION_REQUIRED` setting that can be used to make
  authentication optional instead of needed for accessing
  non-authentication-related routes

### Changed

+ Refactored and cleaned up code
+ Updated dependencies

## [3.16.1] - 2018-11-21

### Fixed

+ Fixed typo in data handler SQL query

## [3.16.0] - 2018-11-18

### Added

+ Made autocompletion result amount configurable

### Changed

+ Changed autocomplete sorting (exact match at the top, rest sorted by
  `file_count` descending)
+ Changed namespace sorting to account for numbers (e.g., `page:1`, `page:2`
  and `page:11` would be sorted as `1-11-2` before and `1-2-11` now)

### Fixed

+ Escaped underscores in `LIKE` queries

## [3.15.0] - 2018-11-14

### Added

+ Added profiling for temporary data updates
+ Added "Credits" section to readme

### Changed

+ Majorly increased temporary data update performance
+ Majorly increased files query performance
+ Pinned Node version in Dockerfile to prevent possible issues in the future
+ Replaced `console.log()` statements with `console.info()`

### Fixed

+ Fixed "Get files by tags sorted ascending" test
+ Fixed nodemon failing on certain Linux systems due to it not excluding
  the `node_modules` directory by default
+ Fixed license formatting

## [3.14.0] - 2018-11-10

### Changed

+ Improved "exclude tags" query performance
+ Updated dependencies

## [3.13.0] - 2018-11-08

### Changed

+ Updated dependencies

### Fixed

+ Fixed tags sometimes being assigned to the wrong files
+ Fixed namespaces not being limited to alphanumeric characters and underscores

## [3.12.1] - 2018-11-05

### Fixed

+ Fixed notice about native bindings in readme to reflect the current usage

## [3.12.0] - 2018-11-05

### Changed

+ Changed migration runner to no longer require node-sqlite
+ Cleaned up code
+ Updated dependencies

## [3.11.0] - 2018-10-24

### Changed

+ Increased performance when creating temporary data tables
+ Updated dependencies and clarified them in readme

## [3.10.0] - 2018-10-01

### Changed

+ Moved version declaration into config
+ Updated dependencies

## [3.9.0] - 2018-09-17

### Added

+ Added the ability to exclude files by prefixing the undesired tag(s) with `-`

### Changed

+ Refactored code
+ Updated dependencies

## [3.8.0] - 2018-08-30

### Added

+ Added FOSSA badge

### Changed

+ Updated dependencies

### Fixed

+ Fixed potential issues with foreign key constraint errors when trying to
  add mappings that contain tag IDs that do not exist

## [3.7.1] - 2018-08-27

### Added

+ Added information about demo installation

## [3.7.0] - 2018-08-27

### Changed

+ Revised potentially confusing wording when a sync fails
+ Updated dependencies

## [3.6.0] - 2018-08-22

### Changed

+ Renamed the field `files` in `hydrusrv_tags` to `file_count` (`fileCount` when
  sending it over the API)
+ Changed Docker configuration to run container as non-root user
+ Updated dependencies

## [3.5.1] - 2018-08-19

### Removed

+ Removed info about hydrusrvue being in development (as it has been released)

## [3.5.0] - 2018-08-18

### Changed

+ Removed requirement to provide `contains` parameter when sorting tags by
  `contains` and instead added fallback sorting by `name`
+ Updated dependencies

### Fixed

+ Removed non-existing error `MissingTagsParameterError` from readme

## [3.4.0] - 2018-08-08

### Changed

+ Renamed `sort` parameter from `namespace` to `namespaces` to be more
  consistent with the recent changes
+ Refactored code

## [3.3.0] - 2018-08-06

### Changed

+ Made it necessary to provide the current password when trying to delete a
  user to prevent token leaks leading to potential loss of accounts
+ Renamed `namespace` parameter to `namespaces`
+ Refactored code
+ Updated dependencies

## [3.2.0] - 2018-08-06

### Added

+ Added sorting by `mime`
+ Added option to change sort direction when viewing files
+ Added tags searching and sorting

### Changed

+ Changed default sorting to `id` descending instead of ascending (to display
  the latest files first)
+ Changed password hashing library
+ Updated dependencies

## [3.1.1] - 2018-08-02

### Fixed

+ Added missing migration support when running with Docker

## [3.1.0] - 2018-08-02

### Added

+ Added migrations to simplify the process of making changes to the database
  in the future

### Changed

+ Changed references from `yarn install` to simply `yarn`

### Fixed

+ Removed no longer used `MEDIA_SECRET` setting
+ Return `null` instead of `undefined` when generating `ORDER BY` for
  namespace sorting and there are none

## [3.0.0] - 2018-08-01

### Changed

+ Replaced media secret with user-bound media tokens that are generated
  alongside authentication tokens

## [2.11.0] - 2018-08-01

### Changed

+ Added media secret to `info` route for easier client-side usage

## [2.10.1] - 2018-08-01

### Fixed

+ Fixed wrong wording in readme

## [2.10.0] - 2018-08-01

### Added

+ Added media secret

### Fixed

+ Fixed incorrect term in readme

## [2.9.1] - 2018-07-31

### Fixed

+ Fixed temporary data tables not existing after the first sync if it fails,
  causing requests to generate errors instead of just returning empty data

## [2.9.0] - 2018-07-29

### Changed

+ Set a higher maximum length for username and password
+ Limited minimum password length to a maximum of 1024
+ Set a default value for `RESULTS_PER_PAGE` if not provided via `.env`
+ Updated dependencies

### Fixed

+ Fixed potential issues with reading `PORT` configuration

## [2.8.1] - 2018-07-28

### Fixed

+ Namespaces containing other characters than alphanumerics and underscores are
  now discarded to prevent errors when trying to create colums containing
  invalid characters and to not falsely assume emote tags like `>:)` have a
  namespace
+ Fixed tags starting or ending with `:` causing the creation of an empty
  namespace or a namespace that does not have any tags

## [2.8.0] - 2018-07-28

### Changed

+ Refactored files querying
+ Added sorting by `size`, `width` and `height`

## [2.7.1] - 2018-07-25

### Fixed

+ Added files count to tag autocompletion results

## [2.7.0] - 2018-07-25

### Added

+ Added files count to tags

## [2.6.1] - 2018-07-25

### Fixed

+ Fixed Docker start command to make sure `SIGTERM` propagates correctly

## [2.6.0] - 2018-07-25

### Added

+ Added graceful shutdowns

### Changed

+ Updated dependencies

## [2.5.2] - 2018-07-22

### Fixed

+ Fixed potential issues with incorrect data by locking the database when
  creating temporary data tables
+ Corrected and simplified the selection of files when creating temporary data
  tables

## [2.5.1] - 2018-07-17

### Fixed

+ Added correct default values for `HYDRUS_TAG_REPOSITORY` and
  `HYDRUS_FILE_REPOSITORY` in readme

## [2.5.0] - 2018-07-15

### Changed

+ Switched to an Alpine-based Node image for a smaller resulting image size

## [2.4.0] - 2018-07-15

### Added

+ Added default values for `HYDRUS_TAG_REPOSITORY` and `HYDRUS_FILE_REPOSITORY`

### Removed

+ Removed unnecessary details about Docker deployment

### Fixed

+ Fixed hydrusrv trying to move to next route after setting `OPTIONS` response

## [2.3.0] - 2018-07-15

### Added

+ Added check if hydrus server has already set up its repositories when
  creating temporary tables. This change causes hydrusrv to keep running
  (instead of crashing) and to try again after the period set via
  `DATA_UPDATE_INTERVAL`
+ Added Docker compatibility

### Changed

+ Updated dependencies

### Fixed

+ Fixed hydrusrv ignoring files without tags completely

## [2.2.0] - 2018-06-30

### Added

+ Added (pseudo)-random sorting – it stays the same for any given query until
  hydrusrv updates its temporary data

### Changed

+ Removed version number from hydrus server dummy and adjusted wording to avoid
  confusion
+ Adjusted copyright notice in license to comply with the standard
+ Updated dependencies

## [2.1.0] - 2018-06-03

### Added

+ Joined current files table when selecting mappings to prevent possible
  foreign key constraint errors after deleting files because hydrus server
  has not already updated the current mappings

### Changed

+ Renamed mappings configuration to avoid confusion

### Fixed

+ Fixed broken anchor in readme

## [2.0.1] - 2018-06-03

### Fixed

+ Removed debug time logging from data sync function

## [2.0.0] - 2018-06-03

### Added

+ Added temporary data table creation to allow for faster on-demand queries and
  more extensive sorting options

### Changed

+ Rewrote database queries to use the new temporary data tables
+ Optimized sorting via multiple namespaces (thanks to the new temporary data
  tables)
+ Set more appropriate default settings
+ Added various small optimizations throughout the application

### Fixed

+ Fixed wrong table used in several locations

## [1.5.1] - 2018-05-29

### Fixed

+ Fixed getting files by tags query failing when the same tag was provided
  multiple times
+ Fixed getting files by tags sorted by namespace query not working correctly
  when one or more of the provided tags also contained the namespace

## [1.5.0] - 2018-05-28

### Changed

+ Removed the previously required token on media file and thumbnail routes –
  this made it impossible to load files/thumbnails via `<img>` tag or the like
  and the long hash alone should be enough to make those routes nearly
  impossible to guess
+ Made current password a requirement when updating user
+ Updated dependencies

## [1.4.0] - 2018-05-13

### Added

+ Added JavaScript Standard Style badge

### Changed

+ Refactored code
+ Added separate model for tokens
+ Switched to Yarn and updated dependencies

### Fixed

+ Fixed CORS headers

## [1.3.2] - 2018-05-11

### Fixed

+ Added additional missing CORS headers

## [1.3.1] - 2018-05-11

### Fixed

+ Added missing CORS preflight handling

## [1.3.0] - 2018-05-11

### Added

+ Added CORS headers

### Changed

+ Refactored the handling of `true/false` environment variables

## [1.2.0] - 2018-05-10

### Added

+ Added [Snyk](https://snyk.io) integration

### Changed

+ Refactored several `if/else` constructs
+ Updated dependencies

### Fixed

+ Fixed wrong indentation in error response example
+ Fixed lines unnecessarily exceeding character limit in some cases

## [1.1.2] - 2018-05-10

### Fixed

+ Fixed broken tests after adding additional output to file lists

## [1.1.1] - 2018-05-10

### Fixed

+ Removed impossible errors when creating users from API docs

## [1.1.0] - 2018-05-10

### Added

+ Added base route
+ Added additional output to file lists

## [1.0.1] - 2018-05-09

### Fixed

+ Fixed check if registration is enabled

## 1.0.0 - 2018-05-07

### Added

+ Initial release

[Unreleased]: https://github.com/mserajnik/hydrusrv/compare/8.1.0...develop
[8.1.0]: https://github.com/mserajnik/hydrusrv/compare/8.0.0...8.1.0
[8.0.0]: https://github.com/mserajnik/hydrusrv/compare/7.0.0...8.0.0
[7.0.0]: https://github.com/mserajnik/hydrusrv/compare/6.0.0...7.0.0
[6.0.0]: https://github.com/mserajnik/hydrusrv/compare/5.0.0...6.0.0
[5.0.0]: https://github.com/mserajnik/hydrusrv/compare/4.4.0...5.0.0
[4.4.0]: https://github.com/mserajnik/hydrusrv/compare/4.3.0...4.4.0
[4.3.0]: https://github.com/mserajnik/hydrusrv/compare/4.2.1...4.3.0
[4.2.1]: https://github.com/mserajnik/hydrusrv/compare/4.2.0...4.2.1
[4.2.0]: https://github.com/mserajnik/hydrusrv/compare/4.1.0...4.2.0
[4.1.0]: https://github.com/mserajnik/hydrusrv/compare/4.0.0...4.1.0
[4.0.0]: https://github.com/mserajnik/hydrusrv/compare/3.17.0...4.0.0
[3.17.0]: https://github.com/mserajnik/hydrusrv/compare/3.16.1...3.17.0
[3.16.1]: https://github.com/mserajnik/hydrusrv/compare/3.16.0...3.16.1
[3.16.0]: https://github.com/mserajnik/hydrusrv/compare/3.15.0...3.16.0
[3.15.0]: https://github.com/mserajnik/hydrusrv/compare/3.14.0...3.15.0
[3.14.0]: https://github.com/mserajnik/hydrusrv/compare/3.13.0...3.14.0
[3.13.0]: https://github.com/mserajnik/hydrusrv/compare/3.12.1...3.13.0
[3.12.1]: https://github.com/mserajnik/hydrusrv/compare/3.12.0...3.12.1
[3.12.0]: https://github.com/mserajnik/hydrusrv/compare/3.11.0...3.12.0
[3.11.0]: https://github.com/mserajnik/hydrusrv/compare/3.10.0...3.11.0
[3.10.0]: https://github.com/mserajnik/hydrusrv/compare/3.9.0...3.10.0
[3.9.0]: https://github.com/mserajnik/hydrusrv/compare/3.8.0...3.9.0
[3.8.0]: https://github.com/mserajnik/hydrusrv/compare/3.7.1...3.8.0
[3.7.1]: https://github.com/mserajnik/hydrusrv/compare/3.7.0...3.7.1
[3.7.0]: https://github.com/mserajnik/hydrusrv/compare/3.6.0...3.7.0
[3.6.0]: https://github.com/mserajnik/hydrusrv/compare/3.5.1...3.6.0
[3.5.1]: https://github.com/mserajnik/hydrusrv/compare/3.5.0...3.5.1
[3.5.0]: https://github.com/mserajnik/hydrusrv/compare/3.4.0...3.5.0
[3.4.0]: https://github.com/mserajnik/hydrusrv/compare/3.3.0...3.4.0
[3.3.0]: https://github.com/mserajnik/hydrusrv/compare/3.2.0...3.3.0
[3.2.0]: https://github.com/mserajnik/hydrusrv/compare/3.1.1...3.2.0
[3.1.1]: https://github.com/mserajnik/hydrusrv/compare/3.1.0...3.1.1
[3.1.0]: https://github.com/mserajnik/hydrusrv/compare/3.0.0...3.1.0
[3.0.0]: https://github.com/mserajnik/hydrusrv/compare/2.11.0...3.0.0
[2.11.0]: https://github.com/mserajnik/hydrusrv/compare/2.10.1...2.11.0
[2.10.1]: https://github.com/mserajnik/hydrusrv/compare/2.10.0...2.10.1
[2.10.0]: https://github.com/mserajnik/hydrusrv/compare/2.9.1...2.10.0
[2.9.1]: https://github.com/mserajnik/hydrusrv/compare/2.9.0...2.9.1
[2.9.0]: https://github.com/mserajnik/hydrusrv/compare/2.8.1...2.9.0
[2.8.1]: https://github.com/mserajnik/hydrusrv/compare/2.8.0...2.8.1
[2.8.0]: https://github.com/mserajnik/hydrusrv/compare/2.7.1...2.8.0
[2.7.1]: https://github.com/mserajnik/hydrusrv/compare/2.7.0...2.7.1
[2.7.0]: https://github.com/mserajnik/hydrusrv/compare/2.6.1...2.7.0
[2.6.1]: https://github.com/mserajnik/hydrusrv/compare/2.6.0...2.6.1
[2.6.0]: https://github.com/mserajnik/hydrusrv/compare/2.5.2...2.6.0
[2.5.2]: https://github.com/mserajnik/hydrusrv/compare/2.5.1...2.5.2
[2.5.1]: https://github.com/mserajnik/hydrusrv/compare/2.5.0...2.5.1
[2.5.0]: https://github.com/mserajnik/hydrusrv/compare/2.4.0...2.5.0
[2.4.0]: https://github.com/mserajnik/hydrusrv/compare/2.3.0...2.4.0
[2.3.0]: https://github.com/mserajnik/hydrusrv/compare/2.2.0...2.3.0
[2.2.0]: https://github.com/mserajnik/hydrusrv/compare/2.1.0...2.2.0
[2.1.0]: https://github.com/mserajnik/hydrusrv/compare/2.0.1...2.1.0
[2.0.1]: https://github.com/mserajnik/hydrusrv/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/mserajnik/hydrusrv/compare/1.5.1...2.0.0
[1.5.1]: https://github.com/mserajnik/hydrusrv/compare/1.5.0...1.5.1
[1.5.0]: https://github.com/mserajnik/hydrusrv/compare/1.4.0...1.5.0
[1.4.0]: https://github.com/mserajnik/hydrusrv/compare/1.3.2...1.4.0
[1.3.2]: https://github.com/mserajnik/hydrusrv/compare/1.3.1...1.3.2
[1.3.1]: https://github.com/mserajnik/hydrusrv/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/mserajnik/hydrusrv/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/mserajnik/hydrusrv/compare/1.1.2...1.2.0
[1.1.2]: https://github.com/mserajnik/hydrusrv/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/mserajnik/hydrusrv/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/mserajnik/hydrusrv/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/mserajnik/hydrusrv/compare/1.0.0...1.0.1
