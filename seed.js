const bcrypt = require("bcrypt");
const db = require("./config/db");

async function seedUsers() {
  try {
    const passwordHash = await bcrypt.hash("password123", 10);

    await db.query(`
        INSERT INTO users (name, username, password_hash, role)
        VALUES
            ('Super Admin', 'admin', $1, 'admin'),
            ('Budi Customer', 'budi', $1, 'customer')
        ON CONFLICT (username)
        DO UPDATE SET password_hash = EXCLUDED.password_hash;
        `,
      [passwordHash],
    );

    console.log("Seed berhasil! Akun siap digunakan:");
    console.log("- Admin    -> username: admin | pass: password123");
    console.log("- Customer -> username: budi  | pass: password123");
    process.exit(0);
  } catch (err) {
    console.error("❌ Gagal melakukan seed:", err.message);
    process.exit(1);
  }
}

seedUsers();
