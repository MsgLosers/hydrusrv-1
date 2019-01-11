-- Up
INSERT INTO `users` (
  `id`,
  `username`,
  `password`,
  `created_at`,
  `updated_at`
) SELECT
    `id`,
    `username`,
    `password`,
    `created`,
    `created` AS `updated`
  FROM `old_users`;

-- Down
DELETE FROM `users`;
