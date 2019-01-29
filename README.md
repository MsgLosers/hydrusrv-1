# hydrusrv [![Build status][travis-badge]][travis] [![Docker Hub build][docker-hub-badge]][docker-hub] [![Known vulnerabilities][snyk-badge]][snyk] [![JavaScript Standard Style][standardjs-badge]][standardjs] [![FOSSA status][fossa-badge]][fossa]

> A small application for serving media managed with
> [hydrus server][hydrus-server] via API

hydrusrv is a small application based on [Express][express] that can serve
media managed with [hydrus server][hydrus-server] over a REST-like API. A
separate application called [hydrusrv-sync][hydrusrv-sync] is used to access
the databases of hydrus server and copy over the data into hydrusrv's content
database.

hydrusrv provides its own (simple) user handling and token-based
authentication (stored in a separate database) instead of relying on hydrus
server's access keys.

A [Vue][vue]-based Web client for hydrusrv called [hydrusrvue][hydrusrvue] is
also available.

## Table of contents

+ [Install](#install)
  + [Dependencies](#dependencies)
  + [Updating](#updating)
    + [Upgrading from 7.x to 8.x](#upgrading-from-7x-to-8x)
    + [Upgrading from 6.x to 7.x](#upgrading-from-6x-to-7x)
    + [Upgrading from 5.x to 6.x](#upgrading-from-5x-to-6x)
    + [Upgrading from 4.x to 5.x](#upgrading-from-4x-to-5x)
    + [Upgrading from 3.x to 4.x](#upgrading-from-3x-to-4x)
    + [Upgrading from 2.x to 3.x](#upgrading-from-2x-to-3x)
    + [Upgrading from 1.x to 2.x](#upgrading-from-1x-to-2x)
+ [Usage](#usage)
  + [Configuration](#configuration)
  + [Running the server](#running-the-server)
    + [Running with Docker](#running-with-docker)
+ [API](#api)
+ [Disclaimer](#disclaimer)
+ [Demo](#demo)
+ [Attribution](#attribution)
+ [Donate](#donate)
+ [Maintainer](#maintainer)
+ [Contribute](#contribute)
+ [License](#license)

## Install

The easiest way to install is via cloning this repository:

```zsh
user@local:~$ git clone https://github.com/mserajnik/hydrusrv.git
user@local:~$ cd hydrusrv
user@local:hydrusrv$ yarn
```

If you encounter any errors during installation, those are likely caused by
packages hydrusrv uses that utilize native bindings (e.g.,
[better-sqlite3][better-sqlite3] and [phc-argon2][phc-argon2]).

Please check the error message and contact the maintainers of those packages
directly if you cannnot resolve your issues.

### Dependencies

+ [hydrusrv-sync][hydrusrv-sync] (`3.x` for hydrusrv `8.x`)
+ [Node.js][node-js]
+ [Yarn][yarn]

I usually use the latest versions of Node.js and Yarn; if there has not been an
update to this repository in a while and something breaks on the latest
Node/Yarn version, please [let me know][issues].

### Updating

If you have installed via cloning the repository, you can update via Git:

```zsh
user@local:hydrusrv$ git pull
user@local:hydrusrv$ yarn
user@local:hydrusrv$ yarn migrate
```

Always make sure to run `yarn` after updating to install any packages you might
be missing. `yarn migrate` updates your authentication database with the latest 
changes.

hydrusrv follows [semantic versioning][semantic-versioning] and any breaking
changes that require additional attention will be released under a new major
version (e.g., `2.0.0`). Minor version updates (e.g., `1.1.0` or `1.2.0`) are
therefore always safe to simply install via the routine mentioned before.

When necessary, this section will be expanded with upgrade guides to new major
versions.

#### Upgrading from 7.x to 8.x

Upgrading from `7.x` to `8.x` can be done via
`git pull && yarn && yarn migrate` and requires no further manual changes.

If you are using hydrusrvue, you need to upgrade it to `5.x` to maintain
compatibility with hydrusrv `8.x`.

#### Upgrading from 6.x to 7.x

Upgrading from `6.x` to `7.x` can be done via
`git pull && yarn && yarn migrate` and requires no further manual changes.

If you are using hydrusrvue, you need to upgrade it to `4.x` to maintain
compatibility with hydrusrv `7.x`.

#### Upgrading from 5.x to 6.x

Upgrading from `5.x` to `6.x` can be done via `git pull && yarn` and requires
no further manual changes.

If you are using hydrusrv-sync and hydrusrvue, you need to upgrade those to
`3.x` to maintain compatibility with hydrusrv `6.x`.

#### Upgrading from 4.x to 5.x

Upgrading from `4.x` to `5.x` can be done via `git pull && yarn` and requires
manual updates/changes in `.env`.

If you are using hydrusrv-sync and hydrusrvue, you need to upgrade those to
`2.x` to maintain compatibility with hydrusrv `5.x`.

#### Upgrading from 3.x to 4.x

Upgrading from `3.x` to `4.x` can be done via `git pull && yarn` and requires
manual updates/changes in `.env`. You also need to make additional manual
adjustments as described in the following upgrade guide:

Starting with `4.0.0`, hydrusrv no longer copies the hydrus server data over by
itself, but relies on a separate application called
[hydrusrv-sync][hydrusrv-sync] to do so.

This change was mainly made to increase performance. Before, hydrusrv would
hold all the copied data in-memory, only allowing for a single thread to access
it. Due to the SQLite library that's being used only featuring a synchronous
API, a single request or a sync task could block the whole API.

With `4.x`, hydrusrv-sync persists the data and hydrusrv accesses it using
multiple workers (by default, one for every logical CPU core, but that is
configurable), multiplying the possible requests per seconds since a single
requests will only block a single worker for a very short period.

In addition, hydrusrv now uses two databases – the authentication database and
the content database. While the authentication database is basically what the
old app database was and is still managed completely by hydrusrv itself using
migrations, the content database holds the hydrus server data and is managed by
hydrusrv-sync, hydrusrv itself only reads from it.

Therefore, you have to install hydrusrv-sync and either run it manually every
time you want to sync the data from hydrus server or set up a cron job
(recommended).

Renaming the old `app.db` to `authentication.db` should work so you do not have
to migrate the users manually.

#### Upgrading from 2.x to 3.x

Upgrading from `2.x` to `3.x` can be done via `git pull && yarn`. You also
need to make additional manual adjustments as described in the following
upgrade guide:

The app database structure has changed, with the table `tokens` having a new
column `media_hash`. You need to either re-create your database from the
template or add this column to your existing database manually.

It is __strongly recommended__ to re-create the database by copying the
template and running migrations (`yarn migrate`). This will ensure that any
future changes will just require running migrations instead of making manual
adjustments or starting over with an empty database.

#### Upgrading from 1.x to 2.x

Upgrading from `1.x` to `2.x` can be done via `git pull && yarn` and requires
manual updates/changes in `.env`.

## Usage

### Configuration

After installing, the first thing you want to do is duplicating both the
authentication database template and the content database template you can find
under `storage/authentication.db.template` and `storage/content.db.template`.
These [SQLite][sqlite] databases are used to store both the users and tokens
for authentication, as well as a copy of the hydrus server data in an optimized
form (for faster on-demand querying).

The default (and recommended) location of the databases is
`storage/authentication.db` and `storage/content.db`, but you are free to put
them wherever you want and can rename them to your liking.

Next, you also need to duplicate `.env.example` to `.env`. This file is used to
configure hydrusrv and needs to be located in the root directory of the
application.

After copying it, you can edit `.env` and change hydrusrv's configuration. The
following are all the available settings (along with their default values):

+ `NODE_ENV=development`: defines the environment hydrusrv is running in.
  It currently does not affect anything besides the access logging but it
  should be set to `production` in a live environment and `development` when
  developing.
+ `URL=https://example.com`: the URL under which hydrusrv is accessible. Used
  to generate media URLs. __No trailing slashes.__
+ `PORT=8000`: the port hydrusrv is listening on. This can be different than
  the port used to access it from outside when proxying via [nginx][nginx]
  (recommended) or similar solutions.
+ `API_BASE=/api`: the base path of all the API routes. __No trailing__
  __slashes.__
+ `MEDIA_BASE=/media`: the base path of all the media routes. __No trailing__
  __slashes.__
+ `CROSS_ORIGIN_ALLOWED=false`: allows cross-origin requests (useful when the
  application accessing the API is located on a different domain).
+ `AUTHENTICATION_DB_PATH=./storage/authentication.db`: the authentication
  database path (absolute or relative). The database must exist and the file
  must be read-/writeable for hydrusrv.
+ `CONTENT_DB_PATH=./storage/content.db`: the content database path (absolute
  or relative). The database must exist and the file must be read-/writeable
  for hydrusrv.
+ `HYDRUS_FILES_PATH=`: sets the path to the hydrus server files directory
  (called `server_files`).  __Absolute path required.__
+ `NUMBER_OF_WORKERS=`: sets the number of workers. By default, one worker per
  logical CPU core is used. You might want to decrease or increase that number,
  depending on your needs/hardware. In general, the more workers are running,
  the more requests can be handled simultaneously. But note that increasing the
  number of workers beyond the number of logical CPUs might be detrimental to
  performance or cause even more serious issues (e.g., crashes).
+ `DB_CHECKPOINT_INTERVAL=3600`: sets the interval (in seconds) at which
  hydrusrv [checkpoints][checkpoint] the authentication database (the content
  database is handled by hydrusrv-sync).
+ `REGISTRATION_ENABLED=true`: setting this to `false` disables the creation of
  new users.
+ `AUTHENTICATION_REQUIRED=true`: setting this to `false` allows the access of
  all non-authentication-related routes without providing a (media) token,
  effectively making the API open for anyone to access. This does not disable
  authentication-related routes altogether, it merely makes authentication
  optional.
+ `MIN_PASSWORD_LENGTH=16`: sets the minimum password length when creating or
  updating users. Providing a higher value than `1024` will discard the value
  and use `1024` as the minimum length instead.
+ `FILES_PER_PAGE=42`: the results per page when listing files.
+ `TAGS_PER_PAGE=42`: the results per page when listing tags.
+ `AUTOCOMPLETE_LIMIT=10`: the maximum amount of tag completion results.
+ `COUNTS_ENABLED=false`: enables the output of total counts when listing files
  and tags for the cost of response times (especially with larger databases).
+ `COUNTS_CACHING_ENABLED=false`: setting this to `true` enables the caching of
  file/tag counts (only relevant when `COUNTS_ENABLED` is `true`). This is
  recommended for larger databases to decrease response times when queries are
  made that only differ in page and sorting since the count will only need to
  be calculated once (for the first query). On smaller databases, the
  performance gain might not be noticeable (or it might even be slighty slower
  for very fast queries). The cache is emptied when hydrusrv-sync runs.
+ `ACCESS_LOGGING_ENABLED=false`: setting this to `false` disables access
  logging when
  `NODE_ENV=production` is set.
+ `ACCESS_LOGFILE_PATH_OVERRIDE=`: overrides the default access logfile
  location (`logs/access.log`. Logging to a file is only enabled with
  `ACCESS_LOGGING_ENABLED=true` and `NODE_ENV=production`. With
  `NODE_ENV=development`, hydrusrv logs to the console instead.
  __Absolute path required.__

After you are done making adjustments, make sure `AUTHENTICATION_DB_PATH`
points to the correct location and run migrations to finish setting up the
authentication database:

```zsh
user@local:hydrusrv$ yarn migrate
```

The content database does not have any migrations since it is entirely managed
by hydrusrv-sync.

### Running the server

First of all, you have several options to start the server:

+ `yarn start-dev`: starts the server in development mode using
  [nodemon][nodemon] to watch for file changes and restarts when necessary.
+ `yarn start`: starts the server in production mode.
+ `./bin/www`: the script that is run when using both, `start-dev` and `start`.
  You can also execute it directly to start the server in production mode.

For running in production mode, you will likely want to set up both a reverse
proxy (I recommend [nginx][nginx]) and a way to autostart hydrusrv when booting
your machine (I personally use [Supervisor][supervisor]).

### Running with Docker

You can also run hydrusrv with [Docker][docker] if you want to. A
[Docker image][docker-hub] is available on Docker Hub.

See [here][hydrusrv-docker] for a [Docker Compose][docker-compose] setup that
combines hydrus server, hydrusrv and hydrusrv-sync into an easy-to-use package.

If you want to create your own setup, please take a look at the
[Dockerfile](Dockerfile) and the
[entrypoint file](.docker/docker-entrypoint.sh) to figure out how to configure
it.

## API

You can find the API documentation [here](API.md).

## Disclaimer

In addition to the points described in the [MIT license](LICENSE.md), I,
[mserajnik][maintainer], creator and maintainer of hydrusrv, hereby explicitly
state that hydrusrv is currently deployed on the following official
installations:

+ [https://hydrusrvue.mser.at][hydrusrvue-demo]

No other installations are in any way affiliated with or controlled by me and I
do not condone the usage of hydrusrv for publishing content that is
copyrighted and/or considered illegal in any country or place. hydrusrv is open
source software and it is up to the individual or group using it to make sure
it is not used for illegal activities. I cannot be held accountable for any
usage of hydrusrv that is outside of the aforementioned official installations.

## Demo

You can find a demo installation of [hydrusrvue][hydrusrvue] at
[https://hydrusrvue.mser.at][hydrusrvue-demo]. The hydrusrv API is available
under [https://hydrusrvue.mser.at/api][hydrusrvue-demo-api].

Please take note that I am running this installation using
[hydrusrv-docker][hydrusrv-docker] on a small
[Vultr Cloud Compute][vultr-cloud-compute] instance with limited performance,
bandwidth and traffic (meaning the demo could go down until the next month if
the traffic limit gets exceeded).

It contains only safe for work images tagged with `scenery` (take a look at the
[hydrusrvue screenshots][hydrusrvue-screenshots] for some examples).

Registration is enabled, so feel free to create as many users as you would
like. __Created users are deleted at 12am every day.__

If you are the creator of one or more of the images used in this demo
installation and would like to have your content removed, please
[message me](mailto:hello@mserajnik.at) or [open an issue][issues] and I will
comply with your request at once.

## Attribution

Special thanks to the user [FredericaBernkastel][frederica-bernkastel] for
providing valuable input and writing some amazing performance improvements
that makes hydrusrv far more usable, especially with larger hydrus server
databases.

A big thank you also to the [developer of hydrus network][hydrus-developer] for
putting up with my questions and encouraging me to work on this project.

## Donate

If you like hydrusrv and want to buy me a coffee, feel free to donate via
PayPal:

[![Donate via PayPal][paypal-image]][paypal]

Alternatively, you can also send me BTC:

![Donate BTC][btc-image]  
`13jRyroNn8QF4mbGZxKS6mR3PsxjYTsGsu`

Donations are unnecessary, but very much appreciated. :)

## Maintainer

[mserajnik][maintainer]

## Contribute

You are welcome to help out!

[Open an issue][issues] or submit a pull request.

## License

[MIT](LICENSE.md) © Michael Serajnik

[travis]: https://travis-ci.org/mserajnik/hydrusrv
[travis-badge]: https://img.shields.io/travis/mserajnik/hydrusrv/master.svg

[docker-hub-badge]: https://img.shields.io/docker/automated/mserajnik/hydrusrv.svg

[snyk]: https://snyk.io/test/github/mserajnik/hydrusrv
[snyk-badge]: https://snyk.io/test/github/mserajnik/hydrusrv/badge.svg

[standardjs]: https://standardjs.com
[standardjs-badge]: https://img.shields.io/badge/code_style-standard-brightgreen.svg

[fossa]: https://app.fossa.io/projects/git%2Bgithub.com%2Fmserajnik%2Fhydrusrv
[fossa-badge]: https://app.fossa.io/api/projects/git%2Bgithub.com%2Fmserajnik%2Fhydrusrv.svg?type=shield

[express]: https://expressjs.com/
[hydrus-server]: http://hydrusnetwork.github.io/hydrus
[hydrusrv-sync]: https://github.com/mserajnik/hydrusrv-sync
[vue]: https://vuejs.org/
[hydrusrvue]: https://github.com/mserajnik/hydrusrvue
[better-sqlite3]: https://github.com/JoshuaWise/better-sqlite3/wiki/Troubleshooting-installation
[phc-argon2]: https://github.com/simonepri/phc-argon2
[node-js]: https://nodejs.org/en/
[yarn]: https://yarnpkg.com/
[semantic-versioning]: https://semver.org/
[sqlite]: https://www.sqlite.org/
[nginx]: https://nginx.org/
[checkpoint]: https://www.sqlite.org/c3ref/wal_checkpoint.html
[supported-mime-types]: https://github.com/mserajnik/hydrusrv/blob/master/server/config/hydrus.js#L2-L14
[nodemon]: https://github.com/remy/nodemon
[supervisor]: http://supervisord.org/
[docker]: https://www.docker.com/
[docker-hub]: https://hub.docker.com/r/mserajnik/hydrusrv/
[hydrusrv-docker]: https://github.com/mserajnik/hydrusrv-docker
[docker-compose]: https://docs.docker.com/compose/
[hydrusrvue-demo]: https://hydrusrvue.mser.at
[hydrusrvue-demo-api]: https://hydrusrvue.mser.at/api
[vultr-cloud-compute]: https://www.vultr.com/pricing/
[hydrusrvue-screenshots]: https://github.com/mserajnik/hydrusrvue#screenshots
[frederica-bernkastel]: https://github.com/FredericaBernkastel
[hydrus-developer]: https://github.com/hydrusnetwork

[paypal]: https://www.paypal.me/mserajnik
[paypal-image]: https://www.paypalobjects.com/webstatic/en_US/i/btn/png/blue-rect-paypal-26px.png
[btc-image]: https://mserajnik.at/external/btc.png

[maintainer]: https://github.com/mserajnik
[issues]: https://github.com/mserajnik/hydrusrv/issues/new
