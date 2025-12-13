-- ============================================================
-- Migration: Thêm column description và lyrics vào bảng songs
-- Script đơn giản - kiểm tra thủ công trước khi chạy
-- ============================================================

-- Bước 1: Kiểm tra xem column description đã tồn tại chưa
-- Chạy lệnh này trước để kiểm tra:
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'music_app' AND TABLE_NAME = 'songs' AND COLUMN_NAME = 'description';

-- Nếu không có kết quả, chạy lệnh sau:
-- ALTER TABLE songs ADD COLUMN description LONGTEXT NULL AFTER file_url;

-- Bước 2: Kiểm tra xem column lyrics đã tồn tại chưa
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'music_app' AND TABLE_NAME = 'songs' AND COLUMN_NAME = 'lyrics';

-- Nếu không có kết quả, chạy lệnh sau:
-- ALTER TABLE songs ADD COLUMN lyrics LONGTEXT NULL AFTER description;

-- Bước 3: Kiểm tra xem column type đã tồn tại chưa
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'music_app' AND TABLE_NAME = 'songs' AND COLUMN_NAME = 'type';

-- Nếu không có kết quả, chạy lệnh sau:
-- ALTER TABLE songs ADD COLUMN type ENUM('FREE','PREMIUM') NOT NULL DEFAULT 'FREE' AFTER file_url;
-- ALTER TABLE songs ADD INDEX idx_song_type (type);

-- ============================================================
-- HOẶC sử dụng script tự động kiểm tra (migration_add_song_description_lyrics.sql)
-- ============================================================

