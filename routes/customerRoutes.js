const express = require("express");
const router = express.Router();
const fs = require('fs');
const path = require('path');

const db = require("../config/db");
const { isAuthenticated, isCustomer } = require("../middlewares/auth");

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

// Halaman pemutar video
router.get('/videos/:videoId/watch', async (req, res) => { 
});


module.exports = router;
