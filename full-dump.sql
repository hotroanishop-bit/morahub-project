-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: morahub
-- ------------------------------------------------------
-- Server version	8.0.46-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_models`
--

DROP TABLE IF EXISTS `ai_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_models` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `displayName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pricePer1kIn` decimal(65,30) NOT NULL DEFAULT '0.000000000000000000000000000000',
  `pricePer1kOut` decimal(65,30) NOT NULL DEFAULT '0.000000000000000000000000000000',
  `maxTokens` int NOT NULL DEFAULT '4096',
  `contextWindow` int NOT NULL DEFAULT '128000',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fallbackModel` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ai_models_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_models`
--

LOCK TABLES `ai_models` WRITE;
/*!40000 ALTER TABLE `ai_models` DISABLE KEYS */;
INSERT INTO `ai_models` VALUES ('cmpvl3jy10000zctjhfx2djq8','claude-haiku-4.5','claude-haiku-4.5','ANTHROPIC',0.900000000000000000000000000000,4.500000000000000000000000000000,128000,128000,1,'claude-haiku-4.5','2026-06-01 19:10:57.720',NULL),('cmpvm27gj0000zcqe2e94q5m3','claude-sonnet-4-5','Claude Sonnet 4.5','ANTHROPIC',2.500000000000000000000000000000,13.000000000000000000000000000000,200000,200000,1,'Claude Sonnet 4.5 - balanced','2026-06-01 19:37:54.499',NULL),('cmpvm27i70003zcqet1qixb7x','claude-opus-4.6','Claude Opus 4.6','ANTHROPIC',4.500000000000000000000000000000,21.000000000000000000000000000000,1000000,1000000,1,'Claude Opus 4.6 - 1M context','2026-06-01 19:37:54.560',NULL),('cmpvm40d50000zcriz9x6k196','glm-5','GLM-5','ZHIPU',0.600000000000000000000000000000,2.000000000000000000000000000000,200000,200000,1,'GLM-5 - Zhipu AI','2026-06-01 19:39:18.617',NULL),('cmpvm58g80003zcs1ni1the94','deepseek-r1-distill-qwen-32b','DeepSeek R1 Distill Qwen 32B','DEEPSEEK',0.180000000000000000000000000000,0.180000000000000000000000000000,80000,80000,1,'DeepSeek R1 Distill - reasoning','2026-06-01 19:40:15.753',NULL),('cmpvm5u2e0001zcsocz3uavh3','minimax-m2.1','MiniMax M2.1','MINIMAX',0.150000000000000000000000000000,0.700000000000000000000000000000,197000,197000,1,'MiniMax M2.1 - compact','2026-06-01 19:40:43.767',NULL),('cmpvm6web0002zct8suol5190','mistral-medium-3.5-128b','Mistral Medium 3.5 128B','MISTRAL',0.008000000000000000000000000000,0.008000000000000000000000000000,256000,256000,1,'Mistral Medium 3.5 - free tier → 5đ','2026-06-01 19:41:33.443',NULL),('cmpvm7vx90000zctrq4sbxnrr','deepseek-3.2','DeepSeek 3.2','DEEPSEEK',0.180000000000000000000000000000,0.250000000000000000000000000000,128000,128000,1,'DeepSeek 3.2 - balanced','2026-06-01 19:42:19.486',NULL),('cmpvm7w0e0003zctr89ba6xg1','deepseek-v4-pro','DeepSeek V4 Pro','DEEPSEEK',1.500000000000000000000000000000,7.000000000000000000000000000000,1000000,1000000,1,'DeepSeek V4 Pro - flagship','2026-06-01 19:42:19.598',NULL),('cmpvm8i9p0000zcub74hasnxk','grok-4.3','Grok 4.3','XAI',1.200000000000000000000000000000,2.200000000000000000000000000000,128000,128000,1,'Grok 4.3 - flagship','2026-06-01 19:42:48.445',NULL),('cmpvm8iad0001zcubdt4qjopb','grok-4.20-fast','Grok 4.20 Fast','XAI',1.200000000000000000000000000000,2.200000000000000000000000000000,128000,128000,1,'Grok 4.20 Fast - speed','2026-06-01 19:42:48.470',NULL),('cmpvm8iax0002zcubh7mevfs2','grok-4.20-thinking','Grok 4.20 Thinking','XAI',1.200000000000000000000000000000,2.200000000000000000000000000000,128000,128000,1,'Grok 4.20 Thinking - reasoning','2026-06-01 19:42:48.489',NULL),('gpt54','gpt-5.4','GPT-5.4','OPENAI',1.500000000000000000000000000000,10.000000000000000000000000000000,16384,1050000,1,'GPT-5.4 - balanced','2026-06-02 10:59:07.000',NULL),('gpt54mini','gpt-5.4-mini','GPT-5.4 Mini','OPENAI',0.500000000000000000000000000000,3.000000000000000000000000000000,16384,400000,1,'GPT-5.4 Mini - fast & cheap','2026-06-02 10:59:07.000',NULL),('gpt55','gpt-5.5','GPT-5.5','OPENAI',3.000000000000000000000000000000,14.000000000000000000000000000000,16384,1050000,1,'GPT-5.5 - flagship model','2026-06-02 10:59:07.000',NULL),('gpt55codex','haidinhphu1704/gpt-5.5-codex','GPT-5.5 Codex (Community)','OPENAI',0.600000000000000000000000000000,3.000000000000000000000000000000,16384,128000,1,'Community model by haidinhphu1704','2026-06-02 10:59:07.000',NULL);
/*!40000 ALTER TABLE `ai_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_keys`
--

DROP TABLE IF EXISTS `api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_keys` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `totalCalls` int NOT NULL DEFAULT '0',
  `totalTokens` int NOT NULL DEFAULT '0',
  `lastModel` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastUsedAt` datetime(3) DEFAULT NULL,
  `allowedDomains` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allowedIPs` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiresAt` datetime(3) DEFAULT NULL,
  `keyType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FULL',
  `projectId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rateLimit` int DEFAULT NULL,
  `revokedAt` datetime(3) DEFAULT NULL,
  `maxCalls` int DEFAULT NULL,
  `maxTokens` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_keys_key_key` (`key`),
  KEY `api_keys_userId_fkey` (`userId`),
  KEY `api_keys_projectId_fkey` (`projectId`),
  CONSTRAINT `api_keys_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `api_keys_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_keys`
--

LOCK TABLES `api_keys` WRITE;
/*!40000 ALTER TABLE `api_keys` DISABLE KEYS */;
INSERT INTO `api_keys` VALUES ('cmpv9zuhk0003zc5cdeorn3a5','cmpv5imb9000ezc0ie7xoh0bg','Test Key','mh-bI4186uamD17Y1fGg5JYtZsoIIajQCV0G9NXECmWKojauqoP',1,126,25413,'deepseek-3.2','2026-06-01 14:00:08.984','2026-06-02 11:24:08.423',NULL,NULL,NULL,'FULL',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `api_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_userId_fkey` (`userId`),
  CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sessionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokens` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `chat_messages_sessionId_idx` (`sessionId`),
  CONSTRAINT `chat_messages_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_sessions`
--

DROP TABLE IF EXISTS `chat_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_sessions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `chat_sessions_userId_idx` (`userId`),
  CONSTRAINT `chat_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_sessions`
--

LOCK TABLES `chat_sessions` WRITE;
/*!40000 ALTER TABLE `chat_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount` int NOT NULL,
  `maxUses` int NOT NULL DEFAULT '100',
  `usedCount` int NOT NULL DEFAULT '0',
  `amount` decimal(65,30) NOT NULL DEFAULT '0.000000000000000000000000000000',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `expiresAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `link` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifications_userId_fkey` (`userId`),
  CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('cmpv5imm8000hzc0i7fuwjzj8','cmpv5imb9000ezc0ie7xoh0bg','Chào mừng đến MoraHub! 🎉','Bạn đã đăng nhập thành công với tư cách Administrator. Quản lý hệ thống tại trang Quản Trị.','success',1,NULL,'2026-06-01 11:54:47.169'),('cmpva36bv0008zc5cp95s4njq','cmpv5imb9000ezc0ie7xoh0bg','Bảo trì hệ thống','Hệ thống sẽ bảo trì từ 2:00 - 4:00 AM. Vui lòng lưu lại công việc.','warning',1,NULL,'2026-06-01 14:02:44.299'),('cmpva36bv0009zc5c2ed8aze0','cmpv5imlo000fzc0ik38rob61','Bảo trì hệ thống','Hệ thống sẽ bảo trì từ 2:00 - 4:00 AM. Vui lòng lưu lại công việc.','warning',0,NULL,'2026-06-01 14:02:44.299');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plans` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `displayName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(65,30) NOT NULL,
  `credits` int NOT NULL,
  `rateLimit` int NOT NULL,
  `maxKeys` int NOT NULL DEFAULT '5',
  `maxTokens` int NOT NULL DEFAULT '4096',
  `features` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `sortOrder` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `billingCycle` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `burstLimit` int NOT NULL DEFAULT '0',
  `yearlyPrice` decimal(65,30) DEFAULT NULL,
  `dailyCalls` int NOT NULL DEFAULT '0',
  `dailyTokens` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `plans_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plans`
--

LOCK TABLES `plans` WRITE;
/*!40000 ALTER TABLE `plans` DISABLE KEYS */;
INSERT INTO `plans` VALUES ('cmpv5ilw30000zc0iywbmp1nw','basic','Cơ Bản','Dành cho developer cá nhân',250000.000000000000000000000000000000,100000,30,5,4096,'[\"Tất cả model\",\"Rate limit 30 req/min\",\"100K credits/tháng\",\"Hỗ trợ email\"]',1,1,'2026-06-01 11:54:46.227','monthly',0,NULL,0,0),('cmpv5ilw80001zc0ifhlxyztf','free','Miễn Phí','Dùng thử, không ràng buộc',0.000000000000000000000000000000,10000,10,3,2048,'[\"Tất cả model cơ bản\",\"Rate limit 10 req/min\",\"10K credits/tháng\"]',1,0,'2026-06-01 11:54:46.227','monthly',0,NULL,0,0),('cmpv5ilw90002zc0isw22kukz','enterprise','Doanh Nghiệp','Giải pháp tùy chỉnh',0.000000000000000000000000000000,999999999,999,999,32768,'[\"Tất cả model\",\"Unlimited\",\"Dedicated support\",\"Custom SLA\"]',1,3,'2026-06-01 11:54:46.228','monthly',0,NULL,0,0),('cmpv5ilwa0003zc0ib8847uww','pro','Chuyên Nghiệp','Dành cho team & startup',1000000.000000000000000000000000000000,500000,100,20,8192,'[\"Tất cả model\",\"Rate limit 100 req/min\",\"500K credits/tháng\",\"Hỗ trợ ưu tiên\",\"Streaming\"]',1,2,'2026-06-01 11:54:46.228','monthly',0,NULL,0,0);
/*!40000 ALTER TABLE `plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `projects_userId_fkey` (`userId`),
  CONSTRAINT `projects_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `request_logs`
--

DROP TABLE IF EXISTS `request_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apiKeyId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'POST',
  `requestBody` longtext COLLATE utf8mb4_unicode_ci,
  `responseBody` longtext COLLATE utf8mb4_unicode_ci,
  `statusCode` int DEFAULT NULL,
  `latency` int DEFAULT NULL,
  `tokensIn` int DEFAULT NULL,
  `tokensOut` int DEFAULT NULL,
  `cost` decimal(10,6) DEFAULT NULL,
  `ip` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `cached` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `request_logs_userId_idx` (`userId`),
  KEY `request_logs_apiKeyId_idx` (`apiKeyId`),
  KEY `request_logs_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_logs`
--

LOCK TABLES `request_logs` WRITE;
/*!40000 ALTER TABLE `request_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `request_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_settings` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bankName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VietcomBank',
  `bankBin` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '970432',
  `accountNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `accountName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `minDeposit` int NOT NULL DEFAULT '10000',
  `depositNote` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MoraHub nap tien',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `ckeyApiKey` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `ckeyBaseUrl` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'https://ckey.vn/v1',
  `defaultCredits` int NOT NULL DEFAULT '10000',
  `defaultRateLimit` int NOT NULL DEFAULT '30',
  `notifyDeposit` tinyint(1) NOT NULL DEFAULT '1',
  `notifyNewUser` tinyint(1) NOT NULL DEFAULT '1',
  `notifyTicket` tinyint(1) NOT NULL DEFAULT '1',
  `siteDesc` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `siteName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MoraHub',
  `siteUrl` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'https://morahub.online',
  `supportEmail` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `supportTelegram` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_settings`
--

LOCK TABLES `site_settings` WRITE;
/*!40000 ALTER TABLE `site_settings` DISABLE KEYS */;
INSERT INTO `site_settings` VALUES ('cmpvcgld20000zc9xibkjjlvj','MB Bank','970422','148393','HUYNH THE NGOC',10000,'MoraHub','2026-06-01 15:09:09.543','2026-06-01 15:25:13.319','sk-d1aa240923666cc830e4c6e3403e5cb3ac1dade2e48a18b590cffb92e17f2e86','https://ckey.vn/v1',10000,30,1,1,1,'','MoraHub','https://morahub.online','','ANIKTXV');
/*!40000 ALTER TABLE `site_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `desc` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_messages`
--

DROP TABLE IF EXISTS `ticket_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_messages` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT '0',
  `content` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ticket_messages_ticketId_fkey` (`ticketId`),
  KEY `ticket_messages_senderId_fkey` (`senderId`),
  CONSTRAINT `ticket_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ticket_messages_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_messages`
--

LOCK TABLES `ticket_messages` WRITE;
/*!40000 ALTER TABLE `ticket_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `priority` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `category` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tickets_userId_fkey` (`userId`),
  CONSTRAINT `tickets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES ('cmpv9zuss0005zc5cgomn0lsa','cmpv5imb9000ezc0ie7xoh0bg','Test ticket','RESOLVED','normal','general','2026-06-01 14:00:09.388','2026-06-02 11:19:40.828');
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(65,30) NOT NULL,
  `paymentMethod` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `reference` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adminNote` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `invoiceUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transactions_userId_fkey` (`userId`),
  CONSTRAINT `transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES ('cmpv9zv2r0007zc5c16t7hqxh','cmpv5imb9000ezc0ie7xoh0bg',100000.000000000000000000000000000000,'970432','FAILED','MORAMPV9ZV2QAT0F','Nap 100K',NULL,'2026-06-01 14:00:09.747','2026-06-01 14:19:00.733',NULL),('cmpvaoc3i0001zcva1qc23dbj','cmpv5imb9000ezc0ie7xoh0bg',100000.000000000000000000000000000000,'970432','COMPLETED','MORAMPVAOC3ILVM4','MORA cmpv5imb NAP 100.000d',NULL,'2026-06-01 14:19:11.551','2026-06-01 14:30:49.423',NULL),('cmpvfg6r00003zcpzgmccglbi','cmpv5imb9000ezc0ie7xoh0bg',100000.000000000000000000000000000000,'BANKING','FAILED','MORAMPVFG6Q4X0YT','Nạp 100.000đ',NULL,'2026-06-01 16:32:49.452','2026-06-02 11:20:41.164',NULL),('cmpwjvhwt000dzcghuziluirm','cmpv5imb9000ezc0ie7xoh0bg',100000.000000000000000000000000000000,'BANKING','PENDING','MORAMPWJVHWRMFX6','Nạp 100.000đ',NULL,'2026-06-02 11:24:28.397','2026-06-02 11:24:28.397',NULL),('cmpwvmwub0001zcrcn5040m56','cmpv5imb9000ezc0ie7xoh0bg',100000.000000000000000000000000000000,'BANKING','PENDING','MORAMPWVMWU9PXFX','Nạp 100.000đ',NULL,'2026-06-02 16:53:43.235','2026-06-02 16:53:43.235',NULL),('cmpyfx6uy0002zcgczdyzvki2','cmpv5imb9000ezc0ie7xoh0bg',10000.000000000000000000000000000000,'REFERRAL','COMPLETED',NULL,'Referral reward from moraadmin@gmail.com',NULL,'2026-06-03 19:09:21.274','2026-06-03 19:09:21.274',NULL);
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usage_logs`
--

DROP TABLE IF EXISTS `usage_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usage_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apiKeyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokensIn` int NOT NULL,
  `tokensOut` int NOT NULL,
  `cost` decimal(65,30) NOT NULL,
  `latency` int NOT NULL DEFAULT '0',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success',
  `errorMsg` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `usage_logs_userId_fkey` (`userId`),
  KEY `usage_logs_apiKeyId_fkey` (`apiKeyId`),
  KEY `usage_logs_modelId_fkey` (`modelId`),
  CONSTRAINT `usage_logs_apiKeyId_fkey` FOREIGN KEY (`apiKeyId`) REFERENCES `api_keys` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `usage_logs_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `ai_models` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `usage_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usage_logs`
--

LOCK TABLES `usage_logs` WRITE;
/*!40000 ALTER TABLE `usage_logs` DISABLE KEYS */;
INSERT INTO `usage_logs` VALUES ('cmpvleoco0001zci2jxtijqps','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvl3jy10000zctjhfx2djq8',203,6,0.000000000000000000000000000000,2598,'success',NULL,'2026-06-01 19:19:36.648'),('cmpvleqpv0003zci2rcf9l8dq','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvl3jy10000zctjhfx2djq8',203,6,0.000000000000000000000000000000,2832,'success',NULL,'2026-06-01 19:19:39.715'),('cmpvletpz0005zci2hqpsdppb','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvl3jy10000zctjhfx2djq8',203,6,0.000000000000000000000000000000,3695,'success',NULL,'2026-06-01 19:19:43.607'),('cmpvlfkq60007zci20le7wozy','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvl3jy10000zctjhfx2djq8',200,1,0.000000000000000000000000000000,14211,'success',NULL,'2026-06-01 19:20:18.606'),('cmpvlfmrc0009zci2hnnn7xb5','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvl3jy10000zctjhfx2djq8',200,1,0.000000000000000000000000000000,2442,'success',NULL,'2026-06-01 19:20:21.240'),('cmpvlfoqj000bzci2pd0ymju6','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvl3jy10000zctjhfx2djq8',200,1,0.000000000000000000000000000000,2382,'success',NULL,'2026-06-01 19:20:23.803'),('cmpvlu3fj000dzci2j8k7z12q','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvl3jy10000zctjhfx2djq8',204,136,0.000000000000000000000000000000,5151,'success',NULL,'2026-06-01 19:31:36.031'),('cmpvmc2gx000lzci2bb8nib3x','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvl3jy10000zctjhfx2djq8',199,8,0.164910000000000000000000000000,2650,'success',NULL,'2026-06-01 19:45:34.592'),('cmpvmc60g000nzci2ddvyyvkk','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm27gj0000zcqe2e94q5m3',199,46,0.888029999999999900000000000000,4339,'success',NULL,'2026-06-01 19:45:39.184'),('cmpvmc8tw000pzci2glj034rp','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm27i70003zcqet1qixb7x',198,7,0.803850000000000100000000000000,3315,'success',NULL,'2026-06-01 19:45:42.836'),('cmpvmcxi1000zzci2ad2rlsft','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm7w0e0003zctr89ba6xg1',80,256,1.564000000000000000000000000000,7892,'success',NULL,'2026-06-01 19:46:14.809'),('cmpvmd0eu0011zci2elh9g3vv','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm7vx90000zctrq4sbxnrr',197,51,0.035256000000000000000000000000,2515,'success',NULL,'2026-06-01 19:46:18.582'),('cmpvmdkan0015zci2cgnon6f7','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm58g80003zcs1ni1the94',75,5,0.011040000000000000000000000000,1244,'success',NULL,'2026-06-01 19:46:44.352'),('cmpvmdkv00017zci2bikkimoy','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm8i9p0000zcub74hasnxk',100,56,0.182900000000000000000000000000,4900,'success',NULL,'2026-06-01 19:46:45.085'),('cmpvmdlp10019zci23ifko3h9','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm7w0e0003zctr89ba6xg1',72,5,0.111550000000000000000000000000,1483,'success',NULL,'2026-06-01 19:46:46.165'),('cmpvmdoob001hzci2c2eabl86','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm5u2e0001zcsocz3uavh3',197,9,0.029396000000000000000000000000,1959,'success',NULL,'2026-06-01 19:46:50.028'),('cmpvmeowq001vzci2e9ektf6q','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm6web0002zct8suol5190',85,5,0.000450000000000000000000000000,15320,'success',NULL,'2026-06-01 19:47:36.983'),('cmpvmf879002bzci22j6w1rf7','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm8i9p0000zcub74hasnxk',96,9,0.098373000000000000000000000000,4164,'success',NULL,'2026-06-01 19:48:01.986'),('cmpvmfc9a002dzci2eg1d6cv0','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm8iad0001zcubdt4qjopb',96,13,0.105273000000000000000000000000,4781,'success',NULL,'2026-06-01 19:48:07.246'),('cmpvmfhfk002fzci2j4ba7grj','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm8iax0002zcubh7mevfs2',96,5,0.091473000000000000000000000000,6420,'success',NULL,'2026-06-01 19:48:13.953'),('cmpvmfjx7002jzci2m6d5qixq','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm40d50000zcriz9x6k196',193,43,0.152076000000000000000000000000,2021,'success',NULL,'2026-06-01 19:48:17.176'),('cmpvmjytc002pzci20l6m6jb3','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvl3jy10000zctjhfx2djq8',199,8,0.164910000000000000000000000000,4851,'success',NULL,'2026-06-01 19:51:43.104'),('cmpvmk2fw002rzci285ocpz6s','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm27gj0000zcqe2e94q5m3',199,46,0.888029999999999900000000000000,4354,'success',NULL,'2026-06-01 19:51:47.803'),('cmpvmk4tz002tzci23o038uj1','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm27i70003zcqet1qixb7x',198,7,0.803850000000000100000000000000,2775,'success',NULL,'2026-06-01 19:51:50.903'),('cmpvmku97002vzci29q345ycw','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm7vx90000zctrq4sbxnrr',197,52,0.035449000000000000000000000000,2582,'success',NULL,'2026-06-01 19:52:23.851'),('cmpvmkvg2002xzci27t0qdxcc','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm58g80003zcs1ni1the94',75,5,0.011040000000000000000000000000,1221,'success',NULL,'2026-06-01 19:52:25.394'),('cmpvmkwry002zzci2hu0rga63','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm7w0e0003zctr89ba6xg1',72,5,0.111550000000000000000000000000,1428,'success',NULL,'2026-06-01 19:52:27.118'),('cmpvmkyh50033zci2su396h6a','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm5u2e0001zcsocz3uavh3',197,9,0.029396000000000000000000000000,1919,'success',NULL,'2026-06-01 19:52:29.321'),('cmpvmlcm80035zci29kat3m70','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm6web0002zct8suol5190',85,5,0.000450000000000000000000000000,18040,'success',NULL,'2026-06-01 19:52:47.647'),('cmpvmlkkq0037zci255ozq0ae','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm8i9p0000zcub74hasnxk',96,14,0.106998000000000000000000000000,9962,'success',NULL,'2026-06-01 19:52:57.963'),('cmpvmlo990039zci2a86lqm4i','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm8iad0001zcubdt4qjopb',96,6,0.093198000000000000000000000000,4487,'success',NULL,'2026-06-01 19:53:02.732'),('cmpvmm1gq003bzci2lkeb4t5a','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm8iax0002zcubh7mevfs2',96,7,0.094923000000000010000000000000,16804,'success',NULL,'2026-06-01 19:53:19.845'),('cmpvmm4pg003dzci2zjiipexl','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm40d50000zcriz9x6k196',193,40,0.147660000000000000000000000000,3721,'success',NULL,'2026-06-01 19:53:24.052'),('cmpvmp2e4003hzci28texq6gf','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvl3jy10000zctjhfx2djq8',199,8,0.164910000000000000000000000000,2309,'success',NULL,'2026-06-01 19:55:41.020'),('cmpvmp5sb003jzci2r4a3ueu2','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm27gj0000zcqe2e94q5m3',199,46,0.888029999999999900000000000000,4059,'success',NULL,'2026-06-01 19:55:45.419'),('cmpvmp89p003lzci20zurauao','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm27i70003zcqet1qixb7x',198,7,0.803850000000000100000000000000,2902,'success',NULL,'2026-06-01 19:55:48.637'),('cmpvmpzeo003nzci2iydo224z','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm7vx90000zctrq4sbxnrr',197,78,0.040467000000000000000000000000,4864,'success',NULL,'2026-06-01 19:56:23.809'),('cmpvmq0ko003rzci2ujh3vxgp','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm58g80003zcs1ni1the94',75,5,0.011040000000000000000000000000,1224,'success',NULL,'2026-06-01 19:56:25.320'),('cmpvmq1xm003tzci22d7k5ysh','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm7w0e0003zctr89ba6xg1',72,5,0.111550000000000000000000000000,1480,'success',NULL,'2026-06-01 19:56:27.082'),('cmpvmq7p6003vzci25gv0mfq0','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm5u2e0001zcsocz3uavh3',197,9,0.029396000000000000000000000000,7141,'success',NULL,'2026-06-01 19:56:34.553'),('cmpvmqo04003xzci2x890vqfn','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm6web0002zct8suol5190',85,5,0.000450000000000000000000000000,20848,'success',NULL,'2026-06-01 19:56:55.684'),('cmpvmqunm003zzci2f1h7hv5w','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm8i9p0000zcub74hasnxk',96,9,0.098373000000000000000000000000,8350,'success',NULL,'2026-06-01 19:57:04.306'),('cmpvmqyq90041zci2szpjt693','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm8iad0001zcubdt4qjopb',96,10,0.100098000000000000000000000000,5021,'success',NULL,'2026-06-01 19:57:09.585'),('cmpvmrc2i0043zci2ydx9b1fz','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm8iax0002zcubh7mevfs2',96,10,0.100098000000000000000000000000,17052,'success',NULL,'2026-06-01 19:57:26.872'),('cmpvmre800045zci20eqscbv2','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm40d50000zcriz9x6k196',193,45,0.155020000000000000000000000000,2428,'success',NULL,'2026-06-01 19:57:29.664'),('cmpwaoxb20001zcltl2hgw7c7','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm7vx90000zctrq4sbxnrr',201,7,0.027280000000000000000000000000,2372,'success',NULL,'2026-06-02 07:07:25.214'),('cmpwap5cb0003zcltvguphyht','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm7vx90000zctrq4sbxnrr',198,57,0.036543000000000000000000000000,3889,'success',NULL,'2026-06-02 07:07:35.610'),('cmpwejyt60001zcyc0t9izdes','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm7vx90000zctrq4sbxnrr',198,52,0.035578000000000000000000000000,4114,'success',NULL,'2026-06-02 08:55:32.347'),('cmpwizd910001zcghwmqvi09i','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','gpt55',2491,8,0.005078000000000000000000000000,3043,'success',NULL,'2026-06-02 10:59:29.365'),('cmpwiznxj0003zcgh6tttla17','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','gpt54',2487,6,0.002535000000000000000000000000,2256,'success',NULL,'2026-06-02 10:59:43.207'),('cmpwizyb50005zcghhmw5ube8','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','gpt54mini',304,6,0.000136000000000000000000000000,13329,'success',NULL,'2026-06-02 10:59:56.658'),('cmpwj05es0007zcgh97afgo3g','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','gpt55codex',2217,6,0.001123500000000000000000000000,9075,'success',NULL,'2026-06-02 11:00:05.860'),('cmpwj0rq20009zcghny9wm52m','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','gpt55',4487,6,0.009045999999999998000000000000,6372,'success',NULL,'2026-06-02 11:00:34.778'),('cmpwjv2i2000bzcghea4uqz0u','cmpv5imb9000ezc0ie7xoh0bg','cmpv9zuhk0003zc5cdeorn3a5','cmpvm7vx90000zctrq4sbxnrr',212,52,0.051160000000000000000000000000,4503,'success',NULL,'2026-06-02 11:24:08.425');
/*!40000 ALTER TABLE `usage_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creditBalance` decimal(65,30) NOT NULL DEFAULT '0.000000000000000000000000000000',
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `planId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `planStartDate` datetime(3) DEFAULT NULL,
  `planEndDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referralCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referredBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `twoFactorEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `twoFactorSecret` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegramId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegramVerified` tinyint(1) NOT NULL DEFAULT '0',
  `telegramVerifyCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegramVerifyExpiry` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_referralCode_key` (`referralCode`),
  UNIQUE KEY `users_telegramId_key` (`telegramId`),
  KEY `users_planId_fkey` (`planId`),
  CONSTRAINT `users_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('cmpv5imb9000ezc0ie7xoh0bg','admin@morahub.com','Admin','$2b$12$Ug78Q/rEUq1LZzFBsbMkKegWiYkML7dNrO6kuvdnRQuFIzcdcGAiW',NULL,1088389.877123499999999982000000000000,'ADMIN','ACTIVE',NULL,NULL,NULL,'2026-06-01 11:54:46.773','2026-06-03 19:09:21.228',NULL,'MHXOH0BG',NULL,0,NULL,NULL,0,NULL,NULL),('cmpv5imlo000fzc0ik38rob61','user@morahub.com','Test User','$2b$12$MMjCSFNCVUCP7H2ORRRNy.Vu7jinhluspgEaLOi9uxcA9W5tqO0EO',NULL,10000.000000000000000000000000000000,'USER','ACTIVE',NULL,NULL,NULL,'2026-06-01 11:54:47.149','2026-06-01 11:54:47.149',NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL),('cmpyfx6sj0000zcgcvdtybjaf','moraadmin@gmail.com','Anh văn tin','$2b$12$sksSq1/sEk6tCrYI7BYn7OlzelLpAEiB9QxJ6fGvduM8vGIletLTO',NULL,10000.000000000000000000000000000000,'USER','ACTIVE',NULL,NULL,NULL,'2026-06-03 19:09:21.188','2026-06-03 19:17:00.921',NULL,'MHTYBJAF','MHXOH0BG',0,NULL,NULL,0,'9EBE56','2026-06-03 19:22:07.788');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhooks`
--

DROP TABLE IF EXISTS `webhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhooks` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `events` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `secret` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `webhooks_userId_fkey` (`userId`),
  CONSTRAINT `webhooks_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhooks`
--

LOCK TABLES `webhooks` WRITE;
/*!40000 ALTER TABLE `webhooks` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhooks` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03 19:23:26
