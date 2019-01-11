-- Up
DROP TABLE `old_users`;

-- Down
CREATE TABLE `old_users` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
  `username` TEXT NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `created` INTEGER NOT NULL
);
