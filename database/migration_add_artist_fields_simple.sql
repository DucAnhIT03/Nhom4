-- ============================================================
-- Migration: Thêm các trường nationality và age vào bảng artists
-- ============================================================
-- File này dùng để cập nhật database đã tồn tại
-- Chạy file này nếu bảng artists đã được tạo trước đó
-- 
-- HƯỚNG DẪN:
-- 1. Mở phpMyAdmin trong XAMPP
-- 2. Chọn database "music_app"
-- 3. Vào tab "SQL"
-- 4. Copy và paste từng lệnh ALTER TABLE bên dưới
-- 5. Nếu cột đã tồn tại, sẽ báo lỗi nhưng không sao, bỏ qua và chạy lệnh tiếp theo

USE music_app;

-- Thêm cột nationality (quốc tịch)
-- Nếu cột đã tồn tại, sẽ báo lỗi nhưng không ảnh hưởng
ALTER TABLE artists 
ADD COLUMN nationality VARCHAR(100) NULL AFTER avatar;

-- Thêm cột age (tuổi)
-- Nếu cột đã tồn tại, sẽ báo lỗi nhưng không ảnh hưởng
ALTER TABLE artists 
ADD COLUMN age INT NULL AFTER nationality;

-- Kiểm tra kết quả
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'music_app' 
  AND TABLE_NAME = 'artists'
  AND COLUMN_NAME IN ('nationality', 'age')
ORDER BY ORDINAL_POSITION;

