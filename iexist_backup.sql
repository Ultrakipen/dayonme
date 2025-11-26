-- MySQL dump 10.13  Distrib 8.0.39, for Win64 (x86_64)
--
-- Host: localhost    Database: iexist
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

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
-- Table structure for table `anonymous_encouragements`
--

DROP TABLE IF EXISTS `anonymous_encouragements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anonymous_encouragements` (
  `encouragement_id` int(11) NOT NULL AUTO_INCREMENT,
  `to_user_id` int(11) NOT NULL COMMENT '諛쏅뒗 ?ъ슜?? ID',
  `message` varchar(100) NOT NULL,
  `sent_at` datetime NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `template_id` int(11) DEFAULT NULL,
  `is_custom` tinyint(1) DEFAULT 0 COMMENT '커스텀 메시지 여부',
  PRIMARY KEY (`encouragement_id`),
  KEY `idx_to_user` (`to_user_id`),
  KEY `idx_sent_at` (`sent_at`),
  KEY `idx_template` (`template_id`),
  CONSTRAINT `anonymous_encouragements_ibfk_1` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='?듬챸 寃⑸젮 硫붿떆吏? - ?꾩쟾 ?듬챸, sender ?뺣낫 ?놁쓬';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anonymous_encouragements`
--

LOCK TABLES `anonymous_encouragements` WRITE;
/*!40000 ALTER TABLE `anonymous_encouragements` DISABLE KEYS */;
INSERT INTO `anonymous_encouragements` VALUES (1,2051,'dksggggghg','2025-10-13 15:15:44',0,NULL,0),(2,2037,'test2 --> 울트라에게 메세지 보냄','2025-10-14 01:23:24',1,NULL,0),(3,2037,'2qjsWo testdlqslek.','2025-10-14 01:49:59',1,NULL,0),(4,2037,'ggggggggg','2025-10-14 02:04:30',1,NULL,0),(5,2051,'cd C:/app_build/Iexist/backend\n  mysql -u root -psw309824!@ iexist < check_notifications.sql','2025-10-14 05:20:12',0,NULL,0),(6,2051,'안녕하세요','2025-10-16 05:01:13',0,NULL,0),(7,2037,'힘내세요 화이팅입니다.','2025-10-16 06:49:56',1,NULL,0),(8,2056,'dsddsgdsgds','2025-11-12 06:10:17',0,NULL,0),(9,2056,'sssdfsdsdf','2025-11-12 06:15:21',0,NULL,0),(10,2056,'dsfsdfds','2025-11-12 06:15:47',0,NULL,0);
/*!40000 ALTER TABLE `anonymous_encouragements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `best_posts`
--

DROP TABLE IF EXISTS `best_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `best_posts` (
  `best_post_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `post_type` enum('my_day','someone_day') NOT NULL,
  `category` enum('weekly','monthly') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`best_post_id`),
  KEY `post_id` (`post_id`),
  CONSTRAINT `best_posts_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `someone_day_posts` (`post_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `best_posts`
--

LOCK TABLES `best_posts` WRITE;
/*!40000 ALTER TABLE `best_posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `best_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `card_templates`
--

DROP TABLE IF EXISTS `card_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `emoji` varchar(10) NOT NULL,
  `title` varchar(100) NOT NULL COMMENT '카드 제목',
  `default_message` varchar(200) NOT NULL COMMENT '기본 메시지',
  `background_color` varchar(20) DEFAULT '#FFFFFF',
  `text_color` varchar(20) DEFAULT '#000000',
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_active_order` (`is_active`,`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='익명 카드 전송용 템플릿';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `card_templates`
--

LOCK TABLES `card_templates` WRITE;
/*!40000 ALTER TABLE `card_templates` DISABLE KEYS */;
INSERT INTO `card_templates` VALUES (1,'🌸','봄날의 위로','당신은 충분히 잘하고 있어요','#FFE4E1','#8B4789',1,1),(2,'🌟','빛나는 응원','오늘도 빛나는 하루 보내세요','#FFF8DC','#FF8C00',1,2),(3,'☕','따뜻한 한잔','따뜻한 마음을 전해요','#F5DEB3','#8B4513',1,3),(4,'🌈','희망의 메시지','비가 그치면 무지개가 뜨잖아요','#E0F2F7','#0277BD',1,4),(5,'💫','별처럼 빛나요','당신은 누군가의 별이에요','#E8EAF6','#3F51B5',1,5),(6,'🌙','달빛 같은 위로','잠시 쉬어가도 괜찮아요','#E1F5FE','#01579B',1,6),(7,'🍀','행운의 메시지','행운이 함께하기를','#E8F5E9','#2E7D32',1,7),(8,'💝','마음을 담아','소중한 당신에게','#FCE4EC','#C2185B',1,8),(9,'🌺','꽃처럼 피어나요','당신의 노력이 꽃을 피울 거예요','#F3E5F5','#7B1FA2',1,9),(10,'✨','반짝이는 하루','매 순간이 특별해요','#FFF9C4','#F57F17',1,10);
/*!40000 ALTER TABLE `card_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenge_comment_likes`
--

DROP TABLE IF EXISTS `challenge_comment_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge_comment_likes` (
  `like_id` int(11) NOT NULL AUTO_INCREMENT,
  `comment_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`like_id`),
  UNIQUE KEY `unique_comment_user` (`comment_id`,`user_id`),
  UNIQUE KEY `challenge_comment_likes_comment_id_user_id` (`comment_id`,`user_id`),
  KEY `idx_comment_id` (`comment_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `challenge_comment_likes_comment_id` (`comment_id`),
  KEY `challenge_comment_likes_user_id` (`user_id`),
  CONSTRAINT `challenge_comment_likes_ibfk_149` FOREIGN KEY (`comment_id`) REFERENCES `challenge_comments` (`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `challenge_comment_likes_ibfk_150` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge_comment_likes`
--

LOCK TABLES `challenge_comment_likes` WRITE;
/*!40000 ALTER TABLE `challenge_comment_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `challenge_comment_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenge_comments`
--

DROP TABLE IF EXISTS `challenge_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge_comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `challenge_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` varchar(500) NOT NULL,
  `is_anonymous` tinyint(1) DEFAULT 0,
  `parent_comment_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `challenge_emotion_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `idx_challenge_id` (`challenge_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_comment_id` (`parent_comment_id`),
  KEY `challenge_comments_challenge_id` (`challenge_id`),
  KEY `challenge_comments_user_id` (`user_id`),
  KEY `fk_challenge_emotion` (`challenge_emotion_id`),
  CONSTRAINT `challenge_comments_ibfk_226` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`challenge_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `challenge_comments_ibfk_227` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `challenge_comments_ibfk_228` FOREIGN KEY (`parent_comment_id`) REFERENCES `challenge_comments` (`comment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_challenge_emotion` FOREIGN KEY (`challenge_emotion_id`) REFERENCES `challenge_emotions` (`challenge_emotion_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge_comments`
--

LOCK TABLES `challenge_comments` WRITE;
/*!40000 ALTER TABLE `challenge_comments` DISABLE KEYS */;
INSERT INTO `challenge_comments` VALUES (9,28,2037,'ㅇㅇㅇㅇㅇㅇㅇㅇㅇ',0,NULL,'2025-09-20 02:29:31','2025-09-20 02:29:31',NULL),(10,28,2037,'ㄹㄹㄹㄹㄹㄹ',0,NULL,'2025-09-20 02:30:20','2025-09-20 02:30:20',NULL),(11,28,2037,'대답을\nㄹㄹㄹㄹ',0,10,'2025-09-20 02:39:07','2025-09-20 02:39:07',NULL),(12,28,2037,'3단계',0,11,'2025-09-20 02:39:17','2025-09-20 02:39:17',NULL),(13,28,2037,'ㅇㅇㅇㅇㅇㅇㅇ',0,11,'2025-09-20 02:39:29','2025-09-20 02:39:29',NULL),(14,28,2037,'1234567',0,NULL,'2025-09-20 02:45:19','2025-09-20 02:45:19',NULL),(15,28,2037,'ㅎㅎㅎㅎㅎㅎ',0,NULL,'2025-09-20 02:45:31','2025-09-20 02:45:31',NULL),(16,28,2037,'ㅎㅎㅎㅎㅎㅎㅎㅎ',1,NULL,'2025-09-20 02:48:03','2025-09-20 02:48:03',NULL),(17,39,2037,'오늘은 롯데',0,NULL,'2025-10-17 02:41:09','2025-10-17 05:02:06',NULL),(18,41,2052,'첄린찌 참여 완료',0,NULL,'2025-10-19 14:00:21','2025-10-19 14:00:21',NULL),(19,41,2037,'gggggg',0,18,'2025-10-25 08:46:19','2025-10-25 08:46:19',NULL),(31,44,2037,'ㄹㄹㄹㄹㄹ',0,NULL,'2025-11-10 08:56:44','2025-11-10 08:56:44',NULL),(32,44,2037,'ㄹㄹㄹㄹㄹㄹ',1,NULL,'2025-11-10 08:56:52','2025-11-10 08:56:52',NULL),(33,44,2037,'ㄹㄹㄹㄹㄹㄹㄹㄹ',1,NULL,'2025-11-10 08:57:01','2025-11-10 08:57:01',NULL),(34,44,2037,'ㄹㅎㄹㅇㅎㄹㅎㄹ오',1,NULL,'2025-11-10 08:57:57','2025-11-10 08:57:57',NULL),(35,44,2037,'ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ',0,31,'2025-11-10 12:56:28','2025-11-10 12:56:28',NULL),(36,44,2037,'@울트라 키펜 ㄹㄹㄹㄹㄹ',0,31,'2025-11-10 12:56:33','2025-11-10 12:56:33',NULL),(37,44,2037,'@울트라 키펜 ㄹㄹㄹㄹㄹ',0,31,'2025-11-10 12:56:41','2025-11-10 12:56:41',NULL),(38,44,2037,'@울트라 키펜',0,31,'2025-11-10 12:56:49','2025-11-10 12:56:49',NULL),(39,44,2037,'ggggggg',1,NULL,'2025-11-13 04:50:32','2025-11-13 04:50:32',NULL),(40,44,2037,'hhgjhhjhhhhhhhhh',0,NULL,'2025-11-13 04:50:41','2025-11-13 04:50:41',NULL),(41,44,2055,'ㅗㅎ허ㅏ호ㅓㅏㅗ허ㅏ',0,NULL,'2025-11-14 16:31:04','2025-11-14 16:31:04',NULL),(42,44,2055,'ㅓㅓㅓㅓㅓ',0,NULL,'2025-11-15 07:48:49','2025-11-15 07:48:49',NULL),(44,45,2055,'ㅎㅎㅎㅎ',1,NULL,'2025-11-17 05:33:22','2025-11-17 05:33:22',NULL);
/*!40000 ALTER TABLE `challenge_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenge_emotions`
--

DROP TABLE IF EXISTS `challenge_emotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge_emotions` (
  `challenge_emotion_id` int(11) NOT NULL AUTO_INCREMENT,
  `challenge_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `emotion_id` tinyint(3) unsigned NOT NULL,
  `log_date` date NOT NULL,
  `note` varchar(200) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`challenge_emotion_id`),
  KEY `user_id` (`user_id`),
  KEY `emotion_id` (`emotion_id`),
  KEY `challenge_emotions_challenge_id_user_id_emotion_id` (`challenge_id`,`user_id`,`emotion_id`),
  CONSTRAINT `challenge_emotions_ibfk_1` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`challenge_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `challenge_emotions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `challenge_emotions_ibfk_3` FOREIGN KEY (`emotion_id`) REFERENCES `emotions` (`emotion_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge_emotions`
--

LOCK TABLES `challenge_emotions` WRITE;
/*!40000 ALTER TABLE `challenge_emotions` DISABLE KEYS */;
INSERT INTO `challenge_emotions` VALUES (1,41,2037,6,'2025-11-03','감정나눔 테스트입니다.안녕하세요','2025-11-03 08:07:57','2025-11-03 08:08:37'),(9,44,2037,6,'2025-11-10','11월 11일입니다','2025-11-10 13:19:50','2025-11-11 05:40:49'),(10,44,2055,15,'2025-11-15','ㅗㅗㅗㅗㅗㅓ','2025-11-15 06:46:20','2025-11-15 07:48:35'),(11,45,2055,6,'2025-11-17','힘내봐요','2025-11-17 05:33:07','2025-11-17 05:43:53');
/*!40000 ALTER TABLE `challenge_emotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenge_likes`
--

DROP TABLE IF EXISTS `challenge_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge_likes` (
  `like_id` int(11) NOT NULL AUTO_INCREMENT,
  `challenge_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`like_id`),
  UNIQUE KEY `challenge_likes_challenge_id_user_id` (`challenge_id`,`user_id`),
  KEY `challenge_likes_challenge_id` (`challenge_id`),
  KEY `challenge_likes_user_id` (`user_id`),
  CONSTRAINT `challenge_likes_ibfk_1` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`challenge_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `challenge_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge_likes`
--

LOCK TABLES `challenge_likes` WRITE;
/*!40000 ALTER TABLE `challenge_likes` DISABLE KEYS */;
INSERT INTO `challenge_likes` VALUES (10,42,2052,'2025-10-29 02:00:09','2025-10-29 02:00:09'),(12,42,2037,'2025-10-29 02:01:26','2025-10-29 02:01:26'),(14,41,2037,'2025-11-03 08:07:23','2025-11-03 08:07:23');
/*!40000 ALTER TABLE `challenge_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenge_participants`
--

DROP TABLE IF EXISTS `challenge_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge_participants` (
  `challenge_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `joined_at` datetime NOT NULL,
  PRIMARY KEY (`challenge_id`,`user_id`),
  UNIQUE KEY `challenge_participants_challenge_id_user_id_unique` (`challenge_id`,`user_id`),
  UNIQUE KEY `challenge_participants_challenge_id_user_id` (`challenge_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `challenge_participants_challenge_fk` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`challenge_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `challenge_participants_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge_participants`
--

LOCK TABLES `challenge_participants` WRITE;
/*!40000 ALTER TABLE `challenge_participants` DISABLE KEYS */;
INSERT INTO `challenge_participants` VALUES (26,2037,'2025-09-19 05:38:24','2025-09-19 05:38:24','2025-09-19 05:38:24'),(27,2037,'2025-09-19 08:26:58','2025-09-19 08:26:58','2025-09-19 08:26:58'),(28,2037,'2025-09-19 14:15:09','2025-09-19 14:15:09','2025-09-19 14:15:09'),(29,2037,'2025-09-26 06:53:00','2025-09-26 06:53:00','2025-09-26 06:53:00'),(30,2037,'2025-09-26 06:53:03','2025-09-26 06:53:03','2025-09-26 06:53:03'),(31,2037,'2025-09-26 06:53:05','2025-09-26 06:53:05','2025-09-26 06:53:05'),(32,2037,'2025-09-26 06:53:26','2025-09-26 06:53:26','2025-09-26 06:53:26'),(33,2037,'2025-09-26 06:53:37','2025-09-26 06:53:37','2025-09-26 06:53:37'),(34,2037,'2025-09-26 06:58:16','2025-09-26 06:58:16','2025-09-26 06:58:16'),(35,2037,'2025-09-26 13:44:15','2025-09-26 13:44:15','2025-09-26 13:44:15'),(36,2037,'2025-10-04 07:48:47','2025-10-04 07:48:47','2025-10-04 07:48:47'),(37,2037,'2025-10-04 14:02:37','2025-10-04 14:02:37','2025-10-04 14:02:37'),(38,2037,'2025-10-04 14:37:29','2025-10-04 14:37:29','2025-10-04 14:37:29'),(39,2037,'2025-10-17 02:40:43','2025-10-17 02:40:43','2025-10-17 02:40:43'),(40,2037,'2025-10-19 11:14:45','2025-10-19 11:14:45','2025-10-19 11:14:45'),(41,2037,'2025-10-19 11:16:59','2025-10-19 11:16:59','2025-10-19 11:16:59'),(41,2052,'2025-10-19 13:59:50','2025-10-19 13:59:50','2025-10-19 13:59:50'),(42,2037,'2025-10-25 13:06:38','2025-10-25 13:06:38','2025-10-25 13:06:38'),(43,2056,'2025-11-05 01:52:44','2025-11-05 01:52:44','2025-11-05 01:52:44'),(44,2037,'2025-11-10 05:15:05','2025-11-10 05:15:05','2025-11-10 05:15:05'),(45,2055,'2025-11-17 05:32:49','2025-11-17 05:32:49','2025-11-17 05:32:49');
/*!40000 ALTER TABLE `challenge_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenge_reports`
--

DROP TABLE IF EXISTS `challenge_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge_reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `challenge_id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `report_type` enum('spam','inappropriate','harassment','violence','misinformation','other') NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`report_id`),
  KEY `challenge_reports_challenge_id` (`challenge_id`),
  KEY `challenge_reports_reporter_id` (`reporter_id`),
  KEY `challenge_reports_status` (`status`),
  KEY `challenge_reports_created_at` (`created_at`),
  CONSTRAINT `challenge_reports_ibfk_1` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`challenge_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `challenge_reports_ibfk_2` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge_reports`
--

LOCK TABLES `challenge_reports` WRITE;
/*!40000 ALTER TABLE `challenge_reports` DISABLE KEYS */;
INSERT INTO `challenge_reports` VALUES (1,42,2056,'inappropriate','inappropriate','dismissed','2025-10-27 07:55:08','2025-11-11 08:54:16'),(2,41,2056,'harassment','harassment','resolved','2025-10-29 05:27:46','2025-11-04 08:41:41'),(3,40,2056,'harassment','harassment','dismissed','2025-10-29 05:49:22','2025-11-11 08:45:44');
/*!40000 ALTER TABLE `challenge_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenges`
--

DROP TABLE IF EXISTS `challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenges` (
  `challenge_id` int(11) NOT NULL AUTO_INCREMENT,
  `creator_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `max_participants` int(11) DEFAULT NULL,
  `participant_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `image_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`image_urls`)),
  PRIMARY KEY (`challenge_id`),
  KEY `creator_id` (`creator_id`),
  KEY `challenges_status` (`status`),
  KEY `challenges_start_date_end_date` (`start_date`,`end_date`),
  KEY `challenges_created_at` (`created_at`),
  KEY `challenges_creator_id` (`creator_id`),
  CONSTRAINT `challenges_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenges`
--

LOCK TABLES `challenges` WRITE;
/*!40000 ALTER TABLE `challenges` DISABLE KEYS */;
INSERT INTO `challenges` VALUES (26,2037,'오늘 챌린지 테스트입니다.','안녕하세요 챌린지 테스트에요','2025-09-19','2025-09-23',1,10,1,'2025-09-19 05:38:24','2025-09-19 05:52:02','active','[\"행복\"]',NULL),(27,2037,'일주일간 챌린지시작합니다.','안녕하세요 반가워요','2025-09-19','2025-09-26',1,12,1,'2025-09-19 08:26:58','2025-09-19 08:26:58','active','[\"사랑\"]',NULL),(28,2037,'카오스 제로 나이트메어, 사전 플레이 테스트 중','카오스 제로 나이트메어, 사전 플레이 테스트 중','2025-09-19','2025-09-26',1,14,1,'2025-09-19 14:15:09','2025-09-19 14:15:09','active','[\"친구\"]',NULL),(29,2037,'9월 26알 챠챌린지글 테스트입니다.','챌린지 테스트 글 학생입니다.','2025-09-26','2025-10-03',1,10,1,'2025-09-26 06:53:00','2025-09-26 06:53:00','active','[\"연애\"]',NULL),(30,2037,'9월 26알 챠챌린지글 테스트입니다.','챌린지 테스트 글 학생입니다.','2025-09-26','2025-10-03',1,10,1,'2025-09-26 06:53:03','2025-09-26 06:53:03','active','[\"연애\"]',NULL),(31,2037,'9월 26알 챠챌린지글 테스트입니다.','챌린지 테스트 글 학생입니다.','2025-09-26','2025-10-03',1,10,1,'2025-09-26 06:53:05','2025-09-26 06:53:05','active','[\"연애\"]',NULL),(32,2037,'9월 26알 챠챌린지글 테스트입니다.','챌린지 테스트 글 학생입니다 안녕하세요 반갑습니다.','2025-09-26','2025-10-03',1,10,1,'2025-09-26 06:53:26','2025-09-26 06:53:26','active','[\"연애\"]',NULL),(33,2037,'9월 26알 챠챌린지글 테스트입니다.','챌린지 테스트 글 학생입니다 안녕하세요 반갑습니다.','2025-09-26','2025-10-03',1,10,1,'2025-09-26 06:53:37','2025-09-26 06:53:37','active','[\"연애\"]',NULL),(34,2037,'9월 26알 챠챌린지글 테스트입니다.','챌린지 테스트 글 학생입니다 안녕하세요 반갑습니다.','2025-09-26','2025-10-03',1,10,1,'2025-09-26 06:58:16','2025-09-26 06:58:16','active','[\"연애\"]',NULL),(35,2037,'유명한 사진을 찍은 사진가들','도로롱이 좋은 이유\n김실장 붉은 사막 영상 덧글부터 꿀잼이네 ㅋㅋㅋㅋ\n스텔라) 진짜 횬타이가 진짜 문제인가 싶었던 레알 짜치던 연출','2025-09-26','2025-10-03',1,10,1,'2025-09-26 13:44:15','2025-09-26 13:44:15','active','[\"연애\"]',NULL),(36,2037,'이번주 핫 챌린저 도전','이번주는 챌린저 테스트입니다.','2025-10-04','2025-10-11',1,10,1,'2025-10-04 07:48:47','2025-10-05 14:39:11','active','[]','[\"http://192.168.219.51:3001/api/uploads/images/image_2037_1759674218224_0.jpg\",\"http://192.168.219.51:3001/api/uploads/images/image_2037_1759674221791_0.jpg\"]'),(37,2037,'10월4일 챌린지 테스트입니다.','오늘은 토요일ㅇ린비나 안녕하세요 반가워요 챌린지입니다.','2025-10-04','2025-10-11',1,10,1,'2025-10-04 14:02:37','2025-10-05 14:22:57','active','[\"여친\"]','[\"/api/uploads/images/image_2037_1759674177154_0.jpg\",\"/api/uploads/images/image_2037_1759674177232_0.jpg\"]'),(38,2037,'챌린지 테스트','안녕하세요 반갑습니다 챌린지 테스트입니다.','2025-10-04','2025-10-10',1,10,1,'2025-10-04 14:37:29','2025-10-08 15:14:04','active','[\"남친\"]','[\"http://192.168.219.51:3001/api/uploads/images/image_2037_1759588648107_0.jpg\",\"http://192.168.219.51:3001/api/uploads/images/image_2037_1759588648229_0.jpg\"]'),(39,2037,'일주일 감정챌린지 도전~','감정챌린지 테스트입니다. 안녕하세요 반가워요\n오늘은 10월 17일입니다.','2025-10-17','2025-10-24',1,10,1,'2025-10-17 02:40:43','2025-10-17 02:40:43','active','[\"친구\"]','[\"/api/uploads/images/image_2037_1760668837054_0.jpg\",\"/api/uploads/images/image_2037_1760668842994_0.jpg\"]'),(40,2037,'10월19일 일요일 챌린저 테스트입니다.','안녕하세요 반갑습니다 ㅎㅎㅎ 오늘은 일요일입니다.','2025-10-19','2025-10-26',1,7,1,'2025-10-19 11:14:45','2025-10-19 11:14:45','active','[]','[\"/api/uploads/images/image_2037_1760872484252_0.jpg\",\"/api/uploads/images/image_2037_1760872484324_0.jpg\",\"/api/uploads/images/image_2037_1760872485378_0.jpg\"]'),(41,2037,'두번째 테스트입니다.','두번째 테스트하는거야 안녕하세요 반갑습니닿ㅎㅎ','2025-10-31','2025-11-07',1,7,2,'2025-10-31 11:16:59','2025-11-07 04:22:34','active','[\"학교\",\"친구\",\"공부\"]','[\"/api/uploads/images/image_2037_1760872618025_0.jpg\",\"/api/uploads/images/image_2037_1760872619084_0.jpg\"]'),(42,2037,'10월 25일 아니1','챌린저 테스트 집니다 안녕하세요','2025-10-25','2025-11-01',1,7,1,'2025-10-25 13:06:38','2025-10-30 04:38:50','active','[]','[\"http://192.168.219.51:3001/api/uploads/images/image_2037_1761397598596_0.jpg\",\"/api/uploads/images/image_2037_1761798036453_0.jpg\",\"/api/uploads/images/image_2037_1761798069986_0.jpg\"]'),(43,2056,'\"사춘기 주먹다짐, 가혹\" vs \"진정한 교육\"…학폭 걸러낸 대학 \'시끌\'','서울대를 포함한 거점 국립대학교 6곳이 학교폭력 가해 기록이 있는 지원자 45명에 대해 불학격 통보한 사실이 알려지자 온라인에서는 \"진정한 교육은 이런 것\"이라는 호평이 나온 반면 일각에선 \"과연 옳은 일이냐\"는 얘기도 나와 논란이 일었다.','2025-11-05','2025-11-12',1,7,1,'2025-11-05 01:52:44','2025-11-05 01:52:44','active','[\"학교\"]','[\"/api/uploads/images/image_2056_1762307561661_0.jpg\",\"/api/uploads/images/image_2056_1762307562779_0.jpg\",\"/api/uploads/images/image_2056_1762307564115_0.jpg\"]'),(44,2037,'오늘도 화이팅하는 도전~','안녕하세요  반갑습니','2025-11-10','2025-11-17',1,10,1,'2025-11-10 05:15:05','2025-11-15 13:53:44','active','[]','[\"/api/uploads/images/image_2037_1762751701986_0.jpg\",\"/api/uploads/images/image_2037_1762751703326_0.jpg\",\"/api/uploads/images/image_2037_1762751705843_0.jpg\"]'),(45,2055,'한강버스, \'저수심·바닥 닿음\' 15회 더 있었다…\"겨울철 수심 감소 탓\"','이날 사고 경위를 설명하는 브리핑에선 한강버스 선장들로부터 최근 \'저수심 구간 또는 선체 바닥에 이물질이 닿았다\'는 보고를 15차례 받았다는 사실이 처음 공개됐다. 선장들은 동호대교 인근을 포함해 한남대교를 기준으로 상류 지역에서 \'수심이 얕다\' \'무언가 \'쿵\'하고 닿은 것 같다\' 등의 보고를 했다고 한다. 하류인 서강대교 인근에서도 3건 발생했다. 지난 7일이후에만 13건의 관련 보고가 잇따랐다.','2025-11-17','2025-11-24',1,10,1,'2025-11-17 05:32:49','2025-11-17 05:32:49','active','[\"운동\",\"행복\"]','[\"/api/uploads/images/image_2055_1763357568933_0_full.webp\",\"/api/uploads/images/image_2055_1763357569403_0_full.webp\"]');
/*!40000 ALTER TABLE `challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comfort_activities`
--

DROP TABLE IF EXISTS `comfort_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comfort_activities` (
  `activity_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `activity_type` enum('comment','like_received','helpful_marked','streak_bonus') NOT NULL,
  `target_post_id` int(11) DEFAULT NULL,
  `target_comment_id` int(11) DEFAULT NULL,
  `impact_points` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`activity_id`),
  KEY `idx_user_activity` (`user_id`,`created_at`),
  KEY `idx_activity_type` (`activity_type`),
  CONSTRAINT `comfort_activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comfort_activities`
--

LOCK TABLES `comfort_activities` WRITE;
/*!40000 ALTER TABLE `comfort_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `comfort_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comfort_hall_of_fame`
--

DROP TABLE IF EXISTS `comfort_hall_of_fame`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comfort_hall_of_fame` (
  `rank_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `period` enum('daily','weekly','monthly','all_time') NOT NULL,
  `rank_position` int(11) NOT NULL,
  `impact_score` int(11) NOT NULL,
  `comfort_count` int(11) NOT NULL,
  `period_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`rank_id`),
  UNIQUE KEY `unique_user_period` (`user_id`,`period`,`period_date`),
  KEY `idx_period_rank` (`period`,`period_date`,`rank_position`),
  CONSTRAINT `comfort_hall_of_fame_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comfort_hall_of_fame`
--

LOCK TABLES `comfort_hall_of_fame` WRITE;
/*!40000 ALTER TABLE `comfort_hall_of_fame` DISABLE KEYS */;
/*!40000 ALTER TABLE `comfort_hall_of_fame` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comfort_levels`
--

DROP TABLE IF EXISTS `comfort_levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comfort_levels` (
  `level` int(11) NOT NULL,
  `level_name` varchar(50) NOT NULL,
  `required_exp` int(11) NOT NULL,
  `icon_emoji` varchar(10) DEFAULT NULL,
  `benefits` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comfort_levels`
--

LOCK TABLES `comfort_levels` WRITE;
/*!40000 ALTER TABLE `comfort_levels` DISABLE KEYS */;
INSERT INTO `comfort_levels` VALUES (1,'?꾨줈 ?덉떦',0,'?뙮','?꾨줈?? 泥? 嫄몄쓬','2025-11-18 14:22:12'),(2,'?꾨줈 移쒓뎄',100,'?뙼','?곕쑜?? 留? ?쒕쭏??','2025-11-18 14:22:12'),(3,'?꾨줈 ?숇컲??',300,'?뙸','?④퍡?섎뒗 ?꾨줈','2025-11-18 14:22:12'),(4,'?꾨줈 ?꾨Ц媛?',600,'?뙚','?꾨Ц?곸씤 怨듦컧','2025-11-18 14:22:12'),(5,'?꾨줈 留덉뒪??',1000,'?뭿','留덉뒪?곗쓽 ?꾨줈','2025-11-18 14:22:12'),(6,'?꾨줈 ?덉뼱濡?',1500,'?┯','?곸썒?? 怨듦컧','2025-11-18 14:22:12'),(7,'?꾨줈 泥쒖궗',2200,'?삀','泥쒖궗?? ?먭만','2025-11-18 14:22:12'),(8,'?꾨줈 ?꾩꽕',3000,'?몣','?꾩꽕?? ?꾨줈??','2025-11-18 14:22:12'),(9,'?꾨줈 ?좏솕',4000,'??','?좏솕?? 議댁옱','2025-11-18 14:22:12'),(10,'?꾨줈 珥덉썡??',5500,'?뙂','珥덉썡?? 怨듦컧??','2025-11-18 14:22:12');
/*!40000 ALTER TABLE `comfort_levels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comfort_stats`
--

DROP TABLE IF EXISTS `comfort_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comfort_stats` (
  `user_id` int(11) NOT NULL,
  `comfort_given_count` int(11) DEFAULT 0,
  `comfort_received_count` int(11) DEFAULT 0,
  `impact_score` int(11) DEFAULT 0,
  `comfort_level` int(11) DEFAULT 1,
  `level_exp` int(11) DEFAULT 0,
  `total_reactions` int(11) DEFAULT 0,
  `streak_days` int(11) DEFAULT 0,
  `last_comfort_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  KEY `idx_impact_score` (`impact_score`),
  KEY `idx_comfort_level` (`comfort_level`),
  CONSTRAINT `comfort_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comfort_stats`
--

LOCK TABLES `comfort_stats` WRITE;
/*!40000 ALTER TABLE `comfort_stats` DISABLE KEYS */;
/*!40000 ALTER TABLE `comfort_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `content_blocks`
--

DROP TABLE IF EXISTS `content_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `content_blocks` (
  `block_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `content_type` varchar(20) NOT NULL CHECK (`content_type` in ('post','comment')),
  `content_id` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`block_id`),
  UNIQUE KEY `unique_content_block` (`user_id`,`content_type`,`content_id`),
  KEY `idx_content_blocks_user` (`user_id`),
  KEY `idx_content_blocks_content` (`content_type`,`content_id`),
  CONSTRAINT `content_blocks_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=119 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_blocks`
--

LOCK TABLES `content_blocks` WRITE;
/*!40000 ALTER TABLE `content_blocks` DISABLE KEYS */;
INSERT INTO `content_blocks` VALUES (116,2056,'post',309,NULL,'2025-10-29 05:50:17'),(117,2055,'post',313,NULL,'2025-11-14 14:57:38'),(118,2055,'post',312,'abuse','2025-11-17 12:02:30');
/*!40000 ALTER TABLE `content_blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emotion_logs`
--

DROP TABLE IF EXISTS `emotion_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emotion_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `emotion_id` tinyint(3) unsigned NOT NULL,
  `note` varchar(200) DEFAULT NULL,
  `log_date` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`log_id`),
  KEY `user_id` (`user_id`),
  KEY `emotion_id` (`emotion_id`),
  KEY `emotion_logs_user_id` (`user_id`),
  KEY `emotion_logs_emotion_id` (`emotion_id`),
  KEY `emotion_logs_log_date` (`log_date`),
  CONSTRAINT `emotion_logs_ibfk_165` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `emotion_logs_ibfk_166` FOREIGN KEY (`emotion_id`) REFERENCES `emotions` (`emotion_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1021 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emotion_logs`
--

LOCK TABLES `emotion_logs` WRITE;
/*!40000 ALTER TABLE `emotion_logs` DISABLE KEYS */;
INSERT INTO `emotion_logs` VALUES (206,2037,2,'나의 하루: 안녕하세요 사진추가가 ㅏㅈㄹ되는지요 안녕하세요...','2025-09-06 13:54:39','2025-09-06 13:54:39','2025-09-06 13:54:39'),(207,2037,6,'나의 하루: ㅇㄴㅇㅎㅇㄴㅇㄴㅇㅎㅎㅇㄴㅎㄴㅇㅎㄴㅇㅎㄴㅇ...','2025-09-06 15:15:23','2025-09-06 15:15:23','2025-09-06 15:15:23'),(208,2037,2,'나의 하루: 9월8일 테스트입니다.안녕하세요...','2025-09-08 00:47:07','2025-09-08 00:47:07','2025-09-08 00:47:07'),(209,2037,2,'나의 하루: 9월8일 테스트입니다 안녕하세요...','2025-09-08 01:29:58','2025-09-08 01:29:58','2025-09-08 01:29:58'),(210,2037,11,'나의 하루: 오늘은 9월 9일입니다 안녕하세요 ...','2025-09-09 00:49:11','2025-09-09 00:49:11','2025-09-09 00:49:11'),(211,2037,2,'나의 하루: 9월 9일입니다 안녕하세요 반갑습니다....','2025-09-09 00:53:15','2025-09-09 00:53:15','2025-09-09 00:53:15'),(213,2037,3,'나의 하루: 9월24일 나의 하루 공유하기 테스트입니다....','2025-09-24 05:15:22','2025-09-24 05:15:22','2025-09-24 05:15:22'),(214,2037,3,'나의 하루: 돌아서는 너를 보며 \n난 아무 말도 할 수 없었고\n슬퍼하기엔 짧았던\n나의 해는 저물어 갔네...','2025-09-25 04:08:16','2025-09-25 04:08:16','2025-09-25 04:08:16'),(215,2037,2,'나의 하루: 9월25일 나의 하루 공유하기 테스트입니다....','2025-09-25 12:31:33','2025-09-25 12:31:33','2025-09-25 12:31:33'),(216,2037,3,'나의 하루: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-26 01:15:02','2025-09-26 01:15:02','2025-09-26 01:15:02'),(217,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 05:16:40','2025-09-30 05:16:40','2025-09-30 05:16:40'),(218,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 05:16:40','2025-09-30 05:16:40','2025-09-30 05:16:40'),(219,2037,3,'글 동기화: 9월24일 나의 하루 공유하기 테스트입니다....','2025-09-30 05:16:40','2025-09-30 05:16:40','2025-09-30 05:16:40'),(220,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 05:17:29','2025-09-30 05:17:29','2025-09-30 05:17:29'),(221,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 05:17:29','2025-09-30 05:17:29','2025-09-30 05:17:29'),(222,2037,3,'글 동기화: 9월24일 나의 하루 공유하기 테스트입니다....','2025-09-30 05:17:29','2025-09-30 05:17:29','2025-09-30 05:17:29'),(223,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 05:19:59','2025-09-30 05:19:59','2025-09-30 05:19:59'),(224,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 05:19:59','2025-09-30 05:19:59','2025-09-30 05:19:59'),(225,2037,3,'글 동기화: 9월24일 나의 하루 공유하기 테스트입니다....','2025-09-30 05:19:59','2025-09-30 05:19:59','2025-09-30 05:19:59'),(226,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 05:20:25','2025-09-30 05:20:25','2025-09-30 05:20:25'),(227,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 05:20:25','2025-09-30 05:20:25','2025-09-30 05:20:25'),(228,2037,3,'글 동기화: 9월24일 나의 하루 공유하기 테스트입니다....','2025-09-30 05:20:25','2025-09-30 05:20:25','2025-09-30 05:20:25'),(229,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 05:20:27','2025-09-30 05:20:27','2025-09-30 05:20:27'),(230,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 05:20:27','2025-09-30 05:20:27','2025-09-30 05:20:27'),(231,2037,3,'글 동기화: 9월24일 나의 하루 공유하기 테스트입니다....','2025-09-30 05:20:27','2025-09-30 05:20:27','2025-09-30 05:20:27'),(232,2037,3,'나의 하루: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 반갑습니다\n오늘은 무슨요일인가죠?...','2025-09-30 05:36:42','2025-09-30 05:36:42','2025-09-30 05:36:42'),(233,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 08:16:16','2025-09-30 08:16:16','2025-09-30 08:16:16'),(234,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 08:16:16','2025-09-30 08:16:16','2025-09-30 08:16:16'),(235,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 08:16:16','2025-09-30 08:16:16','2025-09-30 08:16:16'),(236,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 08:18:19','2025-09-30 08:18:19','2025-09-30 08:18:19'),(237,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 08:18:19','2025-09-30 08:18:19','2025-09-30 08:18:19'),(238,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 08:18:19','2025-09-30 08:18:19','2025-09-30 08:18:19'),(239,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 08:35:29','2025-09-30 08:35:29','2025-09-30 08:35:29'),(240,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 08:35:29','2025-09-30 08:35:29','2025-09-30 08:35:29'),(241,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 08:35:29','2025-09-30 08:35:29','2025-09-30 08:35:29'),(242,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 08:43:24','2025-09-30 08:43:24','2025-09-30 08:43:24'),(243,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 08:43:24','2025-09-30 08:43:24','2025-09-30 08:43:24'),(244,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 08:43:24','2025-09-30 08:43:24','2025-09-30 08:43:24'),(245,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 08:47:45','2025-09-30 08:47:45','2025-09-30 08:47:45'),(246,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 08:47:45','2025-09-30 08:47:45','2025-09-30 08:47:45'),(247,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 08:47:45','2025-09-30 08:47:45','2025-09-30 08:47:45'),(248,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 08:48:00','2025-09-30 08:48:00','2025-09-30 08:48:00'),(249,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 08:48:00','2025-09-30 08:48:00','2025-09-30 08:48:00'),(250,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 08:48:00','2025-09-30 08:48:00','2025-09-30 08:48:00'),(251,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 09:02:49','2025-09-30 09:02:49','2025-09-30 09:02:49'),(252,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 09:02:49','2025-09-30 09:02:49','2025-09-30 09:02:49'),(253,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 09:02:49','2025-09-30 09:02:49','2025-09-30 09:02:49'),(254,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 09:03:09','2025-09-30 09:03:09','2025-09-30 09:03:09'),(255,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 09:03:09','2025-09-30 09:03:09','2025-09-30 09:03:09'),(256,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 09:03:09','2025-09-30 09:03:09','2025-09-30 09:03:09'),(257,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 09:03:22','2025-09-30 09:03:22','2025-09-30 09:03:22'),(258,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 09:03:22','2025-09-30 09:03:22','2025-09-30 09:03:22'),(259,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 09:03:22','2025-09-30 09:03:22','2025-09-30 09:03:22'),(260,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 09:03:28','2025-09-30 09:03:28','2025-09-30 09:03:28'),(261,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 09:03:28','2025-09-30 09:03:28','2025-09-30 09:03:28'),(262,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 09:03:28','2025-09-30 09:03:28','2025-09-30 09:03:28'),(263,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 09:03:40','2025-09-30 09:03:40','2025-09-30 09:03:40'),(264,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 09:03:40','2025-09-30 09:03:40','2025-09-30 09:03:40'),(265,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 09:03:40','2025-09-30 09:03:40','2025-09-30 09:03:40'),(266,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 14:35:48','2025-09-30 14:35:48','2025-09-30 14:35:48'),(267,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 14:35:48','2025-09-30 14:35:48','2025-09-30 14:35:48'),(268,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 14:35:48','2025-09-30 14:35:48','2025-09-30 14:35:48'),(269,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 14:41:35','2025-09-30 14:41:35','2025-09-30 14:41:35'),(270,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 14:41:35','2025-09-30 14:41:35','2025-09-30 14:41:35'),(271,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 14:41:35','2025-09-30 14:41:35','2025-09-30 14:41:35'),(272,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 14:53:20','2025-09-30 14:53:20','2025-09-30 14:53:20'),(273,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 14:53:20','2025-09-30 14:53:20','2025-09-30 14:53:20'),(274,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 14:53:20','2025-09-30 14:53:20','2025-09-30 14:53:20'),(275,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 14:53:28','2025-09-30 14:53:28','2025-09-30 14:53:28'),(276,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 14:53:28','2025-09-30 14:53:28','2025-09-30 14:53:28'),(277,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 14:53:28','2025-09-30 14:53:28','2025-09-30 14:53:28'),(278,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 14:53:35','2025-09-30 14:53:35','2025-09-30 14:53:35'),(279,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 14:53:35','2025-09-30 14:53:35','2025-09-30 14:53:35'),(280,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 14:53:35','2025-09-30 14:53:35','2025-09-30 14:53:35'),(281,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 14:53:44','2025-09-30 14:53:44','2025-09-30 14:53:44'),(282,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 14:53:44','2025-09-30 14:53:44','2025-09-30 14:53:44'),(283,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 14:53:44','2025-09-30 14:53:44','2025-09-30 14:53:44'),(284,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 14:53:53','2025-09-30 14:53:53','2025-09-30 14:53:53'),(285,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 14:53:53','2025-09-30 14:53:53','2025-09-30 14:53:53'),(286,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 14:53:53','2025-09-30 14:53:53','2025-09-30 14:53:53'),(287,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 14:54:00','2025-09-30 14:54:00','2025-09-30 14:54:00'),(288,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 14:54:00','2025-09-30 14:54:00','2025-09-30 14:54:00'),(289,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 14:54:00','2025-09-30 14:54:00','2025-09-30 14:54:00'),(290,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 14:54:07','2025-09-30 14:54:07','2025-09-30 14:54:07'),(291,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 14:54:07','2025-09-30 14:54:07','2025-09-30 14:54:07'),(292,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 14:54:07','2025-09-30 14:54:07','2025-09-30 14:54:07'),(293,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 14:54:15','2025-09-30 14:54:15','2025-09-30 14:54:15'),(294,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 14:54:15','2025-09-30 14:54:15','2025-09-30 14:54:15'),(295,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 14:54:15','2025-09-30 14:54:15','2025-09-30 14:54:15'),(296,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-09-30 14:54:23','2025-09-30 14:54:23','2025-09-30 14:54:23'),(297,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-09-30 14:54:23','2025-09-30 14:54:23','2025-09-30 14:54:23'),(298,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-09-30 14:54:23','2025-09-30 14:54:23','2025-09-30 14:54:23'),(299,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 02:09:34','2025-10-01 02:09:34','2025-10-01 02:09:34'),(300,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 02:09:34','2025-10-01 02:09:34','2025-10-01 02:09:34'),(301,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 02:09:34','2025-10-01 02:09:34','2025-10-01 02:09:34'),(302,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 02:09:48','2025-10-01 02:09:48','2025-10-01 02:09:48'),(303,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 02:09:48','2025-10-01 02:09:48','2025-10-01 02:09:48'),(304,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 02:09:48','2025-10-01 02:09:48','2025-10-01 02:09:48'),(305,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 02:25:40','2025-10-01 02:25:40','2025-10-01 02:25:40'),(306,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 02:25:41','2025-10-01 02:25:41','2025-10-01 02:25:41'),(307,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 02:25:41','2025-10-01 02:25:41','2025-10-01 02:25:41'),(308,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 02:26:04','2025-10-01 02:26:04','2025-10-01 02:26:04'),(309,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 02:26:04','2025-10-01 02:26:04','2025-10-01 02:26:04'),(310,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 02:26:04','2025-10-01 02:26:04','2025-10-01 02:26:04'),(311,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 02:48:06','2025-10-01 02:48:06','2025-10-01 02:48:06'),(312,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 02:48:06','2025-10-01 02:48:06','2025-10-01 02:48:06'),(313,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 02:48:06','2025-10-01 02:48:06','2025-10-01 02:48:06'),(314,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 02:53:22','2025-10-01 02:53:22','2025-10-01 02:53:22'),(315,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 02:53:22','2025-10-01 02:53:22','2025-10-01 02:53:22'),(316,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 02:53:22','2025-10-01 02:53:22','2025-10-01 02:53:22'),(317,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 04:22:33','2025-10-01 04:22:33','2025-10-01 04:22:33'),(318,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 04:22:33','2025-10-01 04:22:33','2025-10-01 04:22:33'),(319,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 04:22:33','2025-10-01 04:22:33','2025-10-01 04:22:33'),(320,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 04:24:08','2025-10-01 04:24:08','2025-10-01 04:24:08'),(321,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 04:24:09','2025-10-01 04:24:09','2025-10-01 04:24:09'),(322,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 04:24:09','2025-10-01 04:24:09','2025-10-01 04:24:09'),(323,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 04:30:47','2025-10-01 04:30:47','2025-10-01 04:30:47'),(324,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 04:30:47','2025-10-01 04:30:47','2025-10-01 04:30:47'),(325,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 04:30:47','2025-10-01 04:30:47','2025-10-01 04:30:47'),(326,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 04:35:26','2025-10-01 04:35:26','2025-10-01 04:35:26'),(327,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 04:35:27','2025-10-01 04:35:27','2025-10-01 04:35:27'),(328,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 04:35:27','2025-10-01 04:35:27','2025-10-01 04:35:27'),(329,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 04:50:48','2025-10-01 04:50:48','2025-10-01 04:50:48'),(330,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 04:50:48','2025-10-01 04:50:48','2025-10-01 04:50:48'),(331,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 04:50:48','2025-10-01 04:50:48','2025-10-01 04:50:48'),(332,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 04:50:57','2025-10-01 04:50:57','2025-10-01 04:50:57'),(333,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 04:50:57','2025-10-01 04:50:57','2025-10-01 04:50:57'),(334,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 04:50:57','2025-10-01 04:50:57','2025-10-01 04:50:57'),(335,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 04:51:06','2025-10-01 04:51:06','2025-10-01 04:51:06'),(336,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 04:51:06','2025-10-01 04:51:06','2025-10-01 04:51:06'),(337,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 04:51:06','2025-10-01 04:51:06','2025-10-01 04:51:06'),(338,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 06:40:55','2025-10-01 06:40:55','2025-10-01 06:40:55'),(339,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 06:40:55','2025-10-01 06:40:55','2025-10-01 06:40:55'),(340,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 06:40:55','2025-10-01 06:40:55','2025-10-01 06:40:55'),(341,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 06:41:29','2025-10-01 06:41:29','2025-10-01 06:41:29'),(342,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 06:41:29','2025-10-01 06:41:29','2025-10-01 06:41:29'),(343,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 06:41:29','2025-10-01 06:41:29','2025-10-01 06:41:29'),(344,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 06:42:17','2025-10-01 06:42:17','2025-10-01 06:42:17'),(345,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 06:42:17','2025-10-01 06:42:17','2025-10-01 06:42:17'),(346,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 06:42:17','2025-10-01 06:42:17','2025-10-01 06:42:17'),(347,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 06:43:25','2025-10-01 06:43:25','2025-10-01 06:43:25'),(348,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 06:43:25','2025-10-01 06:43:25','2025-10-01 06:43:25'),(349,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 06:43:25','2025-10-01 06:43:25','2025-10-01 06:43:25'),(350,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 06:59:48','2025-10-01 06:59:48','2025-10-01 06:59:48'),(351,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 06:59:48','2025-10-01 06:59:48','2025-10-01 06:59:48'),(352,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 06:59:48','2025-10-01 06:59:48','2025-10-01 06:59:48'),(353,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 07:00:21','2025-10-01 07:00:21','2025-10-01 07:00:21'),(354,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 07:00:21','2025-10-01 07:00:21','2025-10-01 07:00:21'),(355,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 07:00:21','2025-10-01 07:00:21','2025-10-01 07:00:21'),(356,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 07:00:29','2025-10-01 07:00:29','2025-10-01 07:00:29'),(357,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 07:00:29','2025-10-01 07:00:29','2025-10-01 07:00:29'),(358,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 07:00:29','2025-10-01 07:00:29','2025-10-01 07:00:29'),(359,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 07:14:17','2025-10-01 07:14:17','2025-10-01 07:14:17'),(360,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 07:14:17','2025-10-01 07:14:17','2025-10-01 07:14:17'),(361,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 07:14:17','2025-10-01 07:14:17','2025-10-01 07:14:17'),(362,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 07:18:13','2025-10-01 07:18:13','2025-10-01 07:18:13'),(363,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 07:18:13','2025-10-01 07:18:13','2025-10-01 07:18:13'),(364,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 07:18:13','2025-10-01 07:18:13','2025-10-01 07:18:13'),(365,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 08:02:41','2025-10-01 08:02:41','2025-10-01 08:02:41'),(366,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 08:02:41','2025-10-01 08:02:41','2025-10-01 08:02:41'),(367,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 08:02:41','2025-10-01 08:02:41','2025-10-01 08:02:41'),(368,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 08:08:41','2025-10-01 08:08:41','2025-10-01 08:08:41'),(369,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 08:08:41','2025-10-01 08:08:41','2025-10-01 08:08:41'),(370,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 08:08:41','2025-10-01 08:08:41','2025-10-01 08:08:41'),(371,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 08:18:53','2025-10-01 08:18:53','2025-10-01 08:18:53'),(372,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 08:18:53','2025-10-01 08:18:53','2025-10-01 08:18:53'),(373,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 08:18:53','2025-10-01 08:18:53','2025-10-01 08:18:53'),(374,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 11:57:16','2025-10-01 11:57:16','2025-10-01 11:57:16'),(375,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 11:57:17','2025-10-01 11:57:17','2025-10-01 11:57:17'),(376,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 11:57:17','2025-10-01 11:57:17','2025-10-01 11:57:17'),(377,2037,2,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 11:57:44','2025-10-01 11:57:44','2025-10-01 11:57:44'),(378,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 11:57:44','2025-10-01 11:57:44','2025-10-01 11:57:44'),(379,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 11:57:44','2025-10-01 11:57:44','2025-10-01 11:57:44'),(380,2037,7,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 13:55:04','2025-10-01 13:55:04','2025-10-01 13:55:04'),(381,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 13:55:04','2025-10-01 13:55:04','2025-10-01 13:55:04'),(382,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 13:55:04','2025-10-01 13:55:04','2025-10-01 13:55:04'),(383,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 13:55:20','2025-10-01 13:55:20','2025-10-01 13:55:20'),(384,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 13:55:20','2025-10-01 13:55:20','2025-10-01 13:55:20'),(385,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 13:55:20','2025-10-01 13:55:20','2025-10-01 13:55:20'),(386,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 14:12:40','2025-10-01 14:12:40','2025-10-01 14:12:40'),(387,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 14:12:40','2025-10-01 14:12:40','2025-10-01 14:12:40'),(388,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 14:12:40','2025-10-01 14:12:40','2025-10-01 14:12:40'),(389,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-01 14:14:56','2025-10-01 14:14:56','2025-10-01 14:14:56'),(390,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-01 14:14:56','2025-10-01 14:14:56','2025-10-01 14:14:56'),(391,2037,2,'글 동기화: 9월25일 나의 하루 공유하기 테스트입니....','2025-10-01 14:14:56','2025-10-01 14:14:56','2025-10-01 14:14:56'),(392,2037,2,'나의 하루: 새 게시글 작성\n    - \"나의 하루\" 또는 \"위로와 공감\"에서 새 글을 작성하세요\n  ...','2025-10-02 01:41:43','2025-10-02 01:41:43','2025-10-02 01:41:43'),(393,2037,5,'나의 하루: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다:\n  서버가 3001번 포트에서 실...','2025-10-02 01:56:47','2025-10-02 01:56:47','2025-10-02 01:56:47'),(394,2037,5,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 04:42:17','2025-10-02 04:42:17','2025-10-02 04:42:17'),(395,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 04:42:17','2025-10-02 04:42:17','2025-10-02 04:42:17'),(396,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 04:42:17','2025-10-02 04:42:17','2025-10-02 04:42:17'),(397,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 05:43:33','2025-10-02 05:43:33','2025-10-02 05:43:33'),(398,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 05:43:33','2025-10-02 05:43:33','2025-10-02 05:43:33'),(399,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 05:43:33','2025-10-02 05:43:33','2025-10-02 05:43:33'),(400,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 05:54:00','2025-10-02 05:54:00','2025-10-02 05:54:00'),(401,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 05:54:00','2025-10-02 05:54:00','2025-10-02 05:54:00'),(402,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 05:54:00','2025-10-02 05:54:00','2025-10-02 05:54:00'),(403,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 06:32:52','2025-10-02 06:32:52','2025-10-02 06:32:52'),(404,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 06:32:52','2025-10-02 06:32:52','2025-10-02 06:32:52'),(405,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 06:32:52','2025-10-02 06:32:52','2025-10-02 06:32:52'),(406,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 06:47:04','2025-10-02 06:47:04','2025-10-02 06:47:04'),(407,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 06:47:04','2025-10-02 06:47:04','2025-10-02 06:47:04'),(408,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 06:47:04','2025-10-02 06:47:04','2025-10-02 06:47:04'),(409,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 06:55:36','2025-10-02 06:55:36','2025-10-02 06:55:36'),(410,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 06:55:36','2025-10-02 06:55:36','2025-10-02 06:55:36'),(411,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 06:55:36','2025-10-02 06:55:36','2025-10-02 06:55:36'),(412,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 06:57:41','2025-10-02 06:57:41','2025-10-02 06:57:41'),(413,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 06:57:41','2025-10-02 06:57:41','2025-10-02 06:57:41'),(414,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 06:57:41','2025-10-02 06:57:41','2025-10-02 06:57:41'),(415,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 06:57:50','2025-10-02 06:57:50','2025-10-02 06:57:50'),(416,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 06:57:50','2025-10-02 06:57:50','2025-10-02 06:57:50'),(417,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 06:57:50','2025-10-02 06:57:50','2025-10-02 06:57:50'),(418,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 07:14:25','2025-10-02 07:14:25','2025-10-02 07:14:25'),(419,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 07:14:25','2025-10-02 07:14:25','2025-10-02 07:14:25'),(420,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 07:14:25','2025-10-02 07:14:25','2025-10-02 07:14:25'),(421,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 07:14:37','2025-10-02 07:14:37','2025-10-02 07:14:37'),(422,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 07:14:37','2025-10-02 07:14:37','2025-10-02 07:14:37'),(423,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 07:14:37','2025-10-02 07:14:37','2025-10-02 07:14:37'),(424,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 07:29:48','2025-10-02 07:29:48','2025-10-02 07:29:48'),(425,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 07:29:48','2025-10-02 07:29:48','2025-10-02 07:29:48'),(426,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 07:29:48','2025-10-02 07:29:48','2025-10-02 07:29:48'),(427,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 08:37:58','2025-10-02 08:37:58','2025-10-02 08:37:58'),(428,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 08:37:58','2025-10-02 08:37:58','2025-10-02 08:37:58'),(429,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 08:37:58','2025-10-02 08:37:58','2025-10-02 08:37:58'),(430,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 08:40:15','2025-10-02 08:40:15','2025-10-02 08:40:15'),(431,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 08:40:15','2025-10-02 08:40:15','2025-10-02 08:40:15'),(432,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 08:40:15','2025-10-02 08:40:15','2025-10-02 08:40:15'),(433,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 08:40:34','2025-10-02 08:40:34','2025-10-02 08:40:34'),(434,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 08:40:34','2025-10-02 08:40:34','2025-10-02 08:40:34'),(435,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 08:40:34','2025-10-02 08:40:34','2025-10-02 08:40:34'),(436,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 11:37:10','2025-10-02 11:37:10','2025-10-02 11:37:10'),(437,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 11:37:10','2025-10-02 11:37:10','2025-10-02 11:37:10'),(438,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 11:37:10','2025-10-02 11:37:10','2025-10-02 11:37:10'),(439,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 11:38:05','2025-10-02 11:38:05','2025-10-02 11:38:05'),(440,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 11:38:05','2025-10-02 11:38:05','2025-10-02 11:38:05'),(441,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 11:38:05','2025-10-02 11:38:05','2025-10-02 11:38:05'),(442,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 12:07:22','2025-10-02 12:07:22','2025-10-02 12:07:22'),(443,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 12:07:22','2025-10-02 12:07:22','2025-10-02 12:07:22'),(444,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 12:07:22','2025-10-02 12:07:22','2025-10-02 12:07:22'),(445,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 12:13:18','2025-10-02 12:13:18','2025-10-02 12:13:18'),(446,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 12:13:18','2025-10-02 12:13:18','2025-10-02 12:13:18'),(447,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 12:13:18','2025-10-02 12:13:18','2025-10-02 12:13:18'),(448,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 12:34:58','2025-10-02 12:34:58','2025-10-02 12:34:58'),(449,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 12:34:58','2025-10-02 12:34:58','2025-10-02 12:34:58'),(450,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 12:34:58','2025-10-02 12:34:58','2025-10-02 12:34:58'),(451,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 12:42:39','2025-10-02 12:42:39','2025-10-02 12:42:39'),(452,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 12:42:39','2025-10-02 12:42:39','2025-10-02 12:42:39'),(453,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 12:42:39','2025-10-02 12:42:39','2025-10-02 12:42:39'),(454,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 12:42:56','2025-10-02 12:42:56','2025-10-02 12:42:56'),(455,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 12:42:56','2025-10-02 12:42:56','2025-10-02 12:42:56'),(456,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 12:42:56','2025-10-02 12:42:56','2025-10-02 12:42:56'),(457,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 13:12:47','2025-10-02 13:12:47','2025-10-02 13:12:47'),(458,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 13:12:47','2025-10-02 13:12:47','2025-10-02 13:12:47'),(459,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 13:12:47','2025-10-02 13:12:47','2025-10-02 13:12:47'),(460,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 13:13:05','2025-10-02 13:13:05','2025-10-02 13:13:05'),(461,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 13:13:05','2025-10-02 13:13:05','2025-10-02 13:13:05'),(462,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 13:13:05','2025-10-02 13:13:05','2025-10-02 13:13:05'),(463,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 13:49:44','2025-10-02 13:49:44','2025-10-02 13:49:44'),(464,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 13:49:44','2025-10-02 13:49:44','2025-10-02 13:49:44'),(465,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 13:49:44','2025-10-02 13:49:44','2025-10-02 13:49:44'),(466,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 13:50:02','2025-10-02 13:50:02','2025-10-02 13:50:02'),(467,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 13:50:02','2025-10-02 13:50:02','2025-10-02 13:50:02'),(468,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 13:50:02','2025-10-02 13:50:02','2025-10-02 13:50:02'),(469,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 14:15:09','2025-10-02 14:15:09','2025-10-02 14:15:09'),(470,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 14:15:09','2025-10-02 14:15:09','2025-10-02 14:15:09'),(471,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 14:15:09','2025-10-02 14:15:09','2025-10-02 14:15:09'),(472,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 14:39:10','2025-10-02 14:39:10','2025-10-02 14:39:10'),(473,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 14:39:10','2025-10-02 14:39:10','2025-10-02 14:39:10'),(474,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 14:39:10','2025-10-02 14:39:10','2025-10-02 14:39:10'),(475,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-02 14:50:27','2025-10-02 14:50:27','2025-10-02 14:50:27'),(476,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-02 14:50:27','2025-10-02 14:50:27','2025-10-02 14:50:27'),(477,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-02 14:50:27','2025-10-02 14:50:27','2025-10-02 14:50:27'),(478,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-03 11:51:44','2025-10-03 11:51:44','2025-10-03 11:51:44'),(479,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-03 11:51:44','2025-10-03 11:51:44','2025-10-03 11:51:44'),(480,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-03 11:51:45','2025-10-03 11:51:45','2025-10-03 11:51:45'),(481,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-03 11:52:08','2025-10-03 11:52:08','2025-10-03 11:52:08'),(482,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-03 11:52:08','2025-10-03 11:52:08','2025-10-03 11:52:08'),(483,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-03 11:52:08','2025-10-03 11:52:08','2025-10-03 11:52:08'),(484,2037,2,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-03 11:52:37','2025-10-03 11:52:37','2025-10-03 11:52:37'),(485,2037,14,'글 동기화: 9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 ...','2025-10-03 11:52:37','2025-10-03 11:52:37','2025-10-03 11:52:37'),(486,2037,3,'글 동기화: 9월26일 시작합니다 안녕하세요 좋은하루 입니다....','2025-10-03 11:52:37','2025-10-03 11:52:37','2025-10-03 11:52:37'),(487,2037,3,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-09 15:40:06','2025-10-09 15:40:06','2025-10-09 15:40:06'),(488,2037,3,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-09 15:47:11','2025-10-09 15:47:11','2025-10-09 15:47:11'),(489,2037,3,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-09 15:53:46','2025-10-09 15:53:46','2025-10-09 15:53:46'),(490,2037,3,'글 동기화: ● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다...','2025-10-09 15:53:56','2025-10-09 15:53:56','2025-10-09 15:53:56'),(491,2037,6,'나의 하루: 10월16일 목요일입니다 안녕하세요 날씨 흐림이에요...','2025-10-16 06:41:23','2025-10-16 06:41:23','2025-10-16 06:41:23'),(492,2037,8,'나의 하루: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요\n오늘은 금요일이에요...','2025-10-24 02:41:41','2025-10-24 02:41:41','2025-10-24 02:41:41'),(493,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 02:45:50','2025-10-24 02:45:50','2025-10-24 02:45:50'),(494,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 02:53:17','2025-10-24 02:53:17','2025-10-24 02:53:17'),(495,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 04:24:13','2025-10-24 04:24:13','2025-10-24 04:24:13'),(496,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 04:24:32','2025-10-24 04:24:32','2025-10-24 04:24:32'),(497,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 04:25:18','2025-10-24 04:25:18','2025-10-24 04:25:18'),(498,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 04:28:54','2025-10-24 04:28:54','2025-10-24 04:28:54'),(499,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 04:29:29','2025-10-24 04:29:29','2025-10-24 04:29:29'),(500,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 04:34:52','2025-10-24 04:34:52','2025-10-24 04:34:52'),(501,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 04:40:52','2025-10-24 04:40:52','2025-10-24 04:40:52'),(502,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 05:33:41','2025-10-24 05:33:41','2025-10-24 05:33:41'),(503,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 05:56:13','2025-10-24 05:56:13','2025-10-24 05:56:13'),(504,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 05:56:31','2025-10-24 05:56:31','2025-10-24 05:56:31'),(505,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 06:00:28','2025-10-24 06:00:28','2025-10-24 06:00:28'),(506,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 06:00:32','2025-10-24 06:00:32','2025-10-24 06:00:32'),(507,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 06:00:36','2025-10-24 06:00:36','2025-10-24 06:00:36'),(508,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 06:23:44','2025-10-24 06:23:44','2025-10-24 06:23:44'),(509,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 06:31:24','2025-10-24 06:31:24','2025-10-24 06:31:24'),(510,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 06:43:27','2025-10-24 06:43:27','2025-10-24 06:43:27'),(511,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 06:44:36','2025-10-24 06:44:36','2025-10-24 06:44:36'),(512,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 06:45:42','2025-10-24 06:45:42','2025-10-24 06:45:42'),(513,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 06:46:51','2025-10-24 06:46:51','2025-10-24 06:46:51'),(514,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 07:25:07','2025-10-24 07:25:07','2025-10-24 07:25:07'),(515,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 07:25:17','2025-10-24 07:25:17','2025-10-24 07:25:17'),(516,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 07:25:26','2025-10-24 07:25:26','2025-10-24 07:25:26'),(517,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 08:32:26','2025-10-24 08:32:26','2025-10-24 08:32:26'),(518,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 08:34:19','2025-10-24 08:34:19','2025-10-24 08:34:19'),(519,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 08:34:27','2025-10-24 08:34:27','2025-10-24 08:34:27'),(520,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 08:34:38','2025-10-24 08:34:38','2025-10-24 08:34:38'),(521,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 08:34:46','2025-10-24 08:34:46','2025-10-24 08:34:46'),(522,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 08:34:53','2025-10-24 08:34:53','2025-10-24 08:34:53'),(523,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 08:47:54','2025-10-24 08:47:54','2025-10-24 08:47:54'),(524,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 13:03:44','2025-10-24 13:03:44','2025-10-24 13:03:44'),(525,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 13:05:01','2025-10-24 13:05:01','2025-10-24 13:05:01'),(526,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 13:05:12','2025-10-24 13:05:12','2025-10-24 13:05:12'),(527,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 13:05:26','2025-10-24 13:05:26','2025-10-24 13:05:26'),(528,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 13:05:36','2025-10-24 13:05:36','2025-10-24 13:05:36'),(529,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 13:05:53','2025-10-24 13:05:53','2025-10-24 13:05:53'),(530,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 13:06:30','2025-10-24 13:06:30','2025-10-24 13:06:30'),(531,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-24 13:20:44','2025-10-24 13:20:44','2025-10-24 13:20:44'),(532,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 08:35:35','2025-10-29 08:35:35','2025-10-29 08:35:35'),(533,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 11:06:27','2025-10-29 11:06:27','2025-10-29 11:06:27'),(534,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 11:52:51','2025-10-29 11:52:51','2025-10-29 11:52:51'),(535,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 11:59:16','2025-10-29 11:59:16','2025-10-29 11:59:16'),(536,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 11:59:38','2025-10-29 11:59:38','2025-10-29 11:59:38'),(537,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 12:08:52','2025-10-29 12:08:52','2025-10-29 12:08:52'),(538,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 12:09:03','2025-10-29 12:09:03','2025-10-29 12:09:03'),(539,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 12:09:16','2025-10-29 12:09:16','2025-10-29 12:09:16'),(540,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 12:09:38','2025-10-29 12:09:38','2025-10-29 12:09:38'),(541,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 12:21:09','2025-10-29 12:21:09','2025-10-29 12:21:09'),(542,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 12:21:19','2025-10-29 12:21:19','2025-10-29 12:21:19'),(543,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 12:21:37','2025-10-29 12:21:37','2025-10-29 12:21:37'),(544,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 12:22:03','2025-10-29 12:22:03','2025-10-29 12:22:03'),(545,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 12:41:07','2025-10-29 12:41:07','2025-10-29 12:41:07'),(546,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 12:42:12','2025-10-29 12:42:12','2025-10-29 12:42:12'),(547,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 12:48:19','2025-10-29 12:48:19','2025-10-29 12:48:19'),(548,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-29 13:01:18','2025-10-29 13:01:18','2025-10-29 13:01:18'),(549,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 04:00:26','2025-10-30 04:00:26','2025-10-30 04:00:26'),(550,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:22:13','2025-10-30 08:22:13','2025-10-30 08:22:13'),(551,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:22:43','2025-10-30 08:22:43','2025-10-30 08:22:43'),(552,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:25:29','2025-10-30 08:25:29','2025-10-30 08:25:29'),(553,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:26:01','2025-10-30 08:26:01','2025-10-30 08:26:01'),(554,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:30:12','2025-10-30 08:30:12','2025-10-30 08:30:12'),(555,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:30:41','2025-10-30 08:30:41','2025-10-30 08:30:41'),(556,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:34:29','2025-10-30 08:34:29','2025-10-30 08:34:29'),(557,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:34:34','2025-10-30 08:34:34','2025-10-30 08:34:34'),(558,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:35:01','2025-10-30 08:35:01','2025-10-30 08:35:01'),(559,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:35:05','2025-10-30 08:35:05','2025-10-30 08:35:05'),(560,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:35:21','2025-10-30 08:35:21','2025-10-30 08:35:21'),(561,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:35:34','2025-10-30 08:35:34','2025-10-30 08:35:34'),(562,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:39:19','2025-10-30 08:39:19','2025-10-30 08:39:19'),(563,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:39:23','2025-10-30 08:39:23','2025-10-30 08:39:23'),(564,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:40:03','2025-10-30 08:40:03','2025-10-30 08:40:03'),(565,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:40:43','2025-10-30 08:40:43','2025-10-30 08:40:43'),(566,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:44:29','2025-10-30 08:44:29','2025-10-30 08:44:29'),(567,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:44:32','2025-10-30 08:44:32','2025-10-30 08:44:32'),(568,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:44:51','2025-10-30 08:44:51','2025-10-30 08:44:51'),(569,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:44:54','2025-10-30 08:44:54','2025-10-30 08:44:54'),(570,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:45:11','2025-10-30 08:45:11','2025-10-30 08:45:11'),(571,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:45:16','2025-10-30 08:45:16','2025-10-30 08:45:16'),(572,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:45:31','2025-10-30 08:45:31','2025-10-30 08:45:31'),(573,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 08:45:48','2025-10-30 08:45:48','2025-10-30 08:45:48'),(574,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 11:57:21','2025-10-30 11:57:21','2025-10-30 11:57:21'),(575,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 11:57:36','2025-10-30 11:57:36','2025-10-30 11:57:36'),(576,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:00:21','2025-10-30 12:00:21','2025-10-30 12:00:21'),(577,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:00:42','2025-10-30 12:00:42','2025-10-30 12:00:42'),(578,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:01:14','2025-10-30 12:01:14','2025-10-30 12:01:14'),(579,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:21:01','2025-10-30 12:21:01','2025-10-30 12:21:01'),(580,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:33:11','2025-10-30 12:33:11','2025-10-30 12:33:11'),(581,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:38:17','2025-10-30 12:38:17','2025-10-30 12:38:17'),(582,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:42:30','2025-10-30 12:42:30','2025-10-30 12:42:30'),(583,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:44:38','2025-10-30 12:44:38','2025-10-30 12:44:38'),(584,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:51:08','2025-10-30 12:51:08','2025-10-30 12:51:08'),(585,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:51:18','2025-10-30 12:51:18','2025-10-30 12:51:18'),(586,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:51:27','2025-10-30 12:51:27','2025-10-30 12:51:27'),(587,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:51:35','2025-10-30 12:51:35','2025-10-30 12:51:35'),(588,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:51:43','2025-10-30 12:51:43','2025-10-30 12:51:43'),(589,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:54:39','2025-10-30 12:54:39','2025-10-30 12:54:39'),(590,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:54:43','2025-10-30 12:54:43','2025-10-30 12:54:43'),(591,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:54:45','2025-10-30 12:54:45','2025-10-30 12:54:45'),(592,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:55:40','2025-10-30 12:55:40','2025-10-30 12:55:40'),(593,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:59:15','2025-10-30 12:59:15','2025-10-30 12:59:15'),(594,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:59:18','2025-10-30 12:59:18','2025-10-30 12:59:18'),(595,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:59:22','2025-10-30 12:59:22','2025-10-30 12:59:22'),(596,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:59:26','2025-10-30 12:59:26','2025-10-30 12:59:26'),(597,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:59:28','2025-10-30 12:59:28','2025-10-30 12:59:28'),(598,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:59:31','2025-10-30 12:59:31','2025-10-30 12:59:31'),(599,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:59:36','2025-10-30 12:59:36','2025-10-30 12:59:36'),(600,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 12:59:41','2025-10-30 12:59:41','2025-10-30 12:59:41'),(601,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:11:10','2025-10-30 13:11:10','2025-10-30 13:11:10'),(602,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:17:36','2025-10-30 13:17:36','2025-10-30 13:17:36'),(603,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:17:58','2025-10-30 13:17:58','2025-10-30 13:17:58'),(604,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:18:13','2025-10-30 13:18:13','2025-10-30 13:18:13'),(605,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:22:41','2025-10-30 13:22:41','2025-10-30 13:22:41'),(606,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:23:02','2025-10-30 13:23:02','2025-10-30 13:23:02'),(607,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:23:17','2025-10-30 13:23:17','2025-10-30 13:23:17'),(608,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:26:18','2025-10-30 13:26:18','2025-10-30 13:26:18'),(609,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:26:31','2025-10-30 13:26:31','2025-10-30 13:26:31'),(610,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:26:48','2025-10-30 13:26:48','2025-10-30 13:26:48'),(611,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:26:59','2025-10-30 13:26:59','2025-10-30 13:26:59'),(612,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:27:37','2025-10-30 13:27:37','2025-10-30 13:27:37'),(613,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:30:59','2025-10-30 13:30:59','2025-10-30 13:30:59'),(614,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:31:29','2025-10-30 13:31:29','2025-10-30 13:31:29'),(615,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:31:58','2025-10-30 13:31:58','2025-10-30 13:31:58'),(616,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:32:19','2025-10-30 13:32:19','2025-10-30 13:32:19'),(617,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:36:56','2025-10-30 13:36:56','2025-10-30 13:36:56'),(618,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:37:07','2025-10-30 13:37:07','2025-10-30 13:37:07'),(619,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:37:44','2025-10-30 13:37:44','2025-10-30 13:37:44'),(620,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:42:43','2025-10-30 13:42:43','2025-10-30 13:42:43'),(621,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:42:57','2025-10-30 13:42:57','2025-10-30 13:42:57'),(622,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:43:08','2025-10-30 13:43:08','2025-10-30 13:43:08'),(623,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:43:16','2025-10-30 13:43:16','2025-10-30 13:43:16'),(624,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:43:51','2025-10-30 13:43:51','2025-10-30 13:43:51'),(625,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:44:07','2025-10-30 13:44:07','2025-10-30 13:44:07'),(626,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:44:50','2025-10-30 13:44:50','2025-10-30 13:44:50'),(627,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:45:13','2025-10-30 13:45:13','2025-10-30 13:45:13'),(628,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:47:03','2025-10-30 13:47:03','2025-10-30 13:47:03'),(629,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:47:08','2025-10-30 13:47:08','2025-10-30 13:47:08'),(630,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:47:15','2025-10-30 13:47:15','2025-10-30 13:47:15'),(631,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:47:26','2025-10-30 13:47:26','2025-10-30 13:47:26'),(632,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:47:35','2025-10-30 13:47:35','2025-10-30 13:47:35'),(633,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:47:43','2025-10-30 13:47:43','2025-10-30 13:47:43'),(634,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:48:03','2025-10-30 13:48:03','2025-10-30 13:48:03'),(635,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:48:13','2025-10-30 13:48:13','2025-10-30 13:48:13'),(636,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:48:48','2025-10-30 13:48:48','2025-10-30 13:48:48'),(637,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:48:57','2025-10-30 13:48:57','2025-10-30 13:48:57'),(638,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:49:11','2025-10-30 13:49:11','2025-10-30 13:49:11'),(639,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:49:19','2025-10-30 13:49:19','2025-10-30 13:49:19'),(640,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:49:28','2025-10-30 13:49:28','2025-10-30 13:49:28'),(641,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:49:40','2025-10-30 13:49:40','2025-10-30 13:49:40'),(642,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:49:53','2025-10-30 13:49:53','2025-10-30 13:49:53'),(643,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:50:04','2025-10-30 13:50:04','2025-10-30 13:50:04'),(644,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:53:12','2025-10-30 13:53:12','2025-10-30 13:53:12'),(645,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 13:53:21','2025-10-30 13:53:21','2025-10-30 13:53:21'),(646,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:03:45','2025-10-30 14:03:45','2025-10-30 14:03:45'),(647,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:06:36','2025-10-30 14:06:36','2025-10-30 14:06:36'),(648,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:06:42','2025-10-30 14:06:42','2025-10-30 14:06:42'),(649,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:07:08','2025-10-30 14:07:08','2025-10-30 14:07:08'),(650,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:07:56','2025-10-30 14:07:56','2025-10-30 14:07:56'),(651,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:08:01','2025-10-30 14:08:01','2025-10-30 14:08:01'),(652,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:08:08','2025-10-30 14:08:08','2025-10-30 14:08:08'),(653,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:08:13','2025-10-30 14:08:13','2025-10-30 14:08:13'),(654,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:08:24','2025-10-30 14:08:24','2025-10-30 14:08:24'),(655,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:08:30','2025-10-30 14:08:30','2025-10-30 14:08:30'),(656,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:08:56','2025-10-30 14:08:56','2025-10-30 14:08:56'),(657,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:10:15','2025-10-30 14:10:15','2025-10-30 14:10:15'),(658,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:10:21','2025-10-30 14:10:21','2025-10-30 14:10:21'),(659,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:10:45','2025-10-30 14:10:45','2025-10-30 14:10:45'),(660,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:10:52','2025-10-30 14:10:52','2025-10-30 14:10:52'),(661,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:11:32','2025-10-30 14:11:32','2025-10-30 14:11:32'),(662,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:12:11','2025-10-30 14:12:11','2025-10-30 14:12:11'),(663,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:12:15','2025-10-30 14:12:15','2025-10-30 14:12:15'),(664,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:12:24','2025-10-30 14:12:24','2025-10-30 14:12:24'),(665,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:12:33','2025-10-30 14:12:33','2025-10-30 14:12:33'),(666,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:14:13','2025-10-30 14:14:13','2025-10-30 14:14:13'),(667,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:14:31','2025-10-30 14:14:31','2025-10-30 14:14:31'),(668,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:15:25','2025-10-30 14:15:25','2025-10-30 14:15:25'),(669,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:15:52','2025-10-30 14:15:52','2025-10-30 14:15:52'),(670,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:16:32','2025-10-30 14:16:32','2025-10-30 14:16:32'),(671,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:16:51','2025-10-30 14:16:51','2025-10-30 14:16:51'),(672,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:17:17','2025-10-30 14:17:17','2025-10-30 14:17:17'),(673,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:17:45','2025-10-30 14:17:45','2025-10-30 14:17:45'),(674,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:18:05','2025-10-30 14:18:05','2025-10-30 14:18:05'),(675,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:18:51','2025-10-30 14:18:51','2025-10-30 14:18:51'),(676,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:19:21','2025-10-30 14:19:21','2025-10-30 14:19:21'),(677,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:29:42','2025-10-30 14:29:42','2025-10-30 14:29:42'),(678,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:30:09','2025-10-30 14:30:09','2025-10-30 14:30:09'),(679,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:31:16','2025-10-30 14:31:16','2025-10-30 14:31:16'),(680,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:36:38','2025-10-30 14:36:38','2025-10-30 14:36:38'),(681,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:38:51','2025-10-30 14:38:51','2025-10-30 14:38:51'),(682,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:39:59','2025-10-30 14:39:59','2025-10-30 14:39:59'),(683,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:40:18','2025-10-30 14:40:18','2025-10-30 14:40:18'),(684,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:41:37','2025-10-30 14:41:37','2025-10-30 14:41:37'),(685,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:41:44','2025-10-30 14:41:44','2025-10-30 14:41:44'),(686,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:41:50','2025-10-30 14:41:50','2025-10-30 14:41:50'),(687,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:41:58','2025-10-30 14:41:58','2025-10-30 14:41:58'),(688,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:42:06','2025-10-30 14:42:06','2025-10-30 14:42:06'),(689,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:42:14','2025-10-30 14:42:14','2025-10-30 14:42:14'),(690,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:42:23','2025-10-30 14:42:23','2025-10-30 14:42:23'),(691,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:42:32','2025-10-30 14:42:32','2025-10-30 14:42:32'),(692,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:42:36','2025-10-30 14:42:36','2025-10-30 14:42:36'),(693,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:42:47','2025-10-30 14:42:47','2025-10-30 14:42:47'),(694,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:42:52','2025-10-30 14:42:52','2025-10-30 14:42:52'),(695,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:43:05','2025-10-30 14:43:05','2025-10-30 14:43:05'),(696,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:43:12','2025-10-30 14:43:12','2025-10-30 14:43:12'),(697,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:43:50','2025-10-30 14:43:50','2025-10-30 14:43:50'),(698,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:43:57','2025-10-30 14:43:57','2025-10-30 14:43:57'),(699,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:44:08','2025-10-30 14:44:08','2025-10-30 14:44:08'),(700,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:44:14','2025-10-30 14:44:14','2025-10-30 14:44:14'),(701,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:44:34','2025-10-30 14:44:34','2025-10-30 14:44:34'),(702,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:44:40','2025-10-30 14:44:40','2025-10-30 14:44:40'),(703,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:46:08','2025-10-30 14:46:08','2025-10-30 14:46:08'),(704,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:46:15','2025-10-30 14:46:15','2025-10-30 14:46:15'),(705,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:46:25','2025-10-30 14:46:25','2025-10-30 14:46:25'),(706,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:46:32','2025-10-30 14:46:32','2025-10-30 14:46:32'),(707,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:46:42','2025-10-30 14:46:42','2025-10-30 14:46:42'),(708,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:46:47','2025-10-30 14:46:47','2025-10-30 14:46:47'),(709,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:47:08','2025-10-30 14:47:08','2025-10-30 14:47:08'),(710,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:47:39','2025-10-30 14:47:39','2025-10-30 14:47:39'),(711,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:49:26','2025-10-30 14:49:26','2025-10-30 14:49:26'),(712,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:55:14','2025-10-30 14:55:14','2025-10-30 14:55:14'),(713,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:55:22','2025-10-30 14:55:22','2025-10-30 14:55:22'),(714,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:55:30','2025-10-30 14:55:30','2025-10-30 14:55:30'),(715,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:55:40','2025-10-30 14:55:40','2025-10-30 14:55:40'),(716,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:55:49','2025-10-30 14:55:49','2025-10-30 14:55:49'),(717,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:55:58','2025-10-30 14:55:58','2025-10-30 14:55:58'),(718,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:56:06','2025-10-30 14:56:06','2025-10-30 14:56:06'),(719,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:56:24','2025-10-30 14:56:24','2025-10-30 14:56:24'),(720,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:56:38','2025-10-30 14:56:38','2025-10-30 14:56:38'),(721,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:56:48','2025-10-30 14:56:48','2025-10-30 14:56:48'),(722,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:56:58','2025-10-30 14:56:58','2025-10-30 14:56:58'),(723,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:57:16','2025-10-30 14:57:16','2025-10-30 14:57:16'),(724,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:57:23','2025-10-30 14:57:23','2025-10-30 14:57:23'),(725,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:59:27','2025-10-30 14:59:27','2025-10-30 14:59:27'),(726,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:59:36','2025-10-30 14:59:36','2025-10-30 14:59:36'),(727,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 14:59:44','2025-10-30 14:59:44','2025-10-30 14:59:44'),(728,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:01:25','2025-10-30 15:01:25','2025-10-30 15:01:25'),(729,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:02:09','2025-10-30 15:02:09','2025-10-30 15:02:09'),(730,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:02:18','2025-10-30 15:02:18','2025-10-30 15:02:18'),(731,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:02:33','2025-10-30 15:02:33','2025-10-30 15:02:33'),(732,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:02:43','2025-10-30 15:02:43','2025-10-30 15:02:43'),(733,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:02:53','2025-10-30 15:02:53','2025-10-30 15:02:53'),(734,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:03:03','2025-10-30 15:03:03','2025-10-30 15:03:03'),(735,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:03:12','2025-10-30 15:03:12','2025-10-30 15:03:12'),(736,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:03:20','2025-10-30 15:03:20','2025-10-30 15:03:20'),(737,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:03:32','2025-10-30 15:03:32','2025-10-30 15:03:32'),(738,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:03:42','2025-10-30 15:03:42','2025-10-30 15:03:42'),(739,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:07:01','2025-10-30 15:07:01','2025-10-30 15:07:01'),(740,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:07:19','2025-10-30 15:07:19','2025-10-30 15:07:19'),(741,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:07:38','2025-10-30 15:07:38','2025-10-30 15:07:38'),(742,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:07:57','2025-10-30 15:07:57','2025-10-30 15:07:57'),(743,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:08:13','2025-10-30 15:08:13','2025-10-30 15:08:13'),(744,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:08:44','2025-10-30 15:08:44','2025-10-30 15:08:44'),(745,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:13:06','2025-10-30 15:13:06','2025-10-30 15:13:06'),(746,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:13:13','2025-10-30 15:13:13','2025-10-30 15:13:13'),(747,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:19:15','2025-10-30 15:19:15','2025-10-30 15:19:15'),(748,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:19:30','2025-10-30 15:19:30','2025-10-30 15:19:30'),(749,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:19:44','2025-10-30 15:19:44','2025-10-30 15:19:44'),(750,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:26:57','2025-10-30 15:26:57','2025-10-30 15:26:57'),(751,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:27:07','2025-10-30 15:27:07','2025-10-30 15:27:07'),(752,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-30 15:28:28','2025-10-30 15:28:28','2025-10-30 15:28:28'),(753,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:11:33','2025-10-31 01:11:33','2025-10-31 01:11:33'),(754,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:13:13','2025-10-31 01:13:13','2025-10-31 01:13:13'),(755,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:15:31','2025-10-31 01:15:31','2025-10-31 01:15:31'),(756,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:15:46','2025-10-31 01:15:46','2025-10-31 01:15:46'),(757,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:16:26','2025-10-31 01:16:26','2025-10-31 01:16:26'),(758,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:21:13','2025-10-31 01:21:13','2025-10-31 01:21:13'),(759,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:21:19','2025-10-31 01:21:19','2025-10-31 01:21:19'),(760,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:25:43','2025-10-31 01:25:43','2025-10-31 01:25:43'),(761,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:25:57','2025-10-31 01:25:57','2025-10-31 01:25:57'),(762,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:26:19','2025-10-31 01:26:19','2025-10-31 01:26:19'),(763,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:26:32','2025-10-31 01:26:32','2025-10-31 01:26:32'),(764,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:27:20','2025-10-31 01:27:20','2025-10-31 01:27:20'),(765,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:27:42','2025-10-31 01:27:42','2025-10-31 01:27:42'),(766,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:28:26','2025-10-31 01:28:26','2025-10-31 01:28:26'),(767,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:28:37','2025-10-31 01:28:37','2025-10-31 01:28:37'),(768,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:43:32','2025-10-31 01:43:32','2025-10-31 01:43:32'),(769,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:43:43','2025-10-31 01:43:43','2025-10-31 01:43:43'),(770,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:43:54','2025-10-31 01:43:54','2025-10-31 01:43:54'),(771,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:44:04','2025-10-31 01:44:04','2025-10-31 01:44:04'),(772,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:44:19','2025-10-31 01:44:19','2025-10-31 01:44:19'),(773,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:44:56','2025-10-31 01:44:56','2025-10-31 01:44:56'),(774,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:45:24','2025-10-31 01:45:24','2025-10-31 01:45:24'),(775,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:45:35','2025-10-31 01:45:35','2025-10-31 01:45:35'),(776,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:45:52','2025-10-31 01:45:52','2025-10-31 01:45:52'),(777,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:45:58','2025-10-31 01:45:58','2025-10-31 01:45:58'),(778,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 01:55:12','2025-10-31 01:55:12','2025-10-31 01:55:12'),(779,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:03:54','2025-10-31 02:03:54','2025-10-31 02:03:54'),(780,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:04:02','2025-10-31 02:04:02','2025-10-31 02:04:02'),(781,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:04:53','2025-10-31 02:04:53','2025-10-31 02:04:53'),(782,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:05:43','2025-10-31 02:05:43','2025-10-31 02:05:43'),(783,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:05:54','2025-10-31 02:05:54','2025-10-31 02:05:54'),(784,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:06:05','2025-10-31 02:06:05','2025-10-31 02:06:05'),(785,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:06:26','2025-10-31 02:06:26','2025-10-31 02:06:26'),(786,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:06:33','2025-10-31 02:06:33','2025-10-31 02:06:33'),(787,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:06:51','2025-10-31 02:06:51','2025-10-31 02:06:51'),(788,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:07:14','2025-10-31 02:07:14','2025-10-31 02:07:14'),(789,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:07:51','2025-10-31 02:07:51','2025-10-31 02:07:51'),(790,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:08:54','2025-10-31 02:08:54','2025-10-31 02:08:54'),(791,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:10:13','2025-10-31 02:10:13','2025-10-31 02:10:13'),(792,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:10:31','2025-10-31 02:10:31','2025-10-31 02:10:31'),(793,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:14:03','2025-10-31 02:14:03','2025-10-31 02:14:03'),(794,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:14:13','2025-10-31 02:14:13','2025-10-31 02:14:13'),(795,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:14:21','2025-10-31 02:14:21','2025-10-31 02:14:21'),(796,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:14:32','2025-10-31 02:14:32','2025-10-31 02:14:32'),(797,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:14:45','2025-10-31 02:14:45','2025-10-31 02:14:45'),(798,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:14:52','2025-10-31 02:14:52','2025-10-31 02:14:52'),(799,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:14:59','2025-10-31 02:14:59','2025-10-31 02:14:59'),(800,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:15:07','2025-10-31 02:15:07','2025-10-31 02:15:07'),(801,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:15:15','2025-10-31 02:15:15','2025-10-31 02:15:15'),(802,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:15:31','2025-10-31 02:15:31','2025-10-31 02:15:31'),(803,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:15:46','2025-10-31 02:15:46','2025-10-31 02:15:46'),(804,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:15:54','2025-10-31 02:15:54','2025-10-31 02:15:54'),(805,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:16:01','2025-10-31 02:16:01','2025-10-31 02:16:01'),(806,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:16:08','2025-10-31 02:16:08','2025-10-31 02:16:08'),(807,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:16:12','2025-10-31 02:16:12','2025-10-31 02:16:12'),(808,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:16:22','2025-10-31 02:16:22','2025-10-31 02:16:22'),(809,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:16:27','2025-10-31 02:16:27','2025-10-31 02:16:27'),(810,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:16:38','2025-10-31 02:16:38','2025-10-31 02:16:38'),(811,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:16:47','2025-10-31 02:16:47','2025-10-31 02:16:47'),(812,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:17:00','2025-10-31 02:17:00','2025-10-31 02:17:00'),(813,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:17:05','2025-10-31 02:17:05','2025-10-31 02:17:05'),(814,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:17:14','2025-10-31 02:17:14','2025-10-31 02:17:14'),(815,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:17:21','2025-10-31 02:17:21','2025-10-31 02:17:21'),(816,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:17:44','2025-10-31 02:17:44','2025-10-31 02:17:44'),(817,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:17:55','2025-10-31 02:17:55','2025-10-31 02:17:55'),(818,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:18:01','2025-10-31 02:18:01','2025-10-31 02:18:01'),(819,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:18:10','2025-10-31 02:18:10','2025-10-31 02:18:10'),(820,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:18:36','2025-10-31 02:18:36','2025-10-31 02:18:36'),(821,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:18:46','2025-10-31 02:18:46','2025-10-31 02:18:46'),(822,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:19:38','2025-10-31 02:19:38','2025-10-31 02:19:38'),(823,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:19:47','2025-10-31 02:19:47','2025-10-31 02:19:47'),(824,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:19:55','2025-10-31 02:19:55','2025-10-31 02:19:55'),(825,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:20:02','2025-10-31 02:20:02','2025-10-31 02:20:02'),(826,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:20:11','2025-10-31 02:20:11','2025-10-31 02:20:11'),(827,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:20:25','2025-10-31 02:20:25','2025-10-31 02:20:25'),(828,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:20:36','2025-10-31 02:20:36','2025-10-31 02:20:36'),(829,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:20:49','2025-10-31 02:20:49','2025-10-31 02:20:49'),(830,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:21:01','2025-10-31 02:21:01','2025-10-31 02:21:01'),(831,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:21:05','2025-10-31 02:21:05','2025-10-31 02:21:05'),(832,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:21:11','2025-10-31 02:21:11','2025-10-31 02:21:11'),(833,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:21:19','2025-10-31 02:21:19','2025-10-31 02:21:19'),(834,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:21:26','2025-10-31 02:21:26','2025-10-31 02:21:26'),(835,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:21:32','2025-10-31 02:21:32','2025-10-31 02:21:32'),(836,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:25:09','2025-10-31 02:25:09','2025-10-31 02:25:09'),(837,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:27:22','2025-10-31 02:27:22','2025-10-31 02:27:22'),(838,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:27:31','2025-10-31 02:27:31','2025-10-31 02:27:31'),(839,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:29:12','2025-10-31 02:29:12','2025-10-31 02:29:12'),(840,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:29:14','2025-10-31 02:29:14','2025-10-31 02:29:14'),(841,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:29:16','2025-10-31 02:29:16','2025-10-31 02:29:16'),(842,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:35:44','2025-10-31 02:35:44','2025-10-31 02:35:44'),(843,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:35:54','2025-10-31 02:35:54','2025-10-31 02:35:54'),(844,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:36:08','2025-10-31 02:36:08','2025-10-31 02:36:08'),(845,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:40:21','2025-10-31 02:40:21','2025-10-31 02:40:21'),(846,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:40:31','2025-10-31 02:40:31','2025-10-31 02:40:31'),(847,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:42:57','2025-10-31 02:42:57','2025-10-31 02:42:57'),(848,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:47:18','2025-10-31 02:47:18','2025-10-31 02:47:18'),(849,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:47:30','2025-10-31 02:47:30','2025-10-31 02:47:30'),(850,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:47:43','2025-10-31 02:47:43','2025-10-31 02:47:43'),(851,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:47:53','2025-10-31 02:47:53','2025-10-31 02:47:53'),(852,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:48:22','2025-10-31 02:48:22','2025-10-31 02:48:22'),(853,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:48:39','2025-10-31 02:48:39','2025-10-31 02:48:39'),(854,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:48:54','2025-10-31 02:48:54','2025-10-31 02:48:54'),(855,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:49:01','2025-10-31 02:49:01','2025-10-31 02:49:01'),(856,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:49:16','2025-10-31 02:49:16','2025-10-31 02:49:16'),(857,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:50:03','2025-10-31 02:50:03','2025-10-31 02:50:03'),(858,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:50:09','2025-10-31 02:50:09','2025-10-31 02:50:09'),(859,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:50:54','2025-10-31 02:50:54','2025-10-31 02:50:54'),(860,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:51:12','2025-10-31 02:51:12','2025-10-31 02:51:12'),(861,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 02:51:56','2025-10-31 02:51:56','2025-10-31 02:51:56'),(862,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:26:46','2025-10-31 04:26:46','2025-10-31 04:26:46'),(863,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:26:53','2025-10-31 04:26:53','2025-10-31 04:26:53'),(864,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:28:56','2025-10-31 04:28:56','2025-10-31 04:28:56'),(865,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:29:51','2025-10-31 04:29:51','2025-10-31 04:29:51'),(866,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:31:17','2025-10-31 04:31:17','2025-10-31 04:31:17'),(867,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:32:00','2025-10-31 04:32:00','2025-10-31 04:32:00'),(868,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:34:10','2025-10-31 04:34:10','2025-10-31 04:34:10'),(869,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:34:21','2025-10-31 04:34:21','2025-10-31 04:34:21'),(870,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:34:30','2025-10-31 04:34:30','2025-10-31 04:34:30'),(871,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:38:14','2025-10-31 04:38:14','2025-10-31 04:38:14'),(872,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:39:00','2025-10-31 04:39:00','2025-10-31 04:39:00'),(873,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:39:08','2025-10-31 04:39:08','2025-10-31 04:39:08'),(874,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:39:25','2025-10-31 04:39:25','2025-10-31 04:39:25'),(875,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:40:02','2025-10-31 04:40:02','2025-10-31 04:40:02'),(876,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:40:10','2025-10-31 04:40:10','2025-10-31 04:40:10'),(877,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:40:50','2025-10-31 04:40:50','2025-10-31 04:40:50'),(878,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:41:05','2025-10-31 04:41:05','2025-10-31 04:41:05'),(879,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:41:24','2025-10-31 04:41:24','2025-10-31 04:41:24'),(880,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:42:12','2025-10-31 04:42:12','2025-10-31 04:42:12'),(881,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:43:02','2025-10-31 04:43:02','2025-10-31 04:43:02'),(882,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:43:23','2025-10-31 04:43:23','2025-10-31 04:43:23'),(883,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:43:31','2025-10-31 04:43:31','2025-10-31 04:43:31'),(884,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:44:12','2025-10-31 04:44:12','2025-10-31 04:44:12'),(885,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:44:20','2025-10-31 04:44:20','2025-10-31 04:44:20'),(886,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:46:23','2025-10-31 04:46:23','2025-10-31 04:46:23'),(887,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:46:32','2025-10-31 04:46:32','2025-10-31 04:46:32'),(888,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:46:44','2025-10-31 04:46:44','2025-10-31 04:46:44'),(889,2037,6,'나의 하루: 선발투수 라이언 와이스가 7⅔이닝 4피안타 2볼넷 1사구 7탈삼진 1실점으로 호투한 한화는...','2025-10-31 04:52:14','2025-10-31 04:52:14','2025-10-31 04:52:14'),(890,2037,6,'글 동기화: 선발투수 라이언 와이스가 7⅔이닝 4피안타 2볼넷 1사...','2025-10-31 04:53:20','2025-10-31 04:53:20','2025-10-31 04:53:20'),(891,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:53:20','2025-10-31 04:53:20','2025-10-31 04:53:20'),(892,2037,6,'글 동기화: 선발투수 라이언 와이스가 7⅔이닝 4피안타 2볼넷 1사...','2025-10-31 04:53:26','2025-10-31 04:53:26','2025-10-31 04:53:26'),(893,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:53:26','2025-10-31 04:53:26','2025-10-31 04:53:26'),(894,2037,6,'글 동기화: 선발투수 라이언 와이스가 7⅔이닝 4피안타 2볼넷 1사...','2025-10-31 04:58:57','2025-10-31 04:58:57','2025-10-31 04:58:57'),(895,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:58:57','2025-10-31 04:58:57','2025-10-31 04:58:57'),(896,2037,6,'글 동기화: 선발투수 라이언 와이스가 7⅔이닝 4피안타 2볼넷 1사...','2025-10-31 04:59:07','2025-10-31 04:59:07','2025-10-31 04:59:07'),(897,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 04:59:07','2025-10-31 04:59:07','2025-10-31 04:59:07'),(898,2037,6,'글 동기화: 선발투수 라이언 와이스가 7⅔이닝 4피안타 2볼넷 1사...','2025-10-31 05:01:16','2025-10-31 05:01:16','2025-10-31 05:01:16'),(899,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:01:16','2025-10-31 05:01:16','2025-10-31 05:01:16'),(900,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:01:22','2025-10-31 05:01:22','2025-10-31 05:01:22'),(901,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:01:28','2025-10-31 05:01:28','2025-10-31 05:01:28'),(902,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:01:36','2025-10-31 05:01:36','2025-10-31 05:01:36'),(903,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:01:45','2025-10-31 05:01:45','2025-10-31 05:01:45'),(904,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:03:23','2025-10-31 05:03:23','2025-10-31 05:03:23'),(905,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:03:49','2025-10-31 05:03:49','2025-10-31 05:03:49'),(906,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:05:40','2025-10-31 05:05:40','2025-10-31 05:05:40'),(907,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:06:02','2025-10-31 05:06:02','2025-10-31 05:06:02'),(908,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:06:12','2025-10-31 05:06:12','2025-10-31 05:06:12'),(909,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:06:19','2025-10-31 05:06:19','2025-10-31 05:06:19'),(910,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:06:54','2025-10-31 05:06:54','2025-10-31 05:06:54'),(911,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:07:17','2025-10-31 05:07:17','2025-10-31 05:07:17'),(912,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:08:02','2025-10-31 05:08:02','2025-10-31 05:08:02'),(913,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:09:17','2025-10-31 05:09:17','2025-10-31 05:09:17'),(914,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:09:26','2025-10-31 05:09:26','2025-10-31 05:09:26'),(915,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:09:36','2025-10-31 05:09:36','2025-10-31 05:09:36'),(916,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:10:02','2025-10-31 05:10:02','2025-10-31 05:10:02'),(917,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:10:31','2025-10-31 05:10:31','2025-10-31 05:10:31'),(918,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:11:51','2025-10-31 05:11:51','2025-10-31 05:11:51'),(919,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:12:46','2025-10-31 05:12:46','2025-10-31 05:12:46'),(920,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:13:27','2025-10-31 05:13:27','2025-10-31 05:13:27'),(921,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:15:02','2025-10-31 05:15:02','2025-10-31 05:15:02'),(922,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:16:32','2025-10-31 05:16:32','2025-10-31 05:16:32'),(923,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:16:39','2025-10-31 05:16:39','2025-10-31 05:16:39'),(924,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:16:45','2025-10-31 05:16:45','2025-10-31 05:16:45'),(925,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:17:06','2025-10-31 05:17:06','2025-10-31 05:17:06'),(926,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:20:00','2025-10-31 05:20:00','2025-10-31 05:20:00'),(927,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:20:11','2025-10-31 05:20:11','2025-10-31 05:20:11'),(928,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:21:10','2025-10-31 05:21:10','2025-10-31 05:21:10'),(929,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:22:37','2025-10-31 05:22:37','2025-10-31 05:22:37'),(930,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:22:46','2025-10-31 05:22:46','2025-10-31 05:22:46'),(931,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:24:10','2025-10-31 05:24:10','2025-10-31 05:24:10'),(932,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:26:49','2025-10-31 05:26:49','2025-10-31 05:26:49'),(933,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:29:10','2025-10-31 05:29:10','2025-10-31 05:29:10'),(934,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:31:22','2025-10-31 05:31:22','2025-10-31 05:31:22'),(935,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:31:40','2025-10-31 05:31:40','2025-10-31 05:31:40'),(936,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:32:53','2025-10-31 05:32:53','2025-10-31 05:32:53'),(937,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:34:50','2025-10-31 05:34:50','2025-10-31 05:34:50'),(938,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:36:47','2025-10-31 05:36:47','2025-10-31 05:36:47'),(939,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:37:04','2025-10-31 05:37:04','2025-10-31 05:37:04'),(940,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:37:11','2025-10-31 05:37:11','2025-10-31 05:37:11'),(941,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:38:29','2025-10-31 05:38:29','2025-10-31 05:38:29'),(942,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:38:41','2025-10-31 05:38:41','2025-10-31 05:38:41'),(943,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:38:50','2025-10-31 05:38:50','2025-10-31 05:38:50'),(944,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:39:05','2025-10-31 05:39:05','2025-10-31 05:39:05'),(945,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:40:19','2025-10-31 05:40:19','2025-10-31 05:40:19'),(946,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:48:43','2025-10-31 05:48:43','2025-10-31 05:48:43'),(947,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:49:05','2025-10-31 05:49:05','2025-10-31 05:49:05'),(948,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:50:04','2025-10-31 05:50:04','2025-10-31 05:50:04'),(949,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:50:08','2025-10-31 05:50:08','2025-10-31 05:50:08'),(950,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:50:35','2025-10-31 05:50:35','2025-10-31 05:50:35'),(951,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:50:47','2025-10-31 05:50:47','2025-10-31 05:50:47'),(952,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:51:14','2025-10-31 05:51:14','2025-10-31 05:51:14'),(953,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:51:52','2025-10-31 05:51:52','2025-10-31 05:51:52'),(954,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:52:00','2025-10-31 05:52:00','2025-10-31 05:52:00'),(955,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:52:31','2025-10-31 05:52:31','2025-10-31 05:52:31'),(956,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:52:38','2025-10-31 05:52:38','2025-10-31 05:52:38'),(957,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:54:34','2025-10-31 05:54:34','2025-10-31 05:54:34'),(958,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:55:50','2025-10-31 05:55:50','2025-10-31 05:55:50'),(959,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:56:10','2025-10-31 05:56:10','2025-10-31 05:56:10'),(960,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:57:44','2025-10-31 05:57:44','2025-10-31 05:57:44'),(961,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 05:57:58','2025-10-31 05:57:58','2025-10-31 05:57:58'),(962,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:00:42','2025-10-31 06:00:42','2025-10-31 06:00:42'),(963,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:03:04','2025-10-31 06:03:04','2025-10-31 06:03:04'),(964,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:03:11','2025-10-31 06:03:11','2025-10-31 06:03:11'),(965,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:03:45','2025-10-31 06:03:45','2025-10-31 06:03:45'),(966,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:03:56','2025-10-31 06:03:56','2025-10-31 06:03:56'),(967,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:05:23','2025-10-31 06:05:23','2025-10-31 06:05:23'),(968,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:05:30','2025-10-31 06:05:30','2025-10-31 06:05:30'),(969,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:08:57','2025-10-31 06:08:57','2025-10-31 06:08:57'),(970,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:09:09','2025-10-31 06:09:09','2025-10-31 06:09:09'),(971,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:09:50','2025-10-31 06:09:50','2025-10-31 06:09:50'),(972,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:10:13','2025-10-31 06:10:13','2025-10-31 06:10:13'),(973,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:10:32','2025-10-31 06:10:32','2025-10-31 06:10:32'),(974,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:10:58','2025-10-31 06:10:58','2025-10-31 06:10:58'),(975,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:16:15','2025-10-31 06:16:15','2025-10-31 06:16:15'),(976,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:18:07','2025-10-31 06:18:07','2025-10-31 06:18:07'),(977,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:19:26','2025-10-31 06:19:26','2025-10-31 06:19:26'),(978,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 06:21:14','2025-10-31 06:21:14','2025-10-31 06:21:14'),(979,2037,8,'글 동기화: 10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요...','2025-10-31 11:37:33','2025-10-31 11:37:33','2025-10-31 11:37:33'),(980,2056,3,'나의 하루: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐먹지?...','2025-11-05 01:36:12','2025-11-05 01:36:12','2025-11-05 01:36:12'),(981,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 02:41:03','2025-11-05 02:41:03','2025-11-05 02:41:03'),(982,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 02:41:03','2025-11-05 02:41:03','2025-11-05 02:41:03'),(983,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:21:41','2025-11-05 05:21:41','2025-11-05 05:21:41'),(984,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:21:50','2025-11-05 05:21:50','2025-11-05 05:21:50'),(985,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:21:58','2025-11-05 05:21:58','2025-11-05 05:21:58'),(986,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:22:09','2025-11-05 05:22:09','2025-11-05 05:22:09'),(987,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:22:19','2025-11-05 05:22:19','2025-11-05 05:22:19'),(988,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:22:35','2025-11-05 05:22:35','2025-11-05 05:22:35'),(989,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:22:48','2025-11-05 05:22:48','2025-11-05 05:22:48'),(990,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:22:59','2025-11-05 05:22:59','2025-11-05 05:22:59'),(991,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:23:08','2025-11-05 05:23:08','2025-11-05 05:23:08'),(992,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:23:18','2025-11-05 05:23:18','2025-11-05 05:23:18'),(993,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:23:33','2025-11-05 05:23:33','2025-11-05 05:23:33'),(994,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:23:46','2025-11-05 05:23:46','2025-11-05 05:23:46'),(995,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:23:55','2025-11-05 05:23:55','2025-11-05 05:23:55'),(996,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:24:02','2025-11-05 05:24:02','2025-11-05 05:24:02'),(997,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:45:09','2025-11-05 05:45:09','2025-11-05 05:45:09'),(998,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:57:05','2025-11-05 05:57:05','2025-11-05 05:57:05'),(999,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:57:14','2025-11-05 05:57:14','2025-11-05 05:57:14'),(1000,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 05:57:44','2025-11-05 05:57:44','2025-11-05 05:57:44'),(1001,2056,3,'글 동기화: 오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐...','2025-11-05 07:37:24','2025-11-05 07:37:24','2025-11-05 07:37:24'),(1013,2037,10,'글 동기화: 메이플스토리 IP를 활용하여 친숙한 캐릭터와 세계관을 ...','2025-11-06 14:46:56','2025-11-06 14:46:56','2025-11-06 14:46:56'),(1014,2037,10,'글 동기화: 메이플스토리 IP를 활용하여 친숙한 캐릭터와 세계관을 ...','2025-11-06 14:46:59','2025-11-06 14:46:59','2025-11-06 14:46:59'),(1015,2037,2,'나의 하루: 윤 전 대통령은 지난 7월 재구속된 이후 넉 달 가까이 재판에 불출석했다. 하지만 곽종근 ...','2025-11-07 00:49:03','2025-11-07 00:49:03','2025-11-07 00:49:03'),(1016,2037,10,'글 동기화: 메이플스토리 IP를 활용하여 친숙한 캐릭터와 세계관을 ...','2025-11-07 00:49:40','2025-11-07 00:49:40','2025-11-07 00:49:40'),(1017,2037,4,'나의 하루: 고려대학교의 대규모 온라인 교양 과목에서 카카오톡 오픈채팅방을 통한 ‘집단 커닝’이 발생한...','2025-11-10 05:03:18','2025-11-10 05:03:18','2025-11-10 05:03:18'),(1018,2055,1,'나의 하루: 낙엽이 하나둘씩 고개를 떨구는 걸 보니 슬슬 가을을 보내줄 때가 다가오는 것 같습니다.\n\n...','2025-11-14 15:46:39','2025-11-14 15:46:39','2025-11-14 15:46:39'),(1019,2055,1,'나의 하루: 📸 이미지 선택 버튼 클릭됨 {isUploadingImage: false, isLoadi...','2025-11-16 12:48:22','2025-11-16 12:48:22','2025-11-16 12:48:22'),(1020,2055,14,'나의 하루: 더본코리아는 이번 공시에서 예산군청으로부터 액화석유가스의 안전관리 및 사업법 제44조 제1...','2025-11-17 04:58:57','2025-11-17 04:58:57','2025-11-17 04:58:57');
/*!40000 ALTER TABLE `emotion_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emotions`
--

DROP TABLE IF EXISTS `emotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emotions` (
  `emotion_id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `icon` varchar(50) NOT NULL,
  `color` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `temperature` int(11) DEFAULT 70 COMMENT '감정 온도 (0-100)',
  PRIMARY KEY (`emotion_id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `name_7` (`name`),
  UNIQUE KEY `name_8` (`name`),
  UNIQUE KEY `name_9` (`name`),
  UNIQUE KEY `name_10` (`name`),
  UNIQUE KEY `name_11` (`name`),
  UNIQUE KEY `name_12` (`name`),
  UNIQUE KEY `name_13` (`name`),
  UNIQUE KEY `name_14` (`name`),
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `name_16` (`name`),
  UNIQUE KEY `name_17` (`name`),
  UNIQUE KEY `name_18` (`name`),
  UNIQUE KEY `name_19` (`name`),
  UNIQUE KEY `name_20` (`name`),
  UNIQUE KEY `name_21` (`name`),
  UNIQUE KEY `name_22` (`name`),
  UNIQUE KEY `name_23` (`name`),
  UNIQUE KEY `name_24` (`name`),
  UNIQUE KEY `name_25` (`name`),
  UNIQUE KEY `name_26` (`name`),
  UNIQUE KEY `name_27` (`name`),
  UNIQUE KEY `name_28` (`name`),
  UNIQUE KEY `name_29` (`name`),
  UNIQUE KEY `name_30` (`name`),
  UNIQUE KEY `name_31` (`name`),
  UNIQUE KEY `name_32` (`name`),
  UNIQUE KEY `name_33` (`name`),
  UNIQUE KEY `name_34` (`name`),
  UNIQUE KEY `name_35` (`name`),
  UNIQUE KEY `name_36` (`name`),
  UNIQUE KEY `name_37` (`name`),
  UNIQUE KEY `name_38` (`name`),
  UNIQUE KEY `name_39` (`name`),
  UNIQUE KEY `name_40` (`name`),
  UNIQUE KEY `name_41` (`name`),
  UNIQUE KEY `name_42` (`name`),
  UNIQUE KEY `name_43` (`name`),
  UNIQUE KEY `name_44` (`name`),
  UNIQUE KEY `name_45` (`name`),
  UNIQUE KEY `name_46` (`name`),
  UNIQUE KEY `name_47` (`name`),
  UNIQUE KEY `name_48` (`name`),
  UNIQUE KEY `name_49` (`name`),
  UNIQUE KEY `name_50` (`name`),
  UNIQUE KEY `name_51` (`name`),
  UNIQUE KEY `name_52` (`name`),
  UNIQUE KEY `name_53` (`name`),
  UNIQUE KEY `name_54` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emotions`
--

LOCK TABLES `emotions` WRITE;
/*!40000 ALTER TABLE `emotions` DISABLE KEYS */;
INSERT INTO `emotions` VALUES (1,'기쁨이','😊','#FFD700','2025-08-18 07:44:41','2025-11-18 07:15:59',38),(2,'행복이','😄','#FFA500','2025-08-18 07:44:41','2025-11-18 07:15:59',38),(3,'슬픔이','😢','#4682B4','2025-08-18 07:44:41','2025-11-18 07:15:59',34),(4,'우울이','😞','#708090','2025-08-18 07:44:41','2025-11-18 07:15:59',34),(5,'지루미','😑','#A9A9A9','2025-08-18 07:44:41','2025-11-18 07:15:59',35),(6,'버럭이','😠','#FF4500','2025-08-18 07:44:41','2025-11-18 07:15:59',40),(7,'불안이','😰','#DDA0DD','2025-08-18 07:44:41','2025-11-18 07:15:59',36),(8,'걱정이','😟','#FFA07A','2025-08-18 07:44:41','2025-11-18 07:15:59',36),(9,'감동이','🥺','#FF6347','2025-08-18 07:44:41','2025-11-18 07:15:59',38),(10,'황당이','🤨','#20B2AA','2025-08-18 07:44:41','2025-11-18 07:15:59',38),(11,'당황이','😲','#FF8C00','2025-08-18 07:44:41','2025-11-18 07:15:59',36),(12,'짜증이','😤','#DC143C','2025-08-18 07:44:41','2025-11-18 07:15:59',39),(13,'무섭이','😨','#9370DB','2025-08-18 07:44:41','2025-11-18 07:15:59',35),(14,'추억이','🥰','#87CEEB','2025-08-18 07:44:41','2025-11-18 07:15:59',37),(15,'설렘이','🤗','#FF69B4','2025-08-18 07:44:41','2025-11-18 07:15:59',38),(16,'편안이','😌','#98FB98','2025-08-18 07:44:41','2025-11-18 07:15:59',36),(17,'궁금이','🤔','#DAA520','2025-08-18 07:44:41','2025-11-18 07:15:59',37),(18,'사랑이','❤️','#E91E63','2025-08-19 00:59:27','2025-11-18 07:15:59',39),(19,'아픔이','🤕','#8B4513','2025-08-19 00:59:27','2025-11-18 07:15:59',34),(20,'욕심이','🤑','#32CD32','2025-08-19 00:59:27','2025-11-18 07:15:59',39);
/*!40000 ALTER TABLE `emotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encouragement_daily_limits`
--

DROP TABLE IF EXISTS `encouragement_daily_limits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encouragement_daily_limits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '蹂대궦 ?ъ슜?? (?듬챸?댁??留? ?쒗븳?? ?꾪빐 異붿쟻)',
  `sent_date` date NOT NULL,
  `count` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date` (`user_id`,`sent_date`),
  UNIQUE KEY `encouragement_daily_limits_user_id_sent_date` (`user_id`,`sent_date`),
  KEY `idx_user_date` (`user_id`,`sent_date`),
  CONSTRAINT `encouragement_daily_limits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='?섎（ 3媛? ?쒗븳?? ?꾪븳 異붿쟻 (?듬챸?깆?? 蹂댁옣??)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encouragement_daily_limits`
--

LOCK TABLES `encouragement_daily_limits` WRITE;
/*!40000 ALTER TABLE `encouragement_daily_limits` DISABLE KEYS */;
INSERT INTO `encouragement_daily_limits` VALUES (1,2037,'2025-10-13',1),(2,2052,'2025-10-14',3),(3,2037,'2025-10-14',1),(4,2037,'2025-10-16',1),(5,2052,'2025-10-16',1),(6,2037,'2025-11-12',3);
/*!40000 ALTER TABLE `encouragement_daily_limits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encouragement_messages`
--

DROP TABLE IF EXISTS `encouragement_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encouragement_messages` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`message_id`),
  KEY `encouragement_messages_sender_id` (`sender_id`),
  KEY `encouragement_messages_receiver_id` (`receiver_id`),
  KEY `encouragement_messages_post_id` (`post_id`),
  KEY `encouragement_messages_created_at` (`created_at`),
  CONSTRAINT `encouragement_messages_ibfk_199` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `encouragement_messages_ibfk_200` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `encouragement_messages_ibfk_201` FOREIGN KEY (`post_id`) REFERENCES `someone_day_posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encouragement_messages`
--

LOCK TABLES `encouragement_messages` WRITE;
/*!40000 ALTER TABLE `encouragement_messages` DISABLE KEYS */;
INSERT INTO `encouragement_messages` VALUES (8,2049,2037,308,'힘내세요! 당신은 멋진 사람입니다. (익명)',1,'2025-10-14 02:58:59'),(9,2049,2037,308,'응원합니다! 함께 힘내요!',0,'2025-10-14 02:58:59');
/*!40000 ALTER TABLE `encouragement_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `glimmering_moments`
--

DROP TABLE IF EXISTS `glimmering_moments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `glimmering_moments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `content` varchar(200) NOT NULL COMMENT '빛나는 순간 내용',
  `emoji` varchar(10) DEFAULT NULL COMMENT '이모지',
  `category` varchar(50) DEFAULT NULL COMMENT '카테고리 (예: 일상, 관계, 성취)',
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '태그 배열' CHECK (json_valid(`tags`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at`),
  KEY `idx_glimmering_user_date` (`user_id`,`created_at`),
  CONSTRAINT `glimmering_moments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='빛나는 순간 - 작은 행복 기록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `glimmering_moments`
--

LOCK TABLES `glimmering_moments` WRITE;
/*!40000 ALTER TABLE `glimmering_moments` DISABLE KEYS */;
INSERT INTO `glimmering_moments` VALUES (1,2055,'ㄹㅎㄴㅇㄹㅎㄴㅇ','🍀',NULL,NULL,'2025-11-18 04:09:52'),(2,2055,'ㄴㄴㄴ','💝',NULL,NULL,'2025-11-18 05:45:58');
/*!40000 ALTER TABLE `glimmering_moments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_comfort_sessions`
--

DROP TABLE IF EXISTS `live_comfort_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `live_comfort_sessions` (
  `session_id` varchar(100) NOT NULL,
  `emotion_tag` varchar(50) NOT NULL,
  `current_users` int(11) DEFAULT 0,
  `max_users` int(11) DEFAULT 10,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `status` enum('waiting','active','ended') DEFAULT 'waiting',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`session_id`),
  KEY `idx_status` (`status`),
  KEY `idx_emotion_tag` (`emotion_tag`),
  KEY `idx_end_time` (`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_comfort_sessions`
--

LOCK TABLES `live_comfort_sessions` WRITE;
/*!40000 ALTER TABLE `live_comfort_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `live_comfort_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_session_messages`
--

DROP TABLE IF EXISTS `live_session_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `live_session_messages` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message_type` enum('emotion','comfort','reaction') NOT NULL,
  `message_content` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`message_id`),
  KEY `idx_session_time` (`session_id`,`created_at`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_session_messages`
--

LOCK TABLES `live_session_messages` WRITE;
/*!40000 ALTER TABLE `live_session_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `live_session_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_session_participants`
--

DROP TABLE IF EXISTS `live_session_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `live_session_participants` (
  `participant_id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `left_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`participant_id`),
  KEY `idx_session_user` (`session_id`,`user_id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_session_participants`
--

LOCK TABLES `live_session_participants` WRITE;
/*!40000 ALTER TABLE `live_session_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `live_session_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `my_day_comment_likes`
--

DROP TABLE IF EXISTS `my_day_comment_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `my_day_comment_likes` (
  `like_id` int(11) NOT NULL AUTO_INCREMENT,
  `comment_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`like_id`),
  UNIQUE KEY `my_day_comment_likes_comment_id_user_id` (`comment_id`,`user_id`),
  KEY `my_day_comment_likes_user_id` (`user_id`),
  KEY `my_day_comment_likes_created_at` (`created_at`),
  CONSTRAINT `my_day_comment_likes_ibfk_159` FOREIGN KEY (`comment_id`) REFERENCES `my_day_comments` (`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `my_day_comment_likes_ibfk_160` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `my_day_comment_likes`
--

LOCK TABLES `my_day_comment_likes` WRITE;
/*!40000 ALTER TABLE `my_day_comment_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `my_day_comment_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `my_day_comment_reports`
--

DROP TABLE IF EXISTS `my_day_comment_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `my_day_comment_reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `comment_id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `report_type` enum('spam','inappropriate','harassment','other','content') NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`report_id`),
  UNIQUE KEY `my_day_comment_reports_comment_id_reporter_id` (`comment_id`,`reporter_id`),
  KEY `my_day_comment_reports_comment_id` (`comment_id`),
  KEY `my_day_comment_reports_reporter_id` (`reporter_id`),
  KEY `my_day_comment_reports_status` (`status`),
  KEY `my_day_comment_reports_created_at` (`created_at`),
  CONSTRAINT `my_day_comment_reports_ibfk_157` FOREIGN KEY (`comment_id`) REFERENCES `my_day_comments` (`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `my_day_comment_reports_ibfk_158` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `my_day_comment_reports`
--

LOCK TABLES `my_day_comment_reports` WRITE;
/*!40000 ALTER TABLE `my_day_comment_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `my_day_comment_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `my_day_comments`
--

DROP TABLE IF EXISTS `my_day_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `my_day_comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `parent_comment_id` int(11) DEFAULT NULL,
  `content` varchar(500) NOT NULL,
  `is_anonymous` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `my_day_comments_post_id` (`post_id`),
  KEY `my_day_comments_user_id` (`user_id`),
  KEY `parent_comment_id` (`parent_comment_id`),
  CONSTRAINT `my_day_comments_ibfk_238` FOREIGN KEY (`post_id`) REFERENCES `my_day_posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `my_day_comments_ibfk_239` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `my_day_comments_ibfk_240` FOREIGN KEY (`parent_comment_id`) REFERENCES `my_day_comments` (`comment_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=354 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `my_day_comments`
--

LOCK TABLES `my_day_comments` WRITE;
/*!40000 ALTER TABLE `my_day_comments` DISABLE KEYS */;
INSERT INTO `my_day_comments` VALUES (300,392,2037,NULL,'ggggg',0,'2025-09-21 13:35:46','2025-09-21 13:35:46'),(302,398,2037,NULL,'ㅌㅌㅌㅌㅌ',0,'2025-09-30 07:39:29','2025-09-30 07:39:29'),(303,398,2037,302,'@울트라[302] ㅗㅓㅓㅏㅓㅓㅓ',0,'2025-09-30 07:39:37','2025-09-30 07:39:37'),(304,402,2037,NULL,'ㅎㅇㄹㅎㅇ',0,'2025-09-30 07:44:13','2025-09-30 07:44:13'),(305,402,2037,304,'@울트라[304] ㄹㄹㄹㄹ',0,'2025-09-30 07:44:18','2025-09-30 07:44:18'),(306,402,2037,NULL,'안녕하세요 반가워요',0,'2025-09-30 08:04:09','2025-09-30 08:04:09'),(316,404,2037,NULL,'ffff',0,'2025-10-09 14:25:45','2025-10-09 14:25:45'),(317,404,2037,NULL,'이 글을 읽고 많은 위로를 받았어요. 함께 힘내봐요!',0,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(318,404,2037,NULL,'저도 비슷한 경험이 있어요. 시간이 지나면 나아질 거예요.',1,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(319,404,2037,317,'댓글 감사합니다! 덕분에 힘이 나네요 :)',0,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(320,404,2037,317,'저도 응원합니다! 화이팅!',1,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(321,404,2037,318,'맞아요, 저도 그렇게 생각해요.',0,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(322,406,2050,NULL,'좋은 글이네요! 응원합니다 😊',0,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(323,408,2050,NULL,'좋은 글이네요! 응원합니다 😊',0,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(324,410,2049,NULL,'좋은 글이네요! 응원합니다 😊',0,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(325,412,2049,NULL,'좋은 글이네요! 응원합니다 😊',0,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(326,414,2049,NULL,'좋은 글이네요! 응원합니다 😊',0,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(327,416,2049,NULL,'좋은 글이네요! 응원합니다 😊',0,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(328,418,2049,NULL,'좋은 글이네요! 응원합니다 😊',0,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(332,404,2052,NULL,'안녕하세요 반갑습니다.',0,'2025-10-14 08:58:01','2025-10-14 08:58:01'),(333,402,2052,NULL,'10월 14일 댓글 테스트야.ㅎㅎ',0,'2025-10-14 13:06:58','2025-10-14 13:06:58'),(334,402,2037,NULL,'dkssudgktpdyfggg',0,'2025-10-14 14:04:55','2025-10-14 14:04:55'),(335,404,2037,317,'답글 테스트입니다.',1,'2025-10-16 14:47:14','2025-10-16 14:47:14'),(336,420,2052,NULL,'안녕하세요 반갑습니다.',0,'2025-10-16 14:48:27','2025-10-16 14:48:27'),(337,420,2052,336,'@test2[336] 답글 테스트입니다.',0,'2025-10-16 14:48:41','2025-10-16 14:48:41'),(338,421,2037,NULL,'ddsgdesgsdgddkdks',1,'2025-10-31 13:11:02','2025-10-31 13:11:02'),(339,426,2037,NULL,'it',0,'2025-11-10 06:27:10','2025-11-10 06:27:10'),(340,426,2037,NULL,'kkkk',0,'2025-11-10 06:27:14','2025-11-10 06:27:14'),(341,426,2037,NULL,'kkkkk',0,'2025-11-10 06:27:17','2025-11-10 06:27:17'),(342,426,2037,NULL,'kkklllll',0,'2025-11-10 06:27:21','2025-11-10 06:27:21'),(343,426,2037,NULL,'jjhkjhkhhh',0,'2025-11-13 04:01:07','2025-11-13 04:01:07'),(344,426,2037,NULL,'tttttttttt',0,'2025-11-13 04:01:17','2025-11-13 04:01:17'),(345,426,2037,NULL,'gfgdfgdfgfddfdfgdf',0,'2025-11-13 04:01:50','2025-11-13 04:01:50'),(346,426,2055,NULL,'ㅓㅏㅑㅓㅏㅛㅑㅛㅑㅛㅑㅐㅛㅐㅑㅛ',0,'2025-11-14 16:30:00','2025-11-14 16:30:00'),(347,427,2055,NULL,'ㅊㅌㅊㅎㅍㅌㅊㅍ',0,'2025-11-15 06:42:48','2025-11-15 06:42:48'),(348,425,2055,NULL,'ㅠㅌ츛퓿퓨',0,'2025-11-16 11:57:27','2025-11-16 11:57:27'),(349,425,2055,348,'@키펜무브[348] ㅗㅓ호ㅓ호ㅓ호',0,'2025-11-16 11:57:32','2025-11-16 11:57:32'),(350,427,2055,347,'@키펜무브[347] ㅊㅍㄹㅍㅎㅎㅎ',0,'2025-11-16 12:08:38','2025-11-16 12:08:38'),(351,427,2055,350,'@키펜무브[350] ㅗ로로',0,'2025-11-16 12:13:00','2025-11-16 12:13:00'),(352,427,2055,NULL,'푸ㅡ푸ㅡ푸ㅠ',0,'2025-11-16 12:15:03','2025-11-16 12:15:03'),(353,427,2055,347,'@키펜무브[347] ㄹㄹㄹㄹㄹ',0,'2025-11-16 12:15:08','2025-11-16 12:15:08');
/*!40000 ALTER TABLE `my_day_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `my_day_emotions`
--

DROP TABLE IF EXISTS `my_day_emotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `my_day_emotions` (
  `post_id` int(11) NOT NULL,
  `emotion_id` tinyint(3) unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`post_id`,`emotion_id`),
  UNIQUE KEY `my_day_emotions_post_id_emotion_id_unique` (`post_id`,`emotion_id`),
  KEY `my_day_emotions_post_id` (`post_id`),
  KEY `my_day_emotions_emotion_id` (`emotion_id`),
  CONSTRAINT `my_day_emotions_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `my_day_posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `my_day_emotions_ibfk_2` FOREIGN KEY (`emotion_id`) REFERENCES `emotions` (`emotion_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `my_day_emotions`
--

LOCK TABLES `my_day_emotions` WRITE;
/*!40000 ALTER TABLE `my_day_emotions` DISABLE KEYS */;
INSERT INTO `my_day_emotions` VALUES (389,8,'2025-09-06 14:56:42','2025-09-06 14:56:42'),(390,9,'2025-09-06 14:09:33','2025-09-06 14:09:33'),(392,6,'2025-09-06 15:35:11','2025-09-06 15:35:11'),(398,2,'2025-10-10 13:07:06','2025-10-10 13:07:06'),(400,2,'2025-09-25 13:39:51','2025-09-25 13:39:51'),(401,3,'2025-09-26 01:15:02','2025-09-26 01:15:02'),(402,14,'2025-10-01 14:00:26','2025-10-01 14:00:26'),(404,3,'2025-10-09 14:25:32','2025-10-09 14:25:32'),(405,1,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(406,2,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(407,3,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(408,4,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(409,1,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(410,1,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(411,2,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(412,3,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(413,4,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(414,1,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(415,1,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(416,2,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(417,3,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(418,4,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(419,1,'2025-10-13 04:17:04','2025-10-13 04:17:04'),(420,7,'2025-10-29 13:09:48','2025-10-29 13:09:48'),(421,1,'2025-10-31 13:11:41','2025-10-31 13:11:41'),(423,3,'2025-11-05 01:36:12','2025-11-05 01:36:12'),(424,10,'2025-11-06 14:27:17','2025-11-06 14:27:17'),(425,2,'2025-11-07 00:49:03','2025-11-07 00:49:03'),(426,4,'2025-11-10 05:03:18','2025-11-10 05:03:18'),(427,1,'2025-11-15 06:42:40','2025-11-15 06:42:40'),(428,3,'2025-11-17 04:19:44','2025-11-17 04:19:44'),(429,14,'2025-11-17 04:58:57','2025-11-17 04:58:57');
/*!40000 ALTER TABLE `my_day_emotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `my_day_likes`
--

DROP TABLE IF EXISTS `my_day_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `my_day_likes` (
  `user_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`user_id`,`post_id`),
  KEY `my_day_likes_post_id` (`post_id`),
  KEY `my_day_likes_user_id` (`user_id`),
  CONSTRAINT `my_day_likes_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `my_day_posts` (`post_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `my_day_likes_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `my_day_likes`
--

LOCK TABLES `my_day_likes` WRITE;
/*!40000 ALTER TABLE `my_day_likes` DISABLE KEYS */;
INSERT INTO `my_day_likes` VALUES (2037,392,'2025-09-21 13:36:05','2025-09-21 13:36:05'),(2037,398,'2025-09-25 02:44:55','2025-09-25 02:44:55'),(2037,426,'2025-11-12 14:26:44','2025-11-12 14:26:44');
/*!40000 ALTER TABLE `my_day_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `my_day_post_reports`
--

DROP TABLE IF EXISTS `my_day_post_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `my_day_post_reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `report_type` enum('spam','inappropriate','harassment','other','content') NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`report_id`),
  UNIQUE KEY `my_day_post_reports_post_id_reporter_id` (`post_id`,`reporter_id`),
  KEY `my_day_post_reports_post_id` (`post_id`),
  KEY `my_day_post_reports_reporter_id` (`reporter_id`),
  KEY `my_day_post_reports_status` (`status`),
  KEY `my_day_post_reports_created_at` (`created_at`),
  CONSTRAINT `my_day_post_reports_ibfk_157` FOREIGN KEY (`post_id`) REFERENCES `my_day_posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `my_day_post_reports_ibfk_158` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `my_day_post_reports`
--

LOCK TABLES `my_day_post_reports` WRITE;
/*!40000 ALTER TABLE `my_day_post_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `my_day_post_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `my_day_posts`
--

DROP TABLE IF EXISTS `my_day_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `my_day_posts` (
  `post_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `emotion_summary` varchar(100) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `character_count` smallint(5) unsigned DEFAULT NULL,
  `like_count` int(11) NOT NULL DEFAULT 0,
  `comment_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `reaction_count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`post_id`),
  KEY `user_id` (`user_id`),
  KEY `my_day_posts_user_id` (`user_id`),
  KEY `my_day_posts_created_at` (`created_at`),
  KEY `idx_my_day_visibility` (`created_at`),
  KEY `my_day_posts_user_id_created_at` (`user_id`,`created_at`),
  KEY `my_day_posts_is_anonymous` (`is_anonymous`),
  CONSTRAINT `my_day_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=430 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `my_day_posts`
--

LOCK TABLES `my_day_posts` WRITE;
/*!40000 ALTER TABLE `my_day_posts` DISABLE KEYS */;
INSERT INTO `my_day_posts` VALUES (389,2037,'가끔은 혼자만의 시간이 필요해요. 오늘은 카페에서 책을 읽으며 여유로운 시간을 보냈습니다.','평온,여유,사색','/api/uploads/images/image_2037_1757170597665_0.jpg',0,50,0,0,'2025-09-06 13:43:46','2025-09-06 14:56:42',0),(390,2037,'친구들과 함께 맛있는 저녁을 먹었어요. 이런 소소한 행복이 정말 소중하다고 느꼈습니다.','행복,감사,만족','/api/uploads/images/image_2037_1757167769575_0.jpg',0,48,0,0,'2025-09-06 13:43:46','2025-09-06 14:09:33',0),(392,2037,'ㅇㄴㅇㅎㅇㄴㅇㄴㅇㅎㅎㅇㄴㅎㄴㅇㅎㄴㅎㄴㅇ',NULL,'/api/uploads/images/image_2037_1757171721370_0.jpg',1,21,1,1,'2025-09-06 15:15:23','2025-09-21 13:36:05',0),(398,2037,'9월24일 나의 하루 공유하기 테스트입니다.',NULL,'[\"http://10.0.2.2:3001/api/uploads/images/image_2037_1758690919353_0.jpg\",\"http://10.0.2.2:3001/api/uploads/images/image_2037_1759292447375_0.jpg\",\"http://10.0.2.2:3001/api/uploads/images/image_2037_1759292453759_0.jpg\"]',0,24,1,2,'2025-09-24 05:15:22','2025-10-03 13:48:10',0),(400,2037,'9월25일 나의 하루 공유하기 테스트입니.',NULL,'http://10.0.2.2:3001/api/uploads/images/image_2037_1758803491848_0.jpg',0,23,0,0,'2025-09-25 12:31:33','2025-09-30 07:16:32',0),(401,2037,'9월26일 시작합니다 안녕하세요 좋은하루 입니다.',NULL,'/api/uploads/images/image_2037_1758849299126_0.jpg',0,27,0,0,'2025-09-26 01:15:02','2025-09-26 01:15:02',0),(402,2037,'9월 30일 나위 하루 작성 테스트입니다. 안녕하세요 반갑습니다\n오늘은 무슨요일인가죠?',NULL,'[\"http://10.0.2.2:3001/api/uploads/images/image_2037_1759210598911_0.jpg\",\"http://10.0.2.2:3001/api/uploads/images/image_2037_1759286615896_0.jpg\",\"http://10.0.2.2:3001/api/uploads/images/image_2037_1759286621424_0.jpg\"]',1,48,0,5,'2025-09-30 05:36:41','2025-10-14 14:57:52',0),(404,2037,'● 완벽합니다! 백엔드 서버가 성공적으로 시작되었습니다:\n  서버가 3001번 포트에서 실행중입니다.\n\n  이제 정리하고 사용자에게 안내하겠습니다:',NULL,'[\"http://10.0.2.2:3001/api/uploads/images/image_2037_1759370198909_0.jpg\"]',0,82,0,8,'2025-10-02 01:56:47','2025-10-16 14:47:14',0),(405,2049,'[행복한하루] 오늘 날씨가 정말 좋았어요! 공원에서 산책하면서 기분이 너무 좋아졌습니다. 😊',NULL,NULL,0,NULL,6,0,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(406,2049,'[행복한하루] 요즘 일이 너무 많아서 힘들어요. 하지만 곧 좋은 일이 있을 거라 믿어요!',NULL,NULL,0,NULL,5,1,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(407,2049,'[행복한하루] 친구들과 맛있는 저녁을 먹었어요. 행복한 시간이었습니다! 🍕',NULL,NULL,0,NULL,1,0,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(408,2049,'[행복한하루] 새로운 취미를 시작했어요! 기타 배우는 중인데 재미있네요.',NULL,NULL,0,NULL,3,1,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(409,2049,'[행복한하루] 오늘 하루도 수고 많으셨어요. 내일은 더 좋은 일이 있을 거예요!',NULL,NULL,0,NULL,8,0,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(410,2050,'[슬픈고양이] 오늘 날씨가 정말 좋았어요! 공원에서 산책하면서 기분이 너무 좋아졌습니다. 😊',NULL,NULL,0,NULL,1,1,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(411,2050,'[슬픈고양이] 요즘 일이 너무 많아서 힘들어요. 하지만 곧 좋은 일이 있을 거라 믿어요!',NULL,NULL,0,NULL,1,0,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(412,2050,'[슬픈고양이] 친구들과 맛있는 저녁을 먹었어요. 행복한 시간이었습니다! 🍕',NULL,NULL,0,NULL,1,1,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(413,2050,'[슬픈고양이] 새로운 취미를 시작했어요! 기타 배우는 중인데 재미있네요.',NULL,NULL,0,NULL,2,0,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(414,2050,'[슬픈고양이] 오늘 하루도 수고 많으셨어요. 내일은 더 좋은 일이 있을 거예요!',NULL,NULL,0,NULL,7,1,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(415,2051,'[즐거운친구] 오늘 날씨가 정말 좋았어요! 공원에서 산책하면서 기분이 너무 좋아졌습니다. 😊',NULL,NULL,0,NULL,5,0,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(416,2051,'[즐거운친구] 요즘 일이 너무 많아서 힘들어요. 하지만 곧 좋은 일이 있을 거라 믿어요!',NULL,NULL,0,NULL,0,1,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(417,2051,'[즐거운친구] 친구들과 맛있는 저녁을 먹었어요. 행복한 시간이었습니다! 🍕',NULL,NULL,0,NULL,1,0,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(418,2051,'[즐거운친구] 새로운 취미를 시작했어요! 기타 배우는 중인데 재미있네요.',NULL,NULL,0,NULL,8,1,'2025-10-13 04:17:04','2025-10-13 04:17:04',0),(419,2051,'[즐거운친구] 오늘 하루도 수고 많으셨어요. 내일은 더 좋은 일이 있을 거예요!',NULL,NULL,0,NULL,9,0,'2025-10-13 04:17:04','2025-10-13 04:40:44',0),(420,2037,'10월16일 목요일입니다 안녕하세요 날씨 흐림이에요',NULL,'[\"http://10.0.2.2:3001/api/uploads/images/image_2037_1760596874809_0.jpg\"]',0,28,0,2,'2025-10-16 06:41:22','2025-10-29 13:09:48',0),(421,2037,'10월 24일 홈화면 테스트입니다. 안녕하세요 반가워요\n오늘은 금요일이에요',NULL,'[\"http://192.168.219.51:3001/api/uploads/images/image_2037_1761273692403_0.jpg\"]',1,41,0,1,'2025-10-24 02:41:41','2025-10-31 13:11:41',0),(423,2056,'오늘은 11월 5일입니다 안녕하세요 반가워요. 점심 뭐먹지?',NULL,'[\"/api/uploads/images/image_2056_1762306562548_0.jpg\",\"/api/uploads/images/image_2056_1762306568398_0.jpg\"]',0,33,0,0,'2025-11-05 01:36:12','2025-11-05 01:36:12',0),(424,2037,'메이플스토리 IP를 활용하여 친숙한 캐릭터와 세계관을 선사하며, 자동 성장 요소에 원작 고유한 시스템을 더해 쉽고 편한 메이플스토리 재미를 추구한다.',NULL,'[\"/api/uploads/images/image_2037_1762439222247_0.jpg\",\"/api/uploads/images/image_2037_1762439232970_0.jpg\"]',0,83,0,0,'2025-11-06 14:27:17','2025-11-06 14:27:17',0),(425,2037,'윤 전 대통령은 지난 7월 재구속된 이후 넉 달 가까이 재판에 불출석했다. 하지만 곽종근 전 육군 특수전사령관과 김성훈 전 대통령경호처 차장 등 핵심 증인이 잇따라 나오자 법정에서 직접 발언하며 방어권을 행사하고 있다.\n지난달 31일엔 특검팀이 \"당시 영부인이던 김건희\"라고 말하자, 윤 전 대통령이 \"아무리 그만두고 나왔다고 해도 김건희가 뭐냐. 뒤에 여사를 붙이든지 해야지\"라고 불만을 드러내기도 했다.\n김 여사의 경우 지난 9월 첫 공판 이후 한 차례도 빠지지 않고 재판에 나오는 중이다.',NULL,'[\"/api/uploads/images/image_2037_1762476519349_0.jpg\",\"/api/uploads/images/image_2037_1762476530045_0.jpg\",\"/api/uploads/images/image_2037_1762476538643_0.jpg\"]',0,276,0,2,'2025-11-07 00:49:03','2025-11-16 11:57:32',0),(426,2037,'고려대학교의 대규모 온라인 교양 과목에서 카카오톡 오픈채팅방을 통한 ‘집단 커닝’이 발생한 사실이 포착됐다. 연세대에서 생성형 인공지능(AI)을 활용한 중간고사 부정행위가 적발된 데 이어 고려대에서도 유사한 사태가 일어나면서 대학가의 비대면 강의·시험에 대한 경각심 강화가 필요하다는 지적이 나온다.',NULL,'[\"/api/uploads/images/image_2037_1762750977056_0.jpg\",\"/api/uploads/images/image_2037_1762750985950_0.jpg\",\"/api/uploads/images/image_2037_1762750995139_0.jpg\"]',0,167,1,8,'2025-11-10 05:03:18','2025-11-14 16:30:00',0),(427,2055,'낙엽이 하나둘씩 고개를 떨구는 걸 보니 슬슬 가을을 보내줄 때가 다가오는 것 같습니다.\n\n현재 서울 기온은 15도 안팎까지 올라, 예년 기온을 3도가량 웃돌고 있는데요, 주말인 내일까지는 일교차 큰 전형적인 늦가을 날씨가 이어지면서 나들이하기 좋겠습니다.\n\n가족, 친구, 연인과 함께 막바지 가을을 만끽해보시기 바랍니다.',NULL,'[\"http://192.168.219.51:3001/api/uploads/images/image_2055_1763135185406_0_full.webp\",\"http://192.168.219.51:3001/api/uploads/images/image_2055_1763135196031_0_full.webp\"]',0,179,0,5,'2025-11-14 15:46:39','2025-11-16 12:15:08',0),(428,2055,'📸 이미지 선택 버튼 클릭됨 {isUploadingImage: false, isLoading: false, selectedImagesCount: 0, uploadedImageUrlsCount: 0}\nWriteMyDayScreen.tsx:664 🚀 이미지 선택 모달 열기',NULL,'[\"http://192.168.219.51:3001/api/uploads/images/image_2055_1763297275351_0_full.webp\",\"http://192.168.219.51:3001/api/uploads/images/image_2055_1763297285101_0_full.webp\"]',1,152,0,0,'2025-11-16 12:48:22','2025-11-17 04:19:44',0),(429,2055,'더본코리아는 이번 공시에서 예산군청으로부터 액화석유가스의 안전관리 및 사업법 제44조 제1항 및 동법 시행규칙 제69조 위반으로 지난 2월 19일 과태료 80만원을, 강남구청으로부터 액화석유가스의 안전관리 및 사업법 제73조 위반으로 지난 4월 10일 과태료 40만원을 부과받았다고 했다.',NULL,'[\"/api/uploads/images/image_2055_1763355524723_0_full.webp\",\"/api/uploads/images/image_2055_1763355534519_0_full.webp\"]',0,161,0,0,'2025-11-17 04:58:57','2025-11-17 04:58:57',0);
/*!40000 ALTER TABLE `my_day_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `my_day_reactions`
--

DROP TABLE IF EXISTS `my_day_reactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `my_day_reactions` (
  `reaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reaction_type_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`reaction_id`),
  UNIQUE KEY `unique_user_post_reaction` (`post_id`,`user_id`,`reaction_type_id`),
  UNIQUE KEY `my_day_reactions_post_id_user_id_reaction_type_id` (`post_id`,`user_id`,`reaction_type_id`),
  KEY `idx_post` (`post_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_reaction_type` (`reaction_type_id`),
  CONSTRAINT `my_day_reactions_ibfk_187` FOREIGN KEY (`post_id`) REFERENCES `my_day_posts` (`post_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `my_day_reactions_ibfk_188` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `my_day_reactions_ibfk_189` FOREIGN KEY (`reaction_type_id`) REFERENCES `reaction_types` (`reaction_type_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='My Day 寃뚯떆臾? 由ъ븸??';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `my_day_reactions`
--

LOCK TABLES `my_day_reactions` WRITE;
/*!40000 ALTER TABLE `my_day_reactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `my_day_reactions` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`Iexist`@`localhost`*/ /*!50003 TRIGGER after_my_day_reaction_insert
AFTER INSERT ON my_day_reactions
FOR EACH ROW
BEGIN
  UPDATE my_day_posts
  SET reaction_count = reaction_count + 1
  WHERE post_id = NEW.post_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`Iexist`@`localhost`*/ /*!50003 TRIGGER after_my_day_reaction_delete
AFTER DELETE ON my_day_reactions
FOR EACH ROW
BEGIN
  UPDATE my_day_posts
  SET reaction_count = reaction_count - 1
  WHERE post_id = OLD.post_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '?뚮┝?? 諛쏆쓣 ?ъ슜?? ID',
  `notification_type` enum('encouragement','comment','reply','reaction','challenge') NOT NULL,
  `related_id` int(11) DEFAULT NULL,
  `post_id` int(11) DEFAULT NULL,
  `post_type` varchar(50) DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL COMMENT '諛쒖떊?? ID (?듬챸?? 寃쎌슦 NULL)',
  `sender_nickname` varchar(100) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_notification_type` (`notification_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_read` (`user_id`,`is_read`,`created_at`),
  KEY `notifications_user_id_is_read_created_at` (`user_id`,`is_read`,`created_at`),
  KEY `notifications_notification_type` (`notification_type`),
  KEY `sender_id` (`sender_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='?듯빀 ?뚮┝ ?뚯씠釉? - 寃⑸젮硫붿떆吏?, ?볤??, ?듦??, 由ъ븸?? ??';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2037,'encouragement',NULL,NULL,NULL,NULL,NULL,'테스트 격려 메시지','이것은 테스트 알림입니다. 알림 시스템이 작동하는지 확인하세요!',1,NULL,'2025-10-14 02:44:10'),(2,2037,'encouragement',8,308,'someone-day',NULL,NULL,'새로운 격려 메시지','회원님의 게시물에 새로운 격려 메시지가 도착했습니다. 💝',1,NULL,'2025-10-14 02:58:59'),(3,2037,'encouragement',9,308,'someone-day',2049,'행복한하루','행복한하루님이 격려 메시지를 보냈습니다','회원님의 게시물에 새로운 격려 메시지가 도착했습니다. 💝',1,NULL,'2025-10-14 02:58:59'),(4,2037,'comment',332,404,'my-day',2052,'test2','test2님이 댓글을 작성했습니다','회원님의 게시물에 새로운 댓글이 작성되었습니다. 💬',1,NULL,'2025-10-14 08:58:01'),(5,2037,'comment',333,402,'my-day',2052,'test2','test2님이 댓글을 작성했습니다','회원님의 게시물에 새로운 댓글이 작성되었습니다. 💬',1,NULL,'2025-10-14 13:06:58'),(6,2037,'reply',293,309,'someone-day',2052,'test2','test2님이 답글을 작성했습니다','회원님의 게시물에 새로운 답글이 작성되었습니다. 💬',1,NULL,'2025-10-16 07:08:27'),(7,2037,'comment',336,420,'my-day',2052,'test2','test2님이 댓글을 작성했습니다','회원님의 게시물에 새로운 댓글이 작성되었습니다. 💬',1,NULL,'2025-10-16 14:48:27'),(8,2037,'reply',337,420,'my-day',2052,'test2','test2님이 답글을 작성했습니다','회원님의 게시물에 새로운 답글이 작성되었습니다. 💬',1,NULL,'2025-10-16 14:48:41'),(9,2037,'comment',18,41,'challenge',2052,'test2','test2님이 챌린지에 댓글을 작성했습니다','회원님의 챌린지에 새로운 댓글이 작성되었습니다. 💬',1,NULL,'2025-10-19 14:00:21'),(10,2052,'reaction',311,311,'comfort-wall',2037,'울트라 키펜','울트라 키펜님이 공감했습니다','회원님의 게시물에 새로운 좋아요가 추가되었습니다.',0,NULL,'2025-10-24 14:37:24'),(11,2052,'reaction',310,310,'comfort-wall',2037,'울트라 키펜','울트라 키펜님이 공감했습니다','회원님의 게시물에 새로운 좋아요가 추가되었습니다.',0,NULL,'2025-10-24 15:30:00'),(12,2052,'reaction',310,310,'comfort-wall',2037,'울트라 키펜','울트라 키펜님이 공감했습니다','회원님의 게시물에 새로운 좋아요가 추가되었습니다.',0,NULL,'2025-10-24 15:30:03'),(13,2052,'comment',294,310,'someone-day',2037,'울트라 키펜','울트라 키펜님이 댓글을 작성했습니다','회원님의 게시물에 새로운 댓글이 작성되었습니다. 💬',0,NULL,'2025-10-24 15:30:14'),(14,2052,'reply',295,310,'someone-day',2037,'울트라 키펜','울트라 키펜님이 답글을 작성했습니다','회원님의 게시물에 새로운 답글이 작성되었습니다. 💬',0,NULL,'2025-10-24 15:30:22'),(15,2052,'reply',19,41,'challenge',2037,'울트라 키펜','울트라 키펜님이 회원님의 댓글에 답글을 작성했습니다','회원님의 댓글에 새로운 답글이 작성되었습니다. 💬',0,NULL,'2025-10-25 08:46:19'),(16,2037,'comment',346,426,'my-day',2055,'키펜무브','키펜무브님이 댓글을 작성했습니다','회원님의 게시물에 새로운 댓글이 작성되었습니다. 💬',1,NULL,'2025-11-14 16:30:00'),(17,2037,'comment',41,44,'challenge',2055,'키펜무브','키펜무브님이 챌린지에 댓글을 작성했습니다','회원님의 챌린지에 새로운 댓글이 작성되었습니다. 💬',1,NULL,'2025-11-14 16:31:04'),(18,2037,'comment',42,44,'challenge',2055,'키펜무브','키펜무브님이 챌린지에 댓글을 작성했습니다','회원님의 챌린지에 새로운 댓글이 작성되었습니다. 💬',1,NULL,'2025-11-15 07:48:49'),(19,2037,'comment',43,44,'challenge',2055,'키펜무브','키펜무브님이 챌린지에 댓글을 작성했습니다','회원님의 챌린지에 새로운 댓글이 작성되었습니다. 💬',1,NULL,'2025-11-15 07:49:10'),(20,2037,'comment',348,425,'my-day',2055,'키펜무브','키펜무브님이 댓글을 작성했습니다','회원님의 게시물에 새로운 댓글이 작성되었습니다. 💬',1,NULL,'2025-11-16 11:57:27'),(21,2037,'reply',349,425,'my-day',2055,'키펜무브','키펜무브님이 답글을 작성했습니다','회원님의 게시물에 새로운 답글이 작성되었습니다. 💬',1,NULL,'2025-11-16 11:57:32');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_recommendations`
--

DROP TABLE IF EXISTS `post_recommendations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_recommendations` (
  `recommendation_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `recommended_post_id` int(11) NOT NULL,
  `post_type` enum('my_day','someone_day') NOT NULL,
  `reason` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`recommendation_id`),
  KEY `post_recommendations_post_id` (`post_id`),
  KEY `post_recommendations_recommended_post_id` (`recommended_post_id`),
  CONSTRAINT `post_recommendations_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `someone_day_posts` (`post_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `post_recommendations_ibfk_2` FOREIGN KEY (`recommended_post_id`) REFERENCES `someone_day_posts` (`post_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_recommendations`
--

LOCK TABLES `post_recommendations` WRITE;
/*!40000 ALTER TABLE `post_recommendations` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_recommendations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_reports`
--

DROP TABLE IF EXISTS `post_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `report_type` enum('spam','inappropriate','harassment','other','content') NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`report_id`),
  KEY `post_reports_post_id` (`post_id`),
  KEY `post_reports_reporter_id` (`reporter_id`),
  KEY `post_reports_status` (`status`),
  KEY `post_reports_created_at` (`created_at`),
  CONSTRAINT `post_reports_ibfk_127` FOREIGN KEY (`post_id`) REFERENCES `someone_day_posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `post_reports_ibfk_128` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_reports`
--

LOCK TABLES `post_reports` WRITE;
/*!40000 ALTER TABLE `post_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_tags`
--

DROP TABLE IF EXISTS `post_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_tags` (
  `post_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`post_id`,`tag_id`),
  KEY `post_tags_post_id` (`post_id`),
  KEY `post_tags_tag_id` (`tag_id`),
  CONSTRAINT `post_tags_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `someone_day_posts` (`post_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `post_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`tag_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_tags`
--

LOCK TABLES `post_tags` WRITE;
/*!40000 ALTER TABLE `post_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reaction_types`
--

DROP TABLE IF EXISTS `reaction_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reaction_types` (
  `reaction_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `icon` varchar(50) NOT NULL,
  `emoji` varchar(10) DEFAULT NULL,
  `color` varchar(20) NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`reaction_type_id`),
  UNIQUE KEY `unique_name` (`name`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `name_7` (`name`),
  UNIQUE KEY `name_8` (`name`),
  UNIQUE KEY `name_9` (`name`),
  UNIQUE KEY `name_10` (`name`),
  UNIQUE KEY `name_11` (`name`),
  UNIQUE KEY `name_12` (`name`),
  UNIQUE KEY `name_13` (`name`),
  UNIQUE KEY `name_14` (`name`),
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `name_16` (`name`),
  UNIQUE KEY `name_17` (`name`),
  UNIQUE KEY `name_18` (`name`),
  UNIQUE KEY `name_19` (`name`),
  UNIQUE KEY `name_20` (`name`),
  UNIQUE KEY `name_21` (`name`),
  UNIQUE KEY `name_22` (`name`),
  UNIQUE KEY `name_23` (`name`),
  UNIQUE KEY `name_24` (`name`),
  UNIQUE KEY `name_25` (`name`),
  UNIQUE KEY `name_26` (`name`),
  UNIQUE KEY `name_27` (`name`),
  UNIQUE KEY `name_28` (`name`),
  UNIQUE KEY `name_29` (`name`),
  UNIQUE KEY `name_30` (`name`),
  UNIQUE KEY `name_31` (`name`),
  UNIQUE KEY `name_32` (`name`),
  UNIQUE KEY `name_33` (`name`),
  UNIQUE KEY `name_34` (`name`),
  UNIQUE KEY `name_35` (`name`),
  UNIQUE KEY `name_36` (`name`),
  UNIQUE KEY `name_37` (`name`),
  UNIQUE KEY `name_38` (`name`),
  UNIQUE KEY `name_39` (`name`),
  UNIQUE KEY `name_40` (`name`),
  UNIQUE KEY `name_41` (`name`),
  UNIQUE KEY `name_42` (`name`),
  UNIQUE KEY `name_43` (`name`),
  UNIQUE KEY `name_44` (`name`),
  UNIQUE KEY `name_45` (`name`),
  UNIQUE KEY `name_46` (`name`),
  UNIQUE KEY `name_47` (`name`),
  UNIQUE KEY `name_48` (`name`),
  UNIQUE KEY `name_49` (`name`),
  UNIQUE KEY `name_50` (`name`),
  UNIQUE KEY `name_51` (`name`),
  UNIQUE KEY `name_52` (`name`),
  UNIQUE KEY `name_53` (`name`),
  UNIQUE KEY `name_54` (`name`),
  UNIQUE KEY `name_55` (`name`),
  UNIQUE KEY `name_56` (`name`),
  UNIQUE KEY `name_57` (`name`),
  UNIQUE KEY `name_58` (`name`),
  UNIQUE KEY `name_59` (`name`),
  UNIQUE KEY `name_60` (`name`),
  UNIQUE KEY `name_61` (`name`),
  UNIQUE KEY `name_62` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='由ъ븸?? ???? 留덉뒪??';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reaction_types`
--

LOCK TABLES `reaction_types` WRITE;
/*!40000 ALTER TABLE `reaction_types` DISABLE KEYS */;
INSERT INTO `reaction_types` VALUES (1,'媛숈?? 湲곕텇?댁뿉??','hand-heart','?쩃','#FF6B9D',1,1),(2,'?섎궡?몄슂','arm-flex','?뮞','#FFA500',2,1),(3,'怨듦컧?댁슂','heart','?ㅿ툘','#FF4444',3,1),(4,'?묒썝?댁슂','emoticon-happy','?삃','#4CAF50',4,1),(5,'怨좊쭏?뚯슂','flower','?뙵','#9C27B0',5,1);
/*!40000 ALTER TABLE `reaction_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sequelizemeta`
--

DROP TABLE IF EXISTS `sequelizemeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequelizemeta`
--

LOCK TABLES `sequelizemeta` WRITE;
/*!40000 ALTER TABLE `sequelizemeta` DISABLE KEYS */;
INSERT INTO `sequelizemeta` VALUES ('20241212070037-init_challenge_emotions.js'),('20241214060338-update_challenge_emotions_table.js'),('20241214155447-modify-challenge-emotions.js');
/*!40000 ALTER TABLE `sequelizemeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `simple_challenge_emotions`
--

DROP TABLE IF EXISTS `simple_challenge_emotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `simple_challenge_emotions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `challenge_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `emotion_id` int(11) NOT NULL,
  `log_date` date NOT NULL,
  `note` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `simple_challenge_emotions_challenge_id_user_id_log_date` (`challenge_id`,`user_id`,`log_date`),
  KEY `simple_challenge_emotions_user_id_log_date` (`user_id`,`log_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `simple_challenge_emotions`
--

LOCK TABLES `simple_challenge_emotions` WRITE;
/*!40000 ALTER TABLE `simple_challenge_emotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `simple_challenge_emotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `simple_challenge_participants`
--

DROP TABLE IF EXISTS `simple_challenge_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `simple_challenge_participants` (
  `challenge_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` datetime NOT NULL,
  `status` enum('active','completed','quit') NOT NULL DEFAULT 'active',
  `progress_count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`challenge_id`,`user_id`),
  UNIQUE KEY `simple_challenge_participants_challenge_id_user_id` (`challenge_id`,`user_id`),
  KEY `simple_challenge_participants_user_id` (`user_id`),
  CONSTRAINT `simple_challenge_participants_ibfk_1` FOREIGN KEY (`challenge_id`) REFERENCES `simple_challenges` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `simple_challenge_participants_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `simple_challenge_participants`
--

LOCK TABLES `simple_challenge_participants` WRITE;
/*!40000 ALTER TABLE `simple_challenge_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `simple_challenge_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `simple_challenges`
--

DROP TABLE IF EXISTS `simple_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `simple_challenges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `creator_id` int(11) NOT NULL,
  `status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
  `participant_count` int(11) NOT NULL DEFAULT 1,
  `max_participants` int(11) DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `simple_challenges_creator_id` (`creator_id`),
  KEY `simple_challenges_status` (`status`),
  KEY `simple_challenges_start_date_end_date` (`start_date`,`end_date`),
  CONSTRAINT `simple_challenges_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `simple_challenges`
--

LOCK TABLES `simple_challenges` WRITE;
/*!40000 ALTER TABLE `simple_challenges` DISABLE KEYS */;
/*!40000 ALTER TABLE `simple_challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `someone_day_comment_likes`
--

DROP TABLE IF EXISTS `someone_day_comment_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `someone_day_comment_likes` (
  `like_id` int(11) NOT NULL AUTO_INCREMENT,
  `comment_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`like_id`),
  UNIQUE KEY `unique_comment_like` (`comment_id`,`user_id`),
  UNIQUE KEY `someone_day_comment_likes_comment_id_user_id` (`comment_id`,`user_id`),
  KEY `idx_comment_likes_user_id` (`user_id`),
  KEY `idx_comment_likes_created_at` (`created_at`),
  KEY `someone_day_comment_likes_user_id` (`user_id`),
  KEY `someone_day_comment_likes_created_at` (`created_at`),
  CONSTRAINT `someone_day_comment_likes_ibfk_157` FOREIGN KEY (`comment_id`) REFERENCES `someone_day_comments` (`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `someone_day_comment_likes_ibfk_158` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `someone_day_comment_likes`
--

LOCK TABLES `someone_day_comment_likes` WRITE;
/*!40000 ALTER TABLE `someone_day_comment_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `someone_day_comment_likes` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_comment_like_insert` AFTER INSERT ON `someone_day_comment_likes` FOR EACH ROW BEGIN
    UPDATE someone_day_comments 
    SET like_count = like_count + 1 
    WHERE comment_id = NEW.comment_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_comment_like_delete` AFTER DELETE ON `someone_day_comment_likes` FOR EACH ROW BEGIN
    UPDATE someone_day_comments 
    SET like_count = like_count - 1 
    WHERE comment_id = OLD.comment_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `someone_day_comments`
--

DROP TABLE IF EXISTS `someone_day_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `someone_day_comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` varchar(500) NOT NULL,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `parent_comment_id` int(11) DEFAULT NULL,
  `like_count` int(11) NOT NULL DEFAULT 0,
  `reply_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `someone_day_comments_post_id` (`post_id`),
  KEY `someone_day_comments_user_id` (`user_id`),
  KEY `idx_someone_day_comments_parent_id` (`parent_comment_id`),
  KEY `idx_someone_day_comments_like_count` (`like_count`),
  KEY `someone_day_comments_parent_comment_id` (`parent_comment_id`),
  KEY `someone_day_comments_created_at` (`created_at`),
  KEY `someone_day_comments_like_count` (`like_count`),
  CONSTRAINT `someone_day_comments_ibfk_239` FOREIGN KEY (`post_id`) REFERENCES `someone_day_posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `someone_day_comments_ibfk_240` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `someone_day_comments_ibfk_241` FOREIGN KEY (`parent_comment_id`) REFERENCES `someone_day_comments` (`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=302 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `someone_day_comments`
--

LOCK TABLES `someone_day_comments` WRITE;
/*!40000 ALTER TABLE `someone_day_comments` DISABLE KEYS */;
INSERT INTO `someone_day_comments` VALUES (272,301,2037,'안녕하세요 반갑워요',1,NULL,0,1,'2025-09-10 04:48:41','2025-09-10 04:49:01'),(273,301,2037,'@익명 ㅇㅇㅇㅇ',0,272,0,0,'2025-09-10 04:49:01','2025-09-10 04:49:01'),(276,307,2037,'반갑습니다.안녕하',0,NULL,0,1,'2025-09-30 07:01:51','2025-09-30 07:03:23'),(277,307,2037,'@울트라 울트라 다르다',0,276,0,1,'2025-09-30 07:02:04','2025-09-30 07:43:25'),(278,307,2037,'허헣ㅎ허허',0,NULL,0,1,'2025-09-30 07:30:49','2025-09-30 07:36:34'),(279,307,2037,'@울트라 ㅎㅎㅎㅎㅎ',0,278,0,0,'2025-09-30 07:36:34','2025-10-03 12:23:14'),(280,307,2037,'ㄹㄴㅇㄹㄴㅇㄹㄴㅇ',0,NULL,0,1,'2025-09-30 07:43:11','2025-09-30 07:43:19'),(281,307,2037,'@울트라 ㄴㄴㅁㄹㄴㅁㄹㄴㅁㄹㅁㄴ',0,280,0,1,'2025-09-30 07:43:19','2025-10-03 12:23:14'),(282,307,2037,'@울트라 ㄴㄴㅁㅁㄴㄹㅁㄴ',0,277,0,0,'2025-09-30 07:43:25','2025-10-03 12:23:14'),(283,306,2037,'반가워요 오늘은 뭐에요',0,NULL,0,0,'2025-10-01 01:35:30','2025-10-01 01:35:30'),(284,307,2037,'@울트라 ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ',0,281,0,0,'2025-10-03 12:22:25','2025-10-03 12:22:25'),(285,308,2037,'힘든 시간을 보내고 계시는군요. 응원합니다!',1,NULL,0,0,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(286,308,2037,'저도 비슷한 고민이 있었는데 이렇게 해결했어요...',1,NULL,0,0,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(287,308,2037,'괜찮아질 거예요. 함께 이겨내요!',1,NULL,0,0,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(288,308,2037,'정말 감사합니다. 큰 힘이 됩니다.',1,285,0,0,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(289,308,2037,'저도 응원합니다!',1,285,0,0,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(290,308,2037,'좋은 방법이네요! 저도 한번 시도해볼게요.',1,286,0,0,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(291,308,2037,'네, 함께 힘내요!',1,287,0,0,'2025-10-12 07:17:29','2025-10-12 07:17:29'),(292,309,2037,'그래 나타났어.',0,NULL,0,2,'2025-10-16 06:46:21','2025-11-08 12:54:43'),(293,309,2052,'@울트라 키펜 반가워요. 안녕하세요',0,292,0,0,'2025-10-16 07:08:27','2025-10-16 07:08:27'),(294,310,2037,'안녕하세요 반가워요',0,NULL,0,1,'2025-10-24 15:30:14','2025-10-24 15:30:22'),(295,310,2037,'@울트라 키펜 ㅎㅎㅎㅎㅎㅎ',0,294,0,0,'2025-10-24 15:30:22','2025-10-24 15:30:22'),(296,309,2037,'@울트라 키펜 안녕하세요',0,292,0,0,'2025-11-08 12:54:43','2025-11-08 12:54:43'),(297,313,2037,'vvvggg',0,NULL,0,0,'2025-11-13 04:11:42','2025-11-13 04:11:42'),(298,309,2037,'안녕하세요',0,NULL,0,0,'2025-11-14 05:11:46','2025-11-14 05:11:46'),(299,317,2055,'오늘은 11월 17일입니다',0,NULL,0,1,'2025-11-17 05:05:23','2025-11-17 05:05:33'),(300,317,2055,'@키펜무브 안녕하세요',1,299,0,1,'2025-11-17 05:05:32','2025-11-17 05:05:39'),(301,317,2055,'@익명 반가워요',1,300,0,0,'2025-11-17 05:05:39','2025-11-17 05:05:39');
/*!40000 ALTER TABLE `someone_day_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `someone_day_emotions`
--

DROP TABLE IF EXISTS `someone_day_emotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `someone_day_emotions` (
  `post_id` int(11) NOT NULL,
  `emotion_id` tinyint(3) unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`post_id`,`emotion_id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_emotion_id` (`emotion_id`),
  KEY `someone_day_emotions_post_id` (`post_id`),
  KEY `someone_day_emotions_emotion_id` (`emotion_id`),
  CONSTRAINT `someone_day_emotions_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `someone_day_posts` (`post_id`) ON DELETE CASCADE,
  CONSTRAINT `someone_day_emotions_ibfk_2` FOREIGN KEY (`emotion_id`) REFERENCES `emotions` (`emotion_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `someone_day_emotions`
--

LOCK TABLES `someone_day_emotions` WRITE;
/*!40000 ALTER TABLE `someone_day_emotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `someone_day_emotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `someone_day_likes`
--

DROP TABLE IF EXISTS `someone_day_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `someone_day_likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `someone_day_likes_post_id_user_id` (`post_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `someone_day_likes_ibfk_153` FOREIGN KEY (`post_id`) REFERENCES `someone_day_posts` (`post_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `someone_day_likes_ibfk_154` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `someone_day_likes`
--

LOCK TABLES `someone_day_likes` WRITE;
/*!40000 ALTER TABLE `someone_day_likes` DISABLE KEYS */;
INSERT INTO `someone_day_likes` VALUES (6,306,2037,'2025-10-01 01:35:35','2025-10-01 01:35:35'),(12,307,2037,'2025-10-01 01:58:56','2025-10-01 01:58:56'),(13,311,2037,'2025-10-24 14:37:24','2025-10-24 14:37:24');
/*!40000 ALTER TABLE `someone_day_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `someone_day_posts`
--

DROP TABLE IF EXISTS `someone_day_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `someone_day_posts` (
  `post_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `summary` varchar(200) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `character_count` int(11) DEFAULT NULL,
  `like_count` int(11) NOT NULL DEFAULT 0,
  `comment_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `reaction_count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`post_id`),
  KEY `someone_day_posts_user_id` (`user_id`),
  KEY `someone_day_posts_created_at` (`created_at`),
  KEY `someone_day_posts_like_count` (`like_count`),
  KEY `idx_someone_day_posts_like_count` (`like_count`),
  KEY `idx_someone_day_posts_created_at` (`created_at`),
  KEY `idx_someone_day_posts_user_id` (`user_id`),
  KEY `idx_someone_day_visibility` (`created_at`),
  FULLTEXT KEY `title` (`title`,`content`),
  CONSTRAINT `someone_day_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=318 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `someone_day_posts`
--

LOCK TABLES `someone_day_posts` WRITE;
/*!40000 ALTER TABLE `someone_day_posts` DISABLE KEYS */;
INSERT INTO `someone_day_posts` VALUES (297,2037,'일상의 스트레스 해결법','요즘 일이 너무 바빠서 스트레스를 많이 받고 있어요. 어떻게 해야 마음의 여유를 찾을 수 있을까요?','바쁜 일상 속에서 스트레스를 받고 있어 마음의 여유를 찾고 싶음',NULL,1,NULL,0,0,'2025-09-06 13:43:46','2025-09-06 13:43:46',0),(298,2037,'새로운 도전에 대한 용기','새로운 도전을 앞두고 있는데 두렵기도 하고 설레기도 해요. 용기를 내어 도전해보려고 합니다.','새로운 도전을 앞둔 두려움과 설렘, 용기가 필요한 상황',NULL,1,NULL,0,0,'2025-09-06 13:43:46','2025-09-06 13:43:46',0),(299,2037,'9월 9일입니다 안녕해요','오늘은 9월 9일입니다 안녕하세요 반같습니다.','오늘은 9월 9일입니다 안녕하세요 반같습니다.','/api/uploads/images/image_2037_1757403877543_0.jpg',1,25,0,0,'2025-09-09 07:44:37','2025-09-09 07:44:37',0),(300,2037,'sbt 에뮬레이터는 잘 모르는데, 궁금해서 그러는데, 왜 이런 게 필요해요?','블루스택도 그렇게 해. 근데 에뮬레이터에서 CTRL+V 할 때는 붙여넣을 수 있는 뭔가가 있어야 돼. 예를 들어 텍스트를 복사해서 에뮬레이터 검색창에 가면 돼. 이미지 같은 거는 안 될 걸. 아니면 갤러리 앱 같은 데서는 될 수도 있고.','블루스택도 그렇게 해. 근데 에뮬레이터에서 CTRL+V 할 때는 붙여넣을 수 있는 뭔가가 있어야 돼. 예를 들어 텍스트를 복사해서 에뮬레이터 검색창에 가면 돼. 이미지 같은 거는 안 될 걸. 아니면 갤러리 앱 같은 데서는 될 수도 있고.',NULL,1,132,0,0,'2025-09-09 12:42:33','2025-09-09 12:42:53',0),(301,2037,'9일 박은정 조국혁신당 의원이 법무부서 확인한 자료에 따르면 구치소에 수감 중인 윤 전 대통령을 접견한 강의구 전 대통령실 부속실장이 휴대전화를 밀반입해 사용한 것으로 드러났다.','9일 박은정 조국혁신당 의원이 법무부서 확인한 자료에 따르면 구치소에 수감 중인 윤 전 대통령을 접견한 강의구 전 대통령실 부속실장이 휴대전화를 밀반입해 사용한 것으로 드러났다.\n\n강 전 실장은 지난 2월 21일 구치소장의 허가 없이 휴대전화를 밀반입했고, 윤 전 대통령은 해당 휴대전화로 자기 반려견 사진과 영상을 본 것으로 전해졌다.','9일 박은정 조국혁신당 의원이 법무부서 확인한 자료에 따르면 구치소에 수감 중인 윤 전 대통령을 접견한 강의구 전 대통령실 부속실장이 휴대전화를 밀반입해 사용한 것으로 드러났다.\n\n강 전 실장은 지난 2월 21일 구치소장의 허가 없이 휴대전화를 밀반입했고, 윤 전 대통령은 해당 휴대전화로 자기 반려견 사진과 영상을 본 것으로 전해졌다.','/api/uploads/images/image_2037_1757479662606_0.jpg',1,188,0,2,'2025-09-10 04:47:42','2025-09-10 04:49:01',0),(302,2037,'당신의 일상이 기억에 남지 않는 이','- 글래스모피즘: 반투명 카드 배경 + 블러 효과\n  - 네오모피즘: 편집/삭제 버튼 입체\n  - 감정 태그별 동적 색상: 고민 유형에 따른 색상 구분\n  - 마이크로 애니메이션: 카드 터치 시 부드러운 효과','- 글래스모피즘: 반투명 카드 배경 + 블러 효과\n  - 네오모피즘: 편집/삭제 버튼 입체\n  - 감정 태그별 동적 색상: 고민 유형에 따른 색상 구분\n  - 마이크로 애니메이션: 카드 터치 시 부드러운 효과','http://10.0.2.2:3002/api/uploads/images/image_2037_1757485894995_0.jpg',1,116,0,0,'2025-09-10 06:31:35','2025-09-22 13:25:57',0),(305,2037,'9월 22일 테스트입니다.','위로와 공감 마음나누기 테스트야.\n안녕하세요','위로와 공감 마음나누기 테스트야.\n안녕하세요','/api/uploads/images/image_2037_1758551854107_0.jpg',1,24,0,0,'2025-09-22 14:21:37','2025-09-22 14:37:34',0),(306,2037,'9월30일 입니까 고민나누기 테스트입니다.ff','안녕하세요 고민 나누기 테스트입니다 반가워요 ㅎㅎㅎ','안녕하세요 고민 나누기 테스트입니다 반가워요 ㅎㅎㅎ','[\"http://10.0.2.2:3001/api/uploads/images/image_2037_1759215405505_0.jpg\"]',1,28,1,1,'2025-09-30 06:56:45','2025-10-08 14:09:35',0),(307,2037,'9월 30일 고민 나누기 테','안녕하세요 고민 나누기 테스트입니다. 업데이트가 설치되면 알림이 표시됩니다\\\n● 헤더 위 화살표 버튼의 클로저 문제를 해결했습니다.\n\n  수정 내용:\n\n  1. scrollToTop 함수를 useCallback으로 구현 - scrollViewRef의 현재 값을        \n  제대로 캡처\n  2. headerRight에서 직접 호출 방식 제거 - scrollToTop 함수 사용으로 변경       \n  3. useEffect 의존성 배열 업데이트 - scrollToTop 추가\n\n  이제 앱을 새로고침하고 PostDetailScreen에서 헤더의 위 화살표(↑) 버튼을        \n  눌러보세요.','안녕하세요 고민 나누기 테스트입니다. 업데이트가 설치되면 알림이 표시됩니다\\\n● 헤더 위 화살표 버튼의 클로저 문제를 해결했습니다.\n\n  수정 내용:\n\n  1. scrollToTop 함수를 useCallback으로 구현 - scrollViewRef의 현재 값을        \n  제대로 캡처\n  2. headerRight에서 직접 호출 방식 제거 - scro','[\"http://10.0.2.2:3001/api/uploads/images/image_2037_1759215685248_0.jpg\",\"http://10.0.2.2:3001/api/uploads/images/image_2037_1759284421669_0.jpg\",\"http://10.0.2.2:3001/api/uploads/images/image_2037_1759496121151_0.jpg\"]',0,338,1,8,'2025-09-30 07:01:25','2025-10-17 02:35:32',0),(308,2037,'데이터 로딩 부분에 로그를 추가','명령 실행이 완료되지 않았습니다. 더 간단한 방법으로 확인해보겠습니다.      \n  앱에서 직접 콘솔 로그를 확인해보겠습니다.\n1일 TMAP 추석 교통 예측 데이터에 따르면 올해 추석은 긴 연휴로 인해 귀성길 정체가 일부 분산되지만, 추석 당일(6일) 정오 전후에는 예년보다 더 극심한 정체가 예상된다.','명령 실행이 완료되지 않았습니다. 더 간단한 방법으로 확인해보겠습니다.      \n  앱에서 직접 콘솔 로그를 확인해보겠습니다.\n1일 TMAP 추석 교통 예측 데이터에 따르면 올해 추석은 긴 연휴로 인해 귀성길 정체가 일부 분산되지만, 추석 당일(6일) 정오 전후에는 예년보다 더 극심한 정체가 예상된다.','[\"http://10.0.2.2:3001/api/uploads/images/image_2037_1759296858851_0.jpg\"]',0,170,4,0,'2025-10-31 05:34:19','2025-10-31 14:11:51',0),(309,2037,'안녕하세요 위로와 공감','위로와 공감 마음 나누기 테스트 해봐요ㅎㅎ','위로와 공감 마음 나누기 테스트 해봐요ㅎㅎ','[\"/api/uploads/images/image_2037_1760597127738_0.jpg\",\"/api/uploads/images/image_2037_1760597127834_0.jpg\"]',1,23,0,4,'2025-10-16 06:45:27','2025-11-14 05:11:46',0),(310,2052,'반갑습니다 테스트입니다.','ㅎㅎㅎ 테스트 잘되나 안되나 ㅎㅎ니릇코스펜도.','ㅎㅎㅎ 테스트 잘되나 안되나 ㅎㅎ니릇코스펜도.','[\"/api/uploads/images/image_2052_1760598420005_0.jpg\"]',0,25,5,2,'2025-10-31 07:07:00','2025-10-30 15:30:22',0),(311,2052,'백엔드 서버가 자동으로 재시작되면 변경사항이 적용됩니다.','백엔드 서버가 자동으로 재시작되면 변경사항이 적용됩니다.','백엔드 서버가 자동으로 재시작되면 변경사항이 적용됩니다.',NULL,1,31,10,0,'2025-10-30 07:28:01','2025-10-24 14:37:24',0),(312,2056,'김건희 측 \"건진법사한테 두 차례 샤넬백 받아…부적절한 처신 반성\"','윤석열 전 대통령 아내 김건희 여사 법률대리인단이 5일 “건진법사 전성배씨로부터 두 차례 샤넬백을 받았다”고 했다. 김 여사가 샤넬백 수수 사실을 인정한 것은 이번이 처음이다.','윤석열 전 대통령 아내 김건희 여사 법률대리인단이 5일 “건진법사 전성배씨로부터 두 차례 샤넬백을 받았다”고 했다. 김 여사가 샤넬백 수수 사실을 인정한 것은 이번이 처음이다.','[\"/api/uploads/images/image_2056_1762307436262_0.jpg\",\"/api/uploads/images/image_2056_1762307436445_0.jpg\"]',0,98,0,0,'2025-11-05 01:50:36','2025-11-05 01:50:36',0),(313,2037,'고려대서도 \'집단 커닝\' 발각됐다…원격 부정행위 방지 시스템 \'무용지물\'','문제가 된 중간고사는 카메라 촬영이나 원격 시험 보안프로그램 등 별도의 부정행위 방지 장치 없이 비대면 방식으로 치러졌다. 하지만 시험 당일 일부 학생이 시험에 응시하던 도중 오픈채팅방에서 문제 화면을 공유하며 부정행위를 했고, 같은 채팅방에 있던 학생들의 제보로 이 사실이 교수진에게 알려졌다. 해당 채팅방은 시험 전부터 수강생 간 정보 공유를 하던 용도의 커뮤니티로 운영되던 것으로 확인된다.','문제가 된 중간고사는 카메라 촬영이나 원격 시험 보안프로그램 등 별도의 부정행위 방지 장치 없이 비대면 방식으로 치러졌다. 하지만 시험 당일 일부 학생이 시험에 응시하던 도중 오픈채팅방에서 문제 화면을 공유하며 부정행위를 했고, 같은 채팅방에 있던 학생들의 제보로 이 사실이 교수진에게 알려졌다. 해당 채팅방은 시험 전부터 수강생 간 정보 공유를 하던 용도의','[\"/api/uploads/images/image_2037_1762751130804_0.jpg\",\"/api/uploads/images/image_2037_1762751131062_0.jpg\",\"/api/uploads/images/image_2037_1762751131650_0.jpg\"]',1,221,0,1,'2025-11-10 05:05:31','2025-11-13 04:11:42',0),(314,2055,'ㅇ보이저 탐사선이 태양계 끝에서 발견한 충격적인 사실들','외계 지적 문명이 보낸 \'정체불명 메시지\' 충격적인 해독 결과.. (외계 DNA 정보까지 공개) | 미스터리김반월 미스터리 몰아보기 편]\n칠볼튼.. 30년 만에 돌아온 외계문명의 답신일까? + 김반월꿀잼 미스터리 5편','외계 지적 문명이 보낸 \'정체불명 메시지\' 충격적인 해독 결과.. (외계 DNA 정보까지 공개) | 미스터리김반월 미스터리 몰아보기 편]\n칠볼튼.. 30년 만에 돌아온 외계문명의 답신일까? + 김반월꿀잼 미스터리 5편','[\"http://192.168.219.51:3001/api/uploads/images/image_2055_1763134739700_0_full.webp\",\"http://192.168.219.51:3001/api/uploads/images/image_2055_1763137588848_0_full.webp\"]',0,121,0,0,'2025-11-14 15:11:07','2025-11-14 16:29:42',0),(315,2055,'파일을 점검해서 피드백','다크모드,라이트모드,반응형,보안,트래픽 감소,캐싱,폰트의\n  크기,가독성,시안성,로딩속도등의 전반적인것을 점검','다크모드,라이트모드,반응형,보안,트래픽 감소,캐싱,폰트의\n  크기,가독성,시안성,로딩속도등의 전반적인것을 점검','[\"/api/uploads/images/image_2055_1763297350573_0_full.webp\",\"/api/uploads/images/image_2055_1763297350803_0_full.webp\"]',1,61,0,0,'2025-11-16 12:31:38','2025-11-16 12:49:11',0),(316,2055,'뉴발란스 \"배송 지연 사과\"…천안 이랜드 물류센터 화재로 1100만점 불타','천안 이랜드 패션 물류센터가 화재로 사실상 전소되면서, 뉴발란스·슈펜·스파오 등 이랜드 계열 브랜드들이 출고 지연 사태를 겪고 있다. 해당 물류센터에는 신발·의류 등이 1100만점 보관돼 있었다고 소방 당국은 밝혔다.','천안 이랜드 패션 물류센터가 화재로 사실상 전소되면서, 뉴발란스·슈펜·스파오 등 이랜드 계열 브랜드들이 출고 지연 사태를 겪고 있다. 해당 물류센터에는 신발·의류 등이 1100만점 보관돼 있었다고 소방 당국은 밝혔다.','[\"/api/uploads/images/image_2055_1763298058210_0_full.webp\",\"/api/uploads/images/image_2055_1763298062121_0_full.webp\"]',1,121,0,0,'2025-11-16 13:01:02','2025-11-16 13:01:02',0),(317,2055,'오세훈 \"한강버스 사고 송구…정치 공세 삼지 말아야\"','더본코리아는 이번 공시에서 예산군청으로부터 액화석유가스의 안전관리 및 사업법 제44조 제1항 및 동법 시행규칙 제69조 위반으로 지난 2월 19일 과태료 80만원을, 강남구청으로부터 액화석유가스의 안전관리 및 사업법 제73조 위반으로 지난 4월 10일 과태료 40만원을 부과받았다고 했다.','더본코리아는 이번 공시에서 예산군청으로부터 액화석유가스의 안전관리 및 사업법 제44조 제1항 및 동법 시행규칙 제69조 위반으로 지난 2월 19일 과태료 80만원을, 강남구청으로부터 액화석유가스의 안전관리 및 사업법 제73조 위반으로 지난 4월 10일 과태료 40만원을 부과받았다고 했다.','[\"/api/uploads/images/image_2055_1763355884760_0_full.webp\",\"/api/uploads/images/image_2055_1763355885356_0_full.webp\"]',1,161,0,3,'2025-11-17 05:04:45','2025-11-17 05:05:39',0);
/*!40000 ALTER TABLE `someone_day_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `someone_day_reactions`
--

DROP TABLE IF EXISTS `someone_day_reactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `someone_day_reactions` (
  `reaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reaction_type_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`reaction_id`),
  UNIQUE KEY `unique_user_post_reaction` (`post_id`,`user_id`,`reaction_type_id`),
  UNIQUE KEY `someone_day_reactions_post_id_user_id_reaction_type_id` (`post_id`,`user_id`,`reaction_type_id`),
  KEY `idx_post` (`post_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_reaction_type` (`reaction_type_id`),
  CONSTRAINT `someone_day_reactions_ibfk_187` FOREIGN KEY (`post_id`) REFERENCES `someone_day_posts` (`post_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `someone_day_reactions_ibfk_188` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `someone_day_reactions_ibfk_189` FOREIGN KEY (`reaction_type_id`) REFERENCES `reaction_types` (`reaction_type_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Someone Day (?꾨줈?? 怨듦컧) 寃뚯떆臾? 由ъ븸??';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `someone_day_reactions`
--

LOCK TABLES `someone_day_reactions` WRITE;
/*!40000 ALTER TABLE `someone_day_reactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `someone_day_reactions` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`Iexist`@`localhost`*/ /*!50003 TRIGGER after_someone_day_reaction_insert
AFTER INSERT ON someone_day_reactions
FOR EACH ROW
BEGIN
  UPDATE someone_day_posts
  SET reaction_count = reaction_count + 1
  WHERE post_id = NEW.post_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`Iexist`@`localhost`*/ /*!50003 TRIGGER after_someone_day_reaction_delete
AFTER DELETE ON someone_day_reactions
FOR EACH ROW
BEGIN
  UPDATE someone_day_posts
  SET reaction_count = reaction_count - 1
  WHERE post_id = OLD.post_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `someone_day_tags`
--

DROP TABLE IF EXISTS `someone_day_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `someone_day_tags` (
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `post_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  PRIMARY KEY (`post_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  KEY `someone_day_tags_post_id` (`post_id`),
  KEY `someone_day_tags_tag_id` (`tag_id`),
  CONSTRAINT `someone_day_tags_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `someone_day_posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `someone_day_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`tag_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `someone_day_tags`
--

LOCK TABLES `someone_day_tags` WRITE;
/*!40000 ALTER TABLE `someone_day_tags` DISABLE KEYS */;
INSERT INTO `someone_day_tags` VALUES ('2025-09-22 14:37:34','2025-09-22 14:37:34',305,151),('2025-10-08 14:09:35','2025-10-08 14:09:35',306,153),('2025-10-17 02:35:32','2025-10-17 02:35:32',307,153),('2025-10-08 14:11:51','2025-10-08 14:11:51',308,4),('2025-10-16 06:45:27','2025-10-16 06:45:27',309,4),('2025-10-16 07:07:00','2025-10-16 07:07:00',310,151),('2025-10-16 07:28:01','2025-10-16 07:28:01',311,5),('2025-11-05 01:50:36','2025-11-05 01:50:36',312,4),('2025-11-05 01:50:36','2025-11-05 01:50:36',312,153),('2025-11-10 05:05:31','2025-11-10 05:05:31',313,151),('2025-11-16 12:49:11','2025-11-16 12:49:11',315,4),('2025-11-17 05:04:45','2025-11-17 05:04:45',317,154),('2025-11-17 05:04:45','2025-11-17 05:04:45',317,155);
/*!40000 ALTER TABLE `someone_day_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `tag_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`tag_id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `tags_name` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `name_7` (`name`),
  UNIQUE KEY `name_8` (`name`),
  UNIQUE KEY `name_9` (`name`),
  UNIQUE KEY `name_10` (`name`),
  UNIQUE KEY `name_11` (`name`),
  UNIQUE KEY `name_12` (`name`),
  UNIQUE KEY `name_13` (`name`),
  UNIQUE KEY `name_14` (`name`),
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `name_16` (`name`),
  UNIQUE KEY `name_17` (`name`),
  UNIQUE KEY `name_18` (`name`),
  UNIQUE KEY `name_19` (`name`),
  UNIQUE KEY `name_20` (`name`),
  UNIQUE KEY `name_21` (`name`),
  UNIQUE KEY `name_22` (`name`),
  UNIQUE KEY `name_23` (`name`),
  UNIQUE KEY `name_24` (`name`),
  UNIQUE KEY `name_25` (`name`),
  UNIQUE KEY `name_26` (`name`),
  UNIQUE KEY `name_27` (`name`),
  UNIQUE KEY `name_28` (`name`),
  UNIQUE KEY `name_29` (`name`),
  UNIQUE KEY `name_30` (`name`),
  UNIQUE KEY `name_31` (`name`),
  UNIQUE KEY `name_32` (`name`),
  UNIQUE KEY `name_33` (`name`),
  UNIQUE KEY `name_34` (`name`),
  UNIQUE KEY `name_35` (`name`),
  UNIQUE KEY `name_36` (`name`),
  UNIQUE KEY `name_37` (`name`),
  UNIQUE KEY `name_38` (`name`),
  UNIQUE KEY `name_39` (`name`),
  UNIQUE KEY `name_40` (`name`),
  UNIQUE KEY `name_41` (`name`),
  UNIQUE KEY `name_42` (`name`),
  UNIQUE KEY `name_43` (`name`),
  UNIQUE KEY `name_44` (`name`),
  UNIQUE KEY `name_45` (`name`),
  UNIQUE KEY `name_46` (`name`),
  UNIQUE KEY `name_47` (`name`),
  UNIQUE KEY `name_48` (`name`),
  UNIQUE KEY `name_49` (`name`),
  UNIQUE KEY `name_50` (`name`),
  UNIQUE KEY `name_51` (`name`),
  UNIQUE KEY `name_52` (`name`),
  UNIQUE KEY `name_53` (`name`),
  UNIQUE KEY `name_54` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=156 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` VALUES (1,'고민상담','2025-08-11 22:49:40','2025-08-11 22:49:40'),(2,'인간관계','2025-08-11 22:49:40','2025-08-11 22:49:40'),(3,'진로','2025-08-11 22:49:40','2025-08-11 22:49:40'),(4,'연애','2025-08-11 22:49:40','2025-08-11 22:49:40'),(5,'가족','2025-08-11 22:49:40','2025-08-11 22:49:40'),(6,'건강','2025-08-11 22:49:40','2025-08-11 22:49:40'),(7,'학업','2025-08-11 22:49:40','2025-08-11 22:49:40'),(8,'직장','2025-08-11 22:49:40','2025-08-11 22:49:40'),(9,'취업','2025-08-11 22:49:40','2025-08-11 22:49:40'),(10,'스트레스','2025-08-11 22:49:40','2025-08-11 22:49:40'),(131,'직장스트레스','2025-09-01 16:51:47','2025-09-01 16:51:47'),(132,'고민','2025-09-01 16:51:47','2025-09-01 16:51:47'),(133,'이직','2025-09-01 16:51:47','2025-09-01 16:51:47'),(134,'두려움','2025-09-01 16:51:47','2025-09-01 16:51:47'),(135,'새로운시작','2025-09-01 16:51:47','2025-09-01 16:51:47'),(136,'우정','2025-09-01 16:51:47','2025-09-01 16:51:47'),(137,'배신','2025-09-01 16:51:47','2025-09-01 16:51:47'),(138,'자신감','2025-09-01 16:51:47','2025-09-01 16:51:47'),(139,'실패','2025-09-01 16:51:47','2025-09-01 16:51:47'),(140,'성장','2025-09-01 16:51:47','2025-09-01 16:51:47'),(141,'가족갈등','2025-09-01 16:51:47','2025-09-01 16:51:47'),(142,'꿈','2025-09-01 16:51:47','2025-09-01 16:51:47'),(143,'외로움','2025-09-01 16:51:47','2025-09-01 16:51:47'),(144,'혼자살기','2025-09-01 16:51:47','2025-09-01 16:51:47'),(145,'쓸쓸함','2025-09-01 16:51:47','2025-09-01 16:51:47'),(146,'불안','2025-09-01 16:51:47','2025-09-01 16:51:47'),(147,'걱정','2025-09-01 16:51:47','2025-09-01 16:51:47'),(148,'미래','2025-09-01 16:51:47','2025-09-01 16:51:47'),(149,'방향성','2025-09-01 16:51:47','2025-09-01 16:51:47'),(150,'진로고민','2025-09-01 16:51:47','2025-09-01 16:51:47'),(151,'학교','2025-09-10 06:53:52','2025-09-10 06:53:52'),(152,'사랑','2025-09-10 11:20:38','2025-09-10 11:20:38'),(153,'여자친구','2025-09-30 06:56:45','2025-09-30 06:56:45'),(154,'여친','2025-11-17 05:04:45','2025-11-17 05:04:45'),(155,'결혼','2025-11-17 05:04:45','2025-11-17 05:04:45');
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_achievements`
--

DROP TABLE IF EXISTS `user_achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_achievements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `achievement_type` varchar(50) NOT NULL COMMENT '배지 타입 (streak_7, streak_30, emotion_100 등)',
  `achievement_name` varchar(100) NOT NULL COMMENT '배지 이름',
  `achievement_icon` varchar(10) NOT NULL COMMENT '배지 아이콘 (이모지)',
  `earned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_achievements` (`user_id`,`achievement_type`),
  CONSTRAINT `user_achievements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_achievements`
--

LOCK TABLES `user_achievements` WRITE;
/*!40000 ALTER TABLE `user_achievements` DISABLE KEYS */;
INSERT INTO `user_achievements` VALUES (1,2055,'first_post','첫 발걸음','🎉','2025-11-18 05:33:15');
/*!40000 ALTER TABLE `user_achievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_blocks`
--

DROP TABLE IF EXISTS `user_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_blocks` (
  `user_id` int(11) NOT NULL,
  `blocked_user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  UNIQUE KEY `unique_user_block` (`user_id`,`blocked_user_id`),
  KEY `idx_user_blocks_user` (`user_id`),
  KEY `idx_user_blocks_blocked` (`blocked_user_id`),
  CONSTRAINT `user_blocks_blocked_user_fk` FOREIGN KEY (`blocked_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_blocks_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CONSTRAINT_1` CHECK (`user_id` <> `blocked_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_blocks`
--

LOCK TABLES `user_blocks` WRITE;
/*!40000 ALTER TABLE `user_blocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_goal`
--

DROP TABLE IF EXISTS `user_goal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_goal` (
  `goal_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `target_emotion_id` tinyint(3) unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `progress` tinyint(3) unsigned DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`goal_id`),
  KEY `target_emotion_id` (`target_emotion_id`),
  KEY `idx_user_date` (`user_id`,`start_date`),
  CONSTRAINT `user_goal_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_goal_ibfk_2` FOREIGN KEY (`target_emotion_id`) REFERENCES `emotions` (`emotion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_goal`
--

LOCK TABLES `user_goal` WRITE;
/*!40000 ALTER TABLE `user_goal` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_goal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_goals`
--

DROP TABLE IF EXISTS `user_goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_goals` (
  `goal_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `target_emotion_id` tinyint(3) unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `progress` decimal(5,4) NOT NULL DEFAULT 0.0000,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`goal_id`),
  KEY `user_id` (`user_id`),
  KEY `target_emotion_id` (`target_emotion_id`),
  CONSTRAINT `user_goals_ibfk_133` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `user_goals_ibfk_134` FOREIGN KEY (`target_emotion_id`) REFERENCES `emotions` (`emotion_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_goals`
--

LOCK TABLES `user_goals` WRITE;
/*!40000 ALTER TABLE `user_goals` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_goals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_intentions`
--

DROP TABLE IF EXISTS `user_intentions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_intentions` (
  `intention_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `period` enum('week','month','year') NOT NULL,
  `intention_text` varchar(500) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`intention_id`),
  UNIQUE KEY `user_intentions_user_id_period` (`user_id`,`period`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_intentions`
--

LOCK TABLES `user_intentions` WRITE;
/*!40000 ALTER TABLE `user_intentions` DISABLE KEYS */;
INSERT INTO `user_intentions` VALUES (1,2052,'week','나의 마음 작성 테스트 화이팅~~','2025-10-20 08:37:49','2025-10-20 08:38:15'),(3,2052,'month','이번달 힘드네','2025-10-20 08:38:31','2025-10-20 08:38:31'),(4,2052,'year','안녕하세요 반가워요','2025-10-20 08:38:44','2025-10-20 08:38:44'),(5,2037,'week','안녕 안녕 이번주 나의 마음은 테스트입니다.','2025-10-21 00:55:25','2025-10-21 00:55:25');
/*!40000 ALTER TABLE `user_intentions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_stats`
--

DROP TABLE IF EXISTS `user_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_stats` (
  `user_id` int(11) NOT NULL,
  `my_day_post_count` int(11) NOT NULL DEFAULT 0,
  `someone_day_post_count` int(11) NOT NULL DEFAULT 0,
  `my_day_like_received_count` int(11) NOT NULL DEFAULT 0,
  `someone_day_like_received_count` int(11) NOT NULL DEFAULT 0,
  `my_day_comment_received_count` int(11) NOT NULL DEFAULT 0,
  `someone_day_comment_received_count` int(11) NOT NULL DEFAULT 0,
  `challenge_count` int(11) NOT NULL DEFAULT 0,
  `last_updated` datetime NOT NULL,
  `my_day_like_given_count` int(11) NOT NULL DEFAULT 0,
  `my_day_comment_given_count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_stats`
--

LOCK TABLES `user_stats` WRITE;
/*!40000 ALTER TABLE `user_stats` DISABLE KEYS */;
INSERT INTO `user_stats` VALUES (2037,13,0,3,0,29,0,18,'2025-11-19 05:18:47',3,22),(2048,0,0,0,0,0,0,0,'2025-10-13 01:59:48',0,0),(2052,0,0,0,0,0,0,1,'2025-10-20 12:55:58',0,4),(2055,3,0,0,0,5,0,1,'2025-11-18 08:42:16',0,8),(2056,1,0,0,0,0,0,1,'2025-11-05 08:17:26',0,0),(2057,0,0,0,0,0,0,0,'2025-11-11 08:22:34',0,0);
/*!40000 ALTER TABLE `user_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_streaks`
--

DROP TABLE IF EXISTS `user_streaks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_streaks` (
  `user_id` int(11) NOT NULL,
  `current_streak` int(11) DEFAULT 0 COMMENT '현재 연속 기록일',
  `longest_streak` int(11) DEFAULT 0 COMMENT '최장 연속 기록일',
  `last_post_date` date DEFAULT NULL COMMENT '마지막 기록 날짜',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_streaks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_streaks`
--

LOCK TABLES `user_streaks` WRITE;
/*!40000 ALTER TABLE `user_streaks` DISABLE KEYS */;
INSERT INTO `user_streaks` VALUES (2037,0,3,'2025-11-10','2025-11-18 08:42:43'),(2055,1,2,'2025-11-17','2025-11-18 05:15:10');
/*!40000 ALTER TABLE `user_streaks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `profile_image_url` varchar(255) DEFAULT NULL,
  `background_image_url` varchar(255) DEFAULT NULL,
  `favorite_quote` varchar(255) DEFAULT NULL,
  `theme_preference` enum('light','dark','system') DEFAULT 'system',
  `privacy_settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`privacy_settings`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `notification_settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`notification_settings`)),
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `is_email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `email_verification_code` varchar(6) DEFAULT NULL,
  `email_verification_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `username_3` (`username`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `username_4` (`username`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `username_5` (`username`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `username_6` (`username`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `username_7` (`username`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `username_8` (`username`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `username_9` (`username`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `username_10` (`username`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `username_11` (`username`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `username_12` (`username`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `username_13` (`username`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `username_14` (`username`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `username_15` (`username`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `username_16` (`username`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `username_17` (`username`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `username_18` (`username`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `username_19` (`username`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `username_20` (`username`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `username_21` (`username`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `username_22` (`username`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `username_23` (`username`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `username_24` (`username`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `users_email` (`email`),
  UNIQUE KEY `users_username` (`username`),
  UNIQUE KEY `username_25` (`username`),
  UNIQUE KEY `email_25` (`email`),
  KEY `users_is_active_created_at` (`is_active`,`created_at`),
  KEY `users_created_at` (`created_at`),
  KEY `users_reset_token` (`reset_token`)
) ENGINE=InnoDB AUTO_INCREMENT=2059 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2037,'testuser','test@example.com','$2b$10$TzW3S2qS.E0rqOxwxHmtneXnqZjwYkqy1rbUWURvSxOmcB70gaAqC','울트라 키펜','/api/uploads/profiles/profile_2037_1763084984071.webp',NULL,'안녕하세요 반갑습니다 \n10월 30일입니다','system','{}',1,'2025-11-19 05:18:43','2025-08-20 14:56:23','2025-11-19 05:19:13','{\"like_notifications\":true,\"comment_notifications\":true,\"challenge_notifications\":true,\"encouragement_notifications\":true,\"quiet_hours_start\":\"22:00\",\"quiet_hours_end\":\"08:00\",\"daily_reminder\":\"20:00\"}',NULL,NULL,0,NULL,NULL),(2048,'nirco','nirco@naver.com','$2b$10$0AXDUOYLjUiaqaf/UBGkd.3p4ZKXEByMbfzFyNHuQKfTYg3PoxCUq','nirco',NULL,NULL,NULL,'system','{}',1,NULL,'2025-10-13 01:59:48','2025-10-13 01:59:48','{\"like_notifications\":true,\"comment_notifications\":true,\"challenge_notifications\":true,\"encouragement_notifications\":true}',NULL,NULL,0,NULL,NULL),(2049,'행복한하루','happy@test.com','$2b$10$w9D.qTLHhBYv/oMsINDsAexPlBkZpswQ9pxKqADPZ347mUFjc78/O','행복한하루',NULL,NULL,NULL,'system','{}',1,NULL,'2025-10-13 04:17:03','2025-10-13 04:17:03','{\"like_notifications\":true,\"comment_notifications\":true,\"challenge_notifications\":true,\"encouragement_notifications\":true}',NULL,NULL,0,NULL,NULL),(2050,'슬픈고양이','sad@test.com','$2b$10$mUVunWTn/taOPiHLUz6B3u7rKcqm6wG3V7CGOd9BDa2831ij0vxDq','슬픈고양이',NULL,NULL,NULL,'system','{}',1,NULL,'2025-10-13 04:17:03','2025-10-13 04:17:03','{\"like_notifications\":true,\"comment_notifications\":true,\"challenge_notifications\":true,\"encouragement_notifications\":true}',NULL,NULL,0,NULL,NULL),(2051,'즐거운친구','joy@test.com','$2b$10$34uNnOK0Mh7ly0hbbbrYS.32Jj9o9QktaCYAocniRWpooV0N8dmGS','즐거운친구',NULL,NULL,NULL,'system','{}',1,NULL,'2025-10-13 04:17:04','2025-10-13 04:17:04','{\"like_notifications\":true,\"comment_notifications\":true,\"challenge_notifications\":true,\"encouragement_notifications\":true}',NULL,NULL,0,NULL,NULL),(2052,'test2','test2@naver.com','$2b$10$si97NHS6CcSNLJOsSJWBuOUsUj/LY.XqlC8oLGXCROzNdGX6222oi','test2','/api/uploads/profiles/profile_2052_1760620881613.jpg',NULL,'','system','{}',1,'2025-10-19 13:59:30','2025-10-13 13:50:41','2025-10-19 13:59:30','{\"like_notifications\":true,\"comment_notifications\":true,\"challenge_notifications\":true,\"encouragement_notifications\":true,\"quiet_hours_start\":\"22:00\",\"quiet_hours_end\":\"08:00\",\"daily_reminder\":\"20:00\"}',NULL,NULL,0,NULL,NULL),(2054,'notifytest','notifytest@example.com','$2b$10$C8imxfjgpYpe58pPPpaXzuf7AaeaNCi3yw1tFz5SchUJpkwUNVkwG','�˸��׽�Ʈ',NULL,NULL,NULL,'system','{}',1,NULL,'2025-10-16 14:03:45','2025-10-16 14:05:16','{\"like_notifications\":true,\"comment_notifications\":true,\"challenge_notifications\":true,\"encouragement_notifications\":true,\"quiet_hours_start\":\"22:30\",\"quiet_hours_end\":\"07:00\",\"daily_reminder\":\"19:00\"}',NULL,NULL,0,NULL,NULL),(2055,'키펜무브','hoozday@naver.com','$2b$10$.eZszT8d6ghlkKnQP0eN4OS/aTEcJU9nDN0rkyl3.aX8swKjGh6Nm','키펜무브','',NULL,'ㄹㅎㄹㅇㅅㅅㅅㅇㅇㄹㄹㄹ','system','{}',1,'2025-11-17 14:06:16','2025-10-23 08:24:04','2025-11-17 14:06:16','{\"like_notifications\":true,\"comment_notifications\":true,\"challenge_notifications\":true,\"encouragement_notifications\":true,\"quiet_hours_start\":\"22:00\",\"quiet_hours_end\":\"08:00\",\"daily_reminder\":\"20:00\"}',NULL,NULL,1,NULL,NULL),(2056,'kipen','hoozday@hanmail.net','$2b$10$PtU5/dxijNf3Gfs43C/e/.Q7OeaPwjt5EAy/JVOixGq9ybmXGk9UC','키펜달펜','/api/uploads/profiles/profile_2056_1762304998699.jpg',NULL,'4일 권향엽 더불어민주당 의원이 확보한 경호처 내부 문건과 경향신문 취재를 종합하면, 경호처는 2022년 일부 개방된 용산공원 출입구에 심박수 기반 긴장도 측정 장비를 설치할 계획을 세웠다. ','system','{}',1,'2025-11-04 14:16:20','2025-10-27 07:21:59','2025-11-05 01:09:58','{\"like_notifications\":true,\"comment_notifications\":true,\"challenge_notifications\":true,\"encouragement_notifications\":true,\"quiet_hours_start\":\"22:00\",\"quiet_hours_end\":\"08:00\",\"daily_reminder\":\"20:00\"}',NULL,NULL,1,NULL,NULL),(2057,'admin','admin@iexist.co.kr','$2a$10$y5RLSl4JS7oDb0Hy4/sg.O1mLVyCCxo/5SatMI5HSHl6PPHHmSNau','관리자',NULL,NULL,NULL,'system','\"{\\\"show_profile\\\":true,\\\"show_emotions\\\":true,\\\"show_posts\\\":true,\\\"show_challenges\\\":true}\"',1,NULL,'2025-11-11 08:22:34','2025-11-11 08:22:34','\"{\\\"like_notifications\\\":true,\\\"comment_notifications\\\":true,\\\"challenge_notifications\\\":true,\\\"encouragement_notifications\\\":true}\"',NULL,NULL,0,NULL,NULL),(2058,'testuser_1763291339995','test_1763291339995@example.com','$2b$10$lElYHAt1KJIE6NoOvlp5CubLJwCU.4FNuZRAb.rOOevpNts53w/0C','testuser_1763291339995',NULL,NULL,NULL,'system','{}',1,'2025-11-16 11:09:00','2025-11-16 11:09:00','2025-11-16 11:09:03','{\"like_notifications\":true,\"comment_notifications\":false,\"challenge_notifications\":true,\"encouragement_notifications\":true,\"quiet_hours_start\":\"23:30\",\"quiet_hours_end\":\"07:30\",\"daily_reminder\":\"19:00\"}',NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-19 15:21:05
