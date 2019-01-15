-- Up
ALTER TABLE `users` RENAME TO `old_users`;

-- Down
ALTER TABLE `old_users` RENAME TO `users`;
