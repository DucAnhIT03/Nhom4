-- ============================================================
-- Script: Xóa dữ liệu duplicate trong song_histories
-- Chạy script này TRƯỚC KHI rebuild backend
-- ============================================================

-- Bước 1: Xem số lượng bản ghi duplicate
SELECT user_id, song_id, played_at, COUNT(*) as count
FROM song_histories
WHERE played_at = '0000-00-00 00:00:00' 
   OR played_at = '0000-00-00 00:00:00.000'
GROUP BY user_id, song_id, played_at
HAVING COUNT(*) > 1;

-- Bước 2: Xóa TẤT CẢ bản ghi có played_at = '0000-00-00' (dữ liệu lỗi)
-- CẢNH BÁO: Lệnh này sẽ xóa tất cả dữ liệu lỗi
DELETE FROM song_histories 
WHERE played_at = '0000-00-00 00:00:00' 
   OR played_at = '0000-00-00 00:00:00.000';

-- Bước 3: Kiểm tra lại
SELECT COUNT(*) as remaining_bad_records
FROM song_histories
WHERE played_at = '0000-00-00 00:00:00' 
   OR played_at = '0000-00-00 00:00:00.000';

-- Bước 4: Đảm bảo cột đã được sửa đúng
-- Nếu chưa chạy migration, chạy lệnh này:
-- ALTER TABLE song_histories 
-- MODIFY COLUMN played_at DATETIME(3) NOT NULL;

