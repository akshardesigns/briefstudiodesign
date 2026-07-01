# Setup: Login Firebase + Auto-provision dari Lynk.id

## Ringkasan alur
1. Orang beli produk **AdsBrief Studio** di Lynk.id.
2. Lynk.id kirim webhook (event pembayaran sukses) ke fungsi serverless kamu di Vercel.
3. Fungsi itu cek: produk yang dibeli cocok dengan produk ini? (karena Lynk.id-mu
   ada produk lain juga — pembelian produk lain akan di-skip, tidak bikin akun).
4. Kalau cocok: bikin akun Firebase Auth pakai email pembeli (kalau belum ada),
   lalu minta Firebase Identity Toolkit kirim email **"Setel ulang sandi Anda"**
   otomatis ke email itu — ini email bawaan Firebase, gratis, tidak perlu
   layanan email pihak ketiga.
5. Pembeli klik link di email itu, set password sendiri, lalu bisa login di
   halaman AdsBrief Studio pakai email + password itu.

## Langkah setup

### 1. Aktifkan Email/Password sign-in di Firebase
Firebase Console → project **briefstudio** → Authentication → Sign-in method →
aktifkan **Email/Password**.

### 2. Ambil Service Account key (untuk Admin SDK di Vercel)
Firebase Console → ⚙️ Project Settings → Service accounts → **Generate new
private key**. Simpan file JSON-nya (jangan disebar/di-commit ke Git).

### 3. Deploy ke Vercel
Repo ini sekarang berisi static site + folder `/api` (function). Cara
paling simpel: hubungkan repo GitHub `BriefStudioII` ini ke Vercel
(vercel.com → New Project → Import dari GitHub). Vercel otomatis mengenali
`/api/lynk-webhook.js` sebagai serverless function dan sisanya (index.html,
style.css, script.js, auth.js) sebagai static site — jadi Vercel bisa
menggantikan GitHub Pages sekaligus.

> Kalau tetap mau pakai GitHub Pages untuk situsnya, boleh — tapi function
> `/api` **tidak akan jalan** di GitHub Pages. Yang penting webhook Lynk.id-nya
> diarahkan ke domain Vercel-mu, terpisah dari domain GitHub Pages.

### 4. Isi Environment Variables di Vercel
Vercel Dashboard → project-mu → Settings → Environment Variables. Isi sesuai
`.env.example`:
- `FIREBASE_SERVICE_ACCOUNT` — seluruh isi file JSON dari langkah 2, sebagai
  satu baris string.
- `FIREBASE_WEB_API_KEY` — dari Firebase Console → Project Settings → General.
- `LYNK_WEBHOOK_SECRET` — dari dashboard Lynk.id (langkah 5).
- `LYNK_SIGNATURE_HEADER` — nama header signature (cek dashboard Lynk.id-mu;
  default `x-signature`).
- `LYNK_PRODUCT_MATCH` — teks judul produk AdsBrief Studio di Lynk.id-mu,
  supaya pembelian produk lain diabaikan.
- `APP_URL` — URL app-mu (misal `https://briefstudio.vercel.app`).

Deploy ulang setelah isi env vars.

### 5. Daftarkan webhook di Lynk.id
Lynk.id → Settings → Integrations → Webhooks → tambah webhook baru:
- URL: `https://<project-kamu>.vercel.app/api/lynk-webhook`
- Event: pembayaran/transaksi sukses
- Catat **signing secret**-nya → masukkan ke `LYNK_WEBHOOK_SECRET` di Vercel.

### 6. WAJIB: Tes dulu sebelum go-live
Field yang dikirim Lynk.id (nama, email, judul produk) bisa berbeda-beda
formatnya. Di `api/lynk-webhook.js`, buka komentar baris:
```js
// console.log("Lynk webhook payload:", JSON.stringify(payload));
```
Aktifkan (hapus `//`), lakukan transaksi tes (Lynk.id biasanya punya tombol
"Test Webhook", atau beli produkmu sendiri pakai kupon diskon 100%), lalu
cek Vercel → project → Logs untuk lihat payload asli. Sesuaikan fungsi
`extractOrderInfo()` kalau nama field-nya beda dari yang sudah ditebak di
kode.

### 7. (Opsional) Custom isi email
Firebase Console → Authentication → Templates → Password reset — bisa ubah
subjek, nama pengirim, dan isi email supaya sesuai brand AdsBrief Studio.

## Yang perlu diingat
- Ini adalah gate login sisi client di halaman statis — cukup untuk mencegah
  orang random pakai app tanpa beli, tapi bukan proteksi tingkat enterprise
  (source code tetap bisa dilihat siapa saja lewat "view source"). Untuk
  kasusmu (produk digital kecil via Lynk.id) ini wajar dan umum dipakai.
- Kalau ada pembeli yang beli ulang / renewal, sistem otomatis kirim ulang
  link set password — aman dipakai berkali-kali.
