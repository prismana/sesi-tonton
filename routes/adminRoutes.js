const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const db = require("../config/db");
const { isAuthenticated, isAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Protect all route in admin, only admin can access
router.use(isAuthenticated, isAdmin);

// =====================
// Dashboard Admin
// =====================
router.get("/", async (req, res) => {
    try {
        const customerRes = await db.query(
            "SELECT id, name, username, created_at FROM users WHERE role = 'customer' ORDER BY id DESC",
        );
        const videRes = await db.query(
            "SELECT id, title, description, file_path, created_at FROM videos ORDER BY id DESC",
        );
        const requestRes = await db.query(`
      SELECT vr.*, u.name AS customer_name, u.username, v.title AS video_title
                  FROM video_requests vr
                  JOIN users u ON vr.user_id = u.id
                  JOIN videos v ON vr.video_id = v.id
                  ORDER BY vr.requested_at DESC
      `);

        res.render("admin/dashboard", {
            customers: customerRes.rows,
            videos: videRes.rows,
            requests: requestRes.rows,
            msg: req.query.msg || null,
            err: req.query.err || null,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Terjadi kesalahan pada server");
    }
});

// ==========================================
// 2. CRUD DATA CUSTOMER
// =======================

// Create Customer
router.post("/customers", async (req, res) => {
    const { name, username, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await db.query(
            "INSERT INTO users (name, username, password_hash, role) VALUES ($1, $2, $3, 'customer')",
            [name, username, hash],
        );

        res.redirect("/admin?msg=Customer berhasil ditambahkan");
    } catch (error) {
        console.error(error);
        res.redirect(
            "/admin?err=Gagal menambahkan customer (username mungkin sudah terpakai)",
        );
    }
});

// UPDATE Customer
router.put("/customers/:id", async (req, res) => {
    const { id } = req.params;
    const { name, username, password } = req.body;
    try {
        if (password && password.trim() !== "") {
            // Jika password diisi, hash ulang password baru
            const hash = await bcrypt.hash(password, 10);
            await db.query(
                "UPDATE users SET name = $1, username = $2, password_hash = $3 WHERE id = $4 AND role = 'customer'",
                [name, username, hash, id],
            );
        } else {
            // Jika password dikosongkan, jangan ubah password lama
            await db.query(
                "UPDATE users SET name = $1, username = $2 WHERE id = $3 AND role = 'customer'",
                [name, username, id],
            );
        }
        res.redirect("/admin?msg=Data customer berhasil diperbarui");
    } catch (error) {
        console.error(error);
        res.redirect("/admin?err=Gagal memperbarui data customer");
    }
});

// DELETE Customer
router.delete("/customers/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            "DELETE FROM users WHERE id = $1 AND role = 'customer'",
            [id],
        );
        res.redirect("/admin?msg=Customer berhasil dihapus");
    } catch (error) {
        console.error(error);
        res.redirect("/admin?err=Gagal menghapus customer");
    }
});

// ==========================================
// 3. CRUD DATA VIDEO (DENGAN UPLOAD FILE)
// ==========================================

// Add video
router.post("/videos", upload.single("videoFile"), async (req, res) => {
    const { title, description } = req.body;
    if (!req.file) {
        return res.redirect("/admin?err=File video wajib diunggah");
    }

    try {
        await db.query(
            "INSERT INTO videos (title, description, file_path, uploaded_by) VALUES ($1, $2, $3, $4)",
            [title, description, req.file.filename, req.session.user.id],
        );

        res.redirect("/admin?msg=Video berhasil diunggah");
    } catch (error) {
        console.error(error);
        res.redirect("/admin?err=Gagal menyimpan data video");
    }
});

// UPDATE Video (Bisa ganti judul/deskripsi, dan opsional ganti file video)
router.put("/videos/:id", upload.single("videoFile"), async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    try {
        const oldVideoRes = await db.query(
            "SELECT file_path FROM videos WHERE id = $1",
            [id],
        );
        if (oldVideoRes.rows.length === 0) {
            return res.redirect("/admin?err=Video tidak ditemukan");
        }

        let filePath = oldVideoRes.rows[0].file_path;

        // Jika admin mengunggah file video baru, hapus file lama dari disk
        if (req.file) {
            const oldFullPath = path.join(
                __dirname,
                "../uploads/videos",
                filePath,
            );
            if (fs.existsSync(oldFullPath)) {
                fs.unlinkSync(oldFullPath);
            }
            filePath = req.file.filename;
        }

        await db.query(
            "UPDATE videos SET title = $1, description = $2, file_path = $3 WHERE id = $4",
            [title, description, filePath, id],
        );
        res.redirect("/admin?msg=Data video berhasil diperbarui");
    } catch (error) {
        console.error(error);
        res.redirect("/admin?err=Gagal memperbarui video");
    }
});

// DELETE Video (Hapus row dari DB sekaligus hapus file fisik di folder uploads)
router.delete("/videos/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const videoRes = await db.query(
            "SELECT file_path FROM videos WHERE id = $1",
            [id],
        );
        if (videoRes.rows.length > 0) {
            const fullPath = path.join(
                __dirname,
                "../uploads/videos",
                videoRes.rows[0].file_path,
            );
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        await db.query("DELETE FROM videos WHERE id = $1", [id]);
        res.redirect("/admin?msg=Video beserta filenya berhasil dihapus");
    } catch (error) {
        console.error(error);
        res.redirect("/admin?err=Gagal menghapus video");
    }
});

// ==========================================
// 4. PERIZINAN AKSES VIDEO (APPROVE / REJECT)
// ==========================================

// Approve request dengan batas waktu
router.post("/requests/:id/approve", async (req, res) => {
    const { id } = req.params;
    const duration = parseInt(req.body.duration, 10);
    const unit = req.body.unit === "hours" ? "hours" : "minutes";

    if (isNaN(duration) || duration <= 0) {
        return res.redirect(
            "/admin?err=Durasi waktu harus berupa angka lebih dari 0",
        );
    }

    try {
        await db.query(
            `UPDATE video_requests
            SET status = 'approved',
                approved_by = $1,
                expires_at = NOW() + ($2 || ' ' || $3)::INTERVAL
            WHERE id = $4
            `,
            [req.session.user.id, duration, unit, id],
        );

        res.redirect(
            `/admin?msg=Permintaan disetujui selama ${duration} ${unit === "hours" ? "jam" : "menit"}`,
        );
    } catch (error) {
        console.error(error);
        res.redirect("/admin?err=Gagal menyutujui permintaan akses");
    }
});

// Reject request
router.post("/request/:id/reject", async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            "UPDATE video_requests SET status = 'rejected', approved_by = $1 WHERE id = $2",
            [req.session.user.id, id]
        );
        res.redirect("/admin?msg=Permintaan akses ditolak");
    } catch (error) {
        console.error(error);
        res.redirect("/admin?err=Gagal menolak permintaan akses");
    }
});

module.exports = router;
