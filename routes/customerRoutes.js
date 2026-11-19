const express = require("express");
const router = express.Router();
const fs = require('fs');
const path = require('path');

const db = require("../config/db");
const { isAuthenticated, isCustomer } = require("../middlewares/auth");
const { bytes } = require("stream/consumers");

// Proteksi route khusus Customer
router.use(isAuthenticated, isCustomer);

// Video Catalog for Customer
router.get("/", async (req, res) => {
    const userId = req.session.user.id;

    try {
        // Ambil semua video beserta status request TERBARU dari customer yang sedang login
        const result = await db.query(
            `
            SELECT
                v.id,
                v.title,
                v.description,
                v.created_at,
                latest_req.id AS request_id,
                latest_req.status AS request_status,
                latest_req.expires_at,
                (latest_req.status = 'approved' AND latest_req.expires_at > NOW()) AS is_active
            FROM videos v
            LEFT JOIN LATERAL (
                SELECT id, status, expires_at
                FROM video_requests vr
                WHERE vr.video_id = v.id AND vr.user_id = $1
                ORDER BY vr.requested_at DESC
                LIMIT 1
            ) latest_req ON true
            ORDER BY v.id DESC
            `,
            [userId],
        );

        res.render("customer/dashboard", {
            videos: result.rows,
            msg: req.query.msg || null,
            err: req.query.err || null,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Terjadi kesalahan pada server.");
    }
});

// Customer Mengajukan Request / Re-quest akses video
router.post("/videos/:videoId/request", async (req, res) => {
    const userId = req.session.user.id;
    const { videoId } = req.params;

    try {
        // Cek apakah masih ada request pending atau akses yang masih aktif
        const checkRes = await db.query(
            `
            SELECT id FROM video_requests
            WHERE user_id = $1 AND video_id = $2
              AND (status = 'pending' OR (status = 'approved' AND expires_at > NOW()))
                `,
            [userId, videoId],
        );

        if (checkRes.rows.length > 0) {
            return res.redirect(
                "/customer?err=Kamu sudah memiliki permintaan aktif atau sedang menunggu persetujuan untuk video ini",
            );
        }

        // Tandai request lama yang sudah lewat waktu sebagai 'expired'
        await db.query(
            `
            UPDATE video_requests
            SET status = 'expired'
            WHERE user_id = $1 AND video_id = $2 AND status = 'approved' AND expires_at <= NOW()
            `,
            [userId, videoId],
        );

        // Buat permintaan akses baru
        await db.query(
            "INSERT INTO video_requests (user_id, video_id, status) VALUES ($1, $2, 'pending')",
            [userId, videoId],
        );

        res.redirect(
            "/customer?msg=Permintaan akses berhasil dikirim ke Admin",
        );
    } catch (error) {
        console.error(error);
        res.redirect("/customer?err=Gagal mengirim permintaan akses");
    }
});

// ==============================
// Halaman pemutar video
router.get('/videos/:videoId/watch', async (req, res) => {
    const userId = req.session.user.id;
    const { videoId } = req.params;
   
    try {
        // Cek apakah customer memiliki izin aktif yang belum kedaluwarsa
        const accessRes = await db.query(`
            SELECT 
                vr.id AS request_id,
                vr.expires_at,
                v.id AS video_id,
                v.title,
                v.description,
                v.file_path
            FROM video_requests vr
            JOIN videos v ON vr.video_id = v.id
            WHERE vr.user_id = $1 
              AND vr.video_id = $2 
              AND vr.status = 'approved' 
              AND vr.expires_at > NOW()
            ORDER BY vr.expires_at DESC
            LIMIT 1
        `, [userId, videoId]);

        if (accessRes.rows.length === 0) {
            // Tandai srequest yang sudah lewat waktu sebagai 'expired'
            await db.query(
                `
                UPDATE video_requests
                SET status = 'expired'
                WHERE user_id = $1 AND video_id = $2 AND status = 'approved' AND expires_at <= NOW()
                `, [userId, videoId]
            );

            return res.redirect('/customer?err=Akses ditolak atas waktu menonton sudah habis, Silahkan request ulang');
        }

        const videoAccess = accessRes.rows[0];

        // Catat riwayat tonton ke tabel access_log
        await db.query(
            "INSERT INTO access_logs (request_id, user_id, video_id) VALUES ($1, $2, $3)",
            [videoAccess.request_id, userId, videoId]
        );

        res.render('customer/watch', {
            video: videoAccess
        });
    } catch (error) {
        console.error(error);
        res.redirect('/customer?err=Terjadi kesalahan saat memutar video');
   }
});

// Streaming video terproteksi
router.get('/videos/:videoId/stream', async (req, res) => {
    const userId = req.session.user.id;
    const { videoId } = req.params;

    try {
        // Validasi ulang izin akses setiap kali stream diminta
        const accessRes = await db.query(
            `
            SELECT v.file_path
            FROM video_requests vr
            JOIN videos v ON vr.video_id = v.id
            WHERE vr.user_id = $1 
                AND vr.video_id = $2 
                AND vr.status = 'approved' 
                AND vr.expires_at > NOW()
            LIMIT 1
            `, [userId, videoId]
        );

        if (accessRes.rows.length === 0) {
            return res.status(403).send('Akses video ditolak atau waktu telah habis');
        }

        const videoPath = path.join(__dirname, '../uploads/videos', accessRes.rows[0].file_path);
        if (!fs.existsSync(videoPath)) {
            return res.status(404).send('File video tidak ditemukan di server');
        }

        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            // Mendukung HTTP Range Request untuk seek/scrubbing pemutar video HTML5
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = (end - start) + 1;

            const file = fs.createReadStream(videoPath, { start, end });
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-ranges': 'bytes',
                'Content-length': chunkSize,
                "Content-type": 'video/mp4',
            });

            file.pipe(res);
        } else {
            res.writeHead(200, {
                "Content-length": fileSize,
                "Content-type": 'video/mp4'
            });
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Gagal melakukan streaming video');
    }
});


module.exports = router;
