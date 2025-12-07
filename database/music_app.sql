CREATE DATABASE IF NOT EXISTS music_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE music_app;

-- =========================
-- users
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  profile_image VARCHAR(255) NULL,
  age INT NULL,
  nationality VARCHAR(100) NULL,
  bio LONGTEXT NULL,
  status ENUM('VERIFY','ACTIVE','BLOCKED') NOT NULL DEFAULT 'VERIFY',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- roles
-- =========================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_name ENUM('ROLE_ADMIN','ROLE_ARTIST','ROLE_USER') NOT NULL
) ENGINE=InnoDB;

-- =========================
-- USER_ROLE (bảng trung gian user - role)
-- =========================
CREATE TABLE IF NOT EXISTS USER_ROLE (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- otps (mã OTP xác thực email)
-- =========================
CREATE TABLE IF NOT EXISTS otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  type ENUM('REGISTER', 'RESET_PASSWORD') NOT NULL DEFAULT 'REGISTER',
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  INDEX idx_email (email),
  INDEX idx_email_code (email, code)
) ENGINE=InnoDB;

-- =========================
-- genres
-- =========================
CREATE TABLE IF NOT EXISTS genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  genre_name VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) NULL
) ENGINE=InnoDB;

-- =========================
-- artists
-- =========================
CREATE TABLE IF NOT EXISTS artists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  artist_name VARCHAR(255) NOT NULL,
  bio LONGTEXT NULL,
  avatar VARCHAR(255) NULL,
  nationality VARCHAR(100) NULL,
  age INT NULL,
  user_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_artist_name (artist_name),
  INDEX idx_user_id (user_id),
  UNIQUE KEY uk_user_id (user_id),
  CONSTRAINT fk_artist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================
-- albums
-- =========================
CREATE TABLE IF NOT EXISTS albums (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  release_date DATETIME NULL,
  artist_id INT NULL,
  genre_id INT NULL,
  cover_image VARCHAR(255) NULL,
  background_music VARCHAR(255) NULL,
  type ENUM('FREE','PREMIUM') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_album_artist_id (artist_id),
  INDEX idx_album_genre_id (genre_id),
  INDEX idx_album_created_at (created_at),
  CONSTRAINT fk_album_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT fk_album_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,
  CONSTRAINT chk_album_owner CHECK (artist_id IS NOT NULL OR genre_id IS NOT NULL)
) ENGINE=InnoDB;

-- =========================
-- songs
-- =========================
CREATE TABLE IF NOT EXISTS songs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  duration TIME NULL,
  artist_id INT NOT NULL,
  album_id INT NULL,
  genre_id INT NULL,
  cover_image VARCHAR(255) NULL,
  file_url VARCHAR(255) NULL,
  views INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_song_artist_id (artist_id),
  INDEX idx_song_album_id (album_id),
  INDEX idx_song_genre_id (genre_id),
  INDEX idx_song_views (views),
  INDEX idx_song_created_at (created_at),
  CONSTRAINT fk_song_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT fk_song_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  CONSTRAINT fk_song_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================
-- song_genre (n-n song - genre)
-- =========================
CREATE TABLE IF NOT EXISTS song_genre (
  song_id INT NOT NULL,
  genre_id INT NOT NULL,
  PRIMARY KEY (song_id, genre_id),
  INDEX idx_song_genre_song_id (song_id),
  INDEX idx_song_genre_genre_id (genre_id),
  CONSTRAINT fk_song_genre_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  CONSTRAINT fk_song_genre_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- playlists
-- =========================
CREATE TABLE IF NOT EXISTS playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  is_public BIT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_playlist_user_id (user_id),
  INDEX idx_playlist_is_public (is_public),
  CONSTRAINT fk_playlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- playlist_song (n-n playlist - song)
-- =========================
CREATE TABLE IF NOT EXISTS playlist_song (
  playlist_id INT NOT NULL,
  song_id INT NOT NULL,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, song_id),
  INDEX idx_playlist_song_playlist_id (playlist_id),
  INDEX idx_playlist_song_song_id (song_id),
  CONSTRAINT fk_playlist_song_playlist FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  CONSTRAINT fk_playlist_song_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- comments
-- =========================
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  song_id INT NOT NULL,
  content VARCHAR(255) NOT NULL,
  parent_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_comment_song_id (song_id),
  INDEX idx_comment_user_id (user_id),
  INDEX idx_comment_parent_id (parent_id),
  INDEX idx_comment_created_at (created_at),
  CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- wishlists (yêu thích)
-- =========================
CREATE TABLE IF NOT EXISTS wishlists (
  user_id INT NOT NULL,
  song_id INT NOT NULL,
  PRIMARY KEY (user_id, song_id),
  INDEX idx_wishlist_user_id (user_id),
  INDEX idx_wishlist_song_id (song_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- downloads
-- =========================
CREATE TABLE IF NOT EXISTS downloads (
  user_id INT NOT NULL,
  song_id INT NOT NULL,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, song_id),
  INDEX idx_download_user_id (user_id),
  INDEX idx_download_song_id (song_id),
  INDEX idx_download_added_at (added_at),
  CONSTRAINT fk_download_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_download_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- song_histories
-- =========================
CREATE TABLE IF NOT EXISTS song_histories (
  user_id INT NOT NULL,
  song_id INT NOT NULL,
  played_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, song_id, played_at),
  INDEX idx_history_user_id (user_id),
  INDEX idx_history_song_id (song_id),
  INDEX idx_history_played_at (played_at),
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- subscription_plan
-- =========================
CREATE TABLE IF NOT EXISTS subscription_plan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_name VARCHAR(255) NOT NULL,
  price DOUBLE NOT NULL,
  duration_day INT NOT NULL,
  description LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- subscriptions
-- =========================
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan ENUM('FREE','PRENIUM','AIRTIST') NOT NULL,
  start_time DATETIME NULL,
  end_time DATETIME NULL,
  status ENUM('ACTIVE','EXPIRED','CANCELLED') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subscription_user_id (user_id),
  INDEX idx_subscription_status (status),
  INDEX idx_subscription_end_time (end_time),
  CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- payments
-- =========================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  transaction_id VARCHAR(255) NULL,
  amount DOUBLE NOT NULL,
  payment_method ENUM('PAYPAL','CREDIT_CARD','MOMO','ZALO_PAY') NOT NULL,
  payment_status ENUM('PENDING','COMPLETED','FAILED','REFUNDED') NOT NULL,
  payment_date DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_user_id (user_id),
  INDEX idx_payment_plan_id (plan_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_payment_date (payment_date),
  CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_plan FOREIGN KEY (plan_id) REFERENCES subscription_plan(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- banners
-- =========================
CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  content LONGTEXT NULL,
  song_id INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_song_id (song_id),
  CONSTRAINT fk_banner_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- Seed tài khoản admin mặc định (dùng cho môi trường dev/test)
-- ============================================================

-- Thêm các roles nếu chưa tồn tại
INSERT INTO roles (role_name)
SELECT 'ROLE_ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'ROLE_ADMIN');

INSERT INTO roles (role_name)
SELECT 'ROLE_USER'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'ROLE_USER');

INSERT INTO roles (role_name)
SELECT 'ROLE_ARTIST'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'ROLE_ARTIST');

-- Thêm user admin mặc định nếu chưa tồn tại
INSERT INTO users (first_name, last_name, email, password, profile_image, bio, status)
SELECT
  'System',
  'Admin',
  'admin@example.com',
  'Admin123', -- mật khẩu dạng plain text cho môi trường dev
  NULL,
  'Tài khoản quản trị hệ thống nghe nhạc.',
  'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- Gán role ADMIN cho user admin nếu chưa có
INSERT INTO USER_ROLE (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.role_name = 'ROLE_ADMIN'
WHERE u.email = 'admin@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM USER_ROLE ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

