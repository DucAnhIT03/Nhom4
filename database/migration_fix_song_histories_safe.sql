-- ============================================================
-- Migration: Fix song_histories table (Safe Version)
-- Chạy script này từng bước một để sửa lỗi duplicate key
-- ============================================================

-- Bước 1: Kiểm tra dữ liệu lỗi trước
-- SELECT COUNT(*) FROM song_histories 
-- WHERE played_at = '0000-00-00 00:00:00' 
--    OR played_at = '0000-00-00 00:00:00.000';

-- Bước 2: Xóa các bản ghi lỗi (chạy từng lệnh một nếu có lỗi duplicate)
-- Cách 1: Xóa tất cả bản ghi có played_at = '0000-00-00'
DELETE FROM song_histories 
WHERE played_at = '0000-00-00 00:00:00';

-- Cách 2: Nếu vẫn còn lỗi, xóa từng nhóm duplicate
-- DELETE FROM song_histories 
-- WHERE (user_id, song_id, played_at) IN (
--     SELECT user_id, song_id, played_at
--     FROM (
--         SELECT user_id, song_id, played_at
--         FROM song_histories
--         WHERE played_at = '0000-00-00 00:00:00'
--         GROUP BY user_id, song_id, played_at
--         HAVING COUNT(*) > 1
--     ) AS duplicates
--     LIMIT 1
-- );

-- Bước 3: Thay đổi cột played_at
-- Kiểm tra cấu trúc hiện tại trước:
-- DESCRIBE song_histories;

-- Thực hiện ALTER TABLE
ALTER TABLE song_histories 
MODIFY COLUMN played_at DATETIME(3) NOT NULL;

-- Bước 4: Kiểm tra kết quả
-- DESCRIBE song_histories;

