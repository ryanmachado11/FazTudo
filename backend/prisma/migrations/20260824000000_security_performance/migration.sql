-- Prevent duplicate reviews and add indexes used by authenticated list/dashboard queries.
ALTER TABLE `provider_profiles` ADD COLUMN `specialties` JSON NULL;
CREATE UNIQUE INDEX `reviews_service_request_id_key` ON `reviews`(`service_request_id`);
CREATE INDEX `user_verifications_user_id_created_at_idx` ON `user_verifications`(`user_id`, `created_at`);
CREATE INDEX `service_requests_client_id_created_at_idx` ON `service_requests`(`client_id`, `created_at`);
CREATE INDEX `service_requests_provider_id_status_created_at_idx` ON `service_requests`(`provider_id`, `status`, `created_at`);
CREATE INDEX `chat_rooms_client_id_created_at_idx` ON `chat_rooms`(`client_id`, `created_at`);
CREATE INDEX `chat_rooms_provider_id_created_at_idx` ON `chat_rooms`(`provider_id`, `created_at`);
CREATE INDEX `chat_messages_room_id_created_at_idx` ON `chat_messages`(`room_id`, `created_at`);
CREATE INDEX `reviews_provider_id_status_created_at_idx` ON `reviews`(`provider_id`, `status`, `created_at`);
CREATE INDEX `reviews_client_id_created_at_idx` ON `reviews`(`client_id`, `created_at`);
