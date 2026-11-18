-- Hapus tabel jika sudah ada (untuk reset)
DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS video_requests CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Tabel Users (Admin & Customer)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Videos (Master Data Video)
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Video Requests (Perizinan & Batas Waktu)
CREATE TABLE video_requests (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id INT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Access Logs (Riwayat Menonton - Memenuhi syarat minimal 4 tabel)
CREATE TABLE access_logs (
    id SERIAL PRIMARY KEY,
    request_id INT NOT NULL REFERENCES video_requests(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id INT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data Awal (Password: "password123" yang sudah di-hash dengan bcrypt)
INSERT INTO users (name, username, password_hash, role) VALUES
('Super Admin', 'admin', '$2b$10$EPX2I/pI9C2sC9mJ0S.1u.w1D6gYq8r5t6O7uP0vR1yZ2aB3cD4eF', 'admin'),
('Budi Customer', 'budi', '$2b$10$EPX2I/pI9C2sC9mJ0S.1u.w1D6gYq8r5t6O7uP0vR1yZ2aB3cD4eF', 'customer');
