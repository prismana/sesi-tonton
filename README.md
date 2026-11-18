# Soal Test Web Developer 
Buatlah sebuah web dengan Framework! (Framework bebas) 

## **Ketentuan**:
1. Buatlah sistem perijinan menonton video untuk customer oleh admin (upload video bukan insert link URL)
2. Memiliki 2 user level (admin, customer)
3. Admin memiliki hak akses CRUD (Create, Read, Update, Delete) data customer dan data video, serta bisa memberi akses customer menonton video.
4. Jumlah 4 tabel atau lebih (sesuai pengamatan anda)
5. Customer memiliki akses request menonton video, dan menonton video yang telah disetujui admin.

## **Alur kerja**
1. Admin membuat data customer dan membuat data video
2. Customer meminta akses untuk melihat video
3. Admin menkonfirmasi permintaan akses video dengan skala waktu terbatas (contoh : customer a diberi akses video dengan waktu yang ditentukan admin)
4. Customer melihat video sesuai tenggang waktu yang diberikan
5. Saat waktu habis customer bisa meminta akses ulang ke admin
