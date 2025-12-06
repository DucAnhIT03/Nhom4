-- ============================================================
-- Migration: Thêm các trường nationality và age vào bảng artists
-- ============================================================
-- File này dùng để cập nhật database đã tồn tại
-- Chạy file này nếu bảng artists đã được tạo trước đó

USE music_app;

-- Kiểm tra và thêm cột nationality nếu chưa tồn tại
SET @dbname = DATABASE();
SET @tablename = 'artists';
SET @columnname = 'nationality';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) NULL AFTER avatar')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Kiểm tra và thêm cột age nếu chưa tồn tại
SET @columnname = 'age';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NULL AFTER nationality')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Hoặc cách đơn giản hơn (nếu không muốn dùng prepared statement):
-- ALTER TABLE artists ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) NULL AFTER avatar;
-- ALTER TABLE artists ADD COLUMN IF NOT EXISTS age INT NULL AFTER nationality;

-- Lưu ý: MySQL không hỗ trợ "IF NOT EXISTS" trong ALTER TABLE ADD COLUMN
-- Nên phải dùng cách trên hoặc chạy từng lệnh và bỏ qua lỗi nếu cột đã tồn tại

