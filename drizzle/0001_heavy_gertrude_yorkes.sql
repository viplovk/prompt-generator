CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workflowId` varchar(96) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorites_user_workflow_uq` UNIQUE(`userId`,`workflowId`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`workflowId` varchar(96),
	`provider` varchar(48) NOT NULL,
	`providerPurchaseId` varchar(160) NOT NULL,
	`status` enum('pending','paid','refunded','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchases_providerPurchaseId_unique` UNIQUE(`providerPurchaseId`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workflowId` varchar(96) NOT NULL,
	`rating` int NOT NULL,
	`body` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_user_workflow_uq` UNIQUE(`userId`,`workflowId`)
);
--> statement-breakpoint
CREATE TABLE `saved_outputs` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`workflowId` varchar(96) NOT NULL,
	`runId` varchar(36),
	`title` varchar(200) NOT NULL,
	`inputs` json NOT NULL,
	`result` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_outputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(48) NOT NULL,
	`providerSubscriptionId` varchar(160) NOT NULL,
	`status` enum('trialing','active','past_due','canceled','expired') NOT NULL DEFAULT 'trialing',
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_providerSubscriptionId_unique` UNIQUE(`providerSubscriptionId`)
);
--> statement-breakpoint
CREATE TABLE `workflow_runs` (
	`id` varchar(36) NOT NULL,
	`userId` int,
	`workflowId` varchar(96) NOT NULL,
	`inputs` json NOT NULL,
	`result` json NOT NULL,
	`status` enum('success','failed') NOT NULL,
	`durationMs` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` varchar(96) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(64) NOT NULL DEFAULT 'Sparkles',
	`timeSaved` varchar(48) NOT NULL DEFAULT '1 hr',
	`ratingTenths` int NOT NULL DEFAULT 48,
	`usageCount` int NOT NULL DEFAULT 0,
	`pricing` enum('free','pro') NOT NULL DEFAULT 'free',
	`implemented` int NOT NULL DEFAULT 0,
	`isPublished` int NOT NULL DEFAULT 1,
	`inputs` json NOT NULL,
	`promptTemplate` text NOT NULL,
	`outputSchema` json NOT NULL,
	`features` json NOT NULL,
	`steps` json NOT NULL,
	`sampleOutput` text NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflows_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_workflowId_workflows_id_fk` FOREIGN KEY (`workflowId`) REFERENCES `workflows`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_workflowId_workflows_id_fk` FOREIGN KEY (`workflowId`) REFERENCES `workflows`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_workflowId_workflows_id_fk` FOREIGN KEY (`workflowId`) REFERENCES `workflows`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_outputs` ADD CONSTRAINT `saved_outputs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_outputs` ADD CONSTRAINT `saved_outputs_workflowId_workflows_id_fk` FOREIGN KEY (`workflowId`) REFERENCES `workflows`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_outputs` ADD CONSTRAINT `saved_outputs_runId_workflow_runs_id_fk` FOREIGN KEY (`runId`) REFERENCES `workflow_runs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflow_runs` ADD CONSTRAINT `workflow_runs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflow_runs` ADD CONSTRAINT `workflow_runs_workflowId_workflows_id_fk` FOREIGN KEY (`workflowId`) REFERENCES `workflows`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflows` ADD CONSTRAINT `workflows_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;