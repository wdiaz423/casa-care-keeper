CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`)
);

CREATE TABLE IF NOT EXISTS `home` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `ownerId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `owner_idx` (`ownerId`),
  CONSTRAINT `home_owner_fk` FOREIGN KEY (`ownerId`) REFERENCES `user` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `task` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(50) NOT NULL DEFAULT 'open',
  `homeId` int NOT NULL,
  `assignedToId` int DEFAULT NULL,
  `category` VARCHAR(50) DEFAULT 'General',
  `frequencyValue` INT DEFAULT 1,
  `frequencyUnit` VARCHAR(20) DEFAULT 'months',
  `lastCompleted` DATETIME NULL,
  `startDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `dueDate` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `home_idx` (`homeId`),
  KEY `assigned_idx` (`assignedToId`),
  CONSTRAINT `task_home_fk` FOREIGN KEY (`homeId`) REFERENCES `home` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_user_fk` FOREIGN KEY (`assignedToId`) REFERENCES `user` (`id`) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS `home_member` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` varchar(50) NOT NULL DEFAULT 'member',
  `userId` int NOT NULL,
  `homeId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `member_userIdx` (`userId`),
  KEY `member_homeIdx` (`homeId`),
  CONSTRAINT `member_user_fk` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `member_home_fk` FOREIGN KEY (`homeId`) REFERENCES `home` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `home_invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `homeId` int NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `invitation_homeIdx` (`homeId`),
  CONSTRAINT `invitation_home_fk` FOREIGN KEY (`homeId`) REFERENCES `home` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `completion_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `taskId` int NOT NULL,
  `completed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT NULL,
  PRIMARY KEY (`id`),
  
  KEY `history_user_idx` (`user_id`),
  KEY `history_task_idx` (`task_id`),
  -- Relaciones
  CONSTRAINT `history_user_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `history_task_fk` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


