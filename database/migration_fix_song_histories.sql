-- ============================================================
-- Migration: Fix song_histories table
-- Chạy script này để sửa lỗi duplicate key trong song_histories
-- ============================================================

-- Bước 1: Xóa các bản ghi có giá trị played_at = '0000-00-00 00:00:00' (dữ liệu lỗi)
-- Lưu ý: Nếu có nhiều bản ghi trùng, có thể cần xóa thủ công
DELETE FROM song_histories 
WHERE played_at = '0000-00-00 00:00:00' 
   OR played_at = '0000-00-00 00:00:00.000'
   OR played_at IS NULL;

-- Bước 2: Thay đổi cột played_at từ DATETIME sang DATETIME(3) và loại bỏ DEFAULT
-- Lưu ý: Nếu cột đã là DATETIME(3) thì bỏ qua bước này
ALTER TABLE song_histories 
MODIFY COLUMN played_at DATETIME(3) NOT NULL;

-- Bước 3: Kiểm tra kết quả (tùy chọn - chỉ chạy nếu có quyền)
-- DESCRIBE song_histories;
-- Hoặc
-- SHOW CREATE TABLE song_histories;

