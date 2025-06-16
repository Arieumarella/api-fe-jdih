const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require('axios');
const qs = require('qs');
const { GoogleGenAI  } = require("@google/genai");
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
require('dotenv').config();


exports.ChatPantun = async (req, res) => {
    try{

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
          });

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "Tolong buatkan saya satu pantun menarik tentang ucapan apa yang bisa saya bantu, dan jawab langsung pantunnya saja dan jangan keluarkan kata-kata selain kata-kata pantun",
            config: {
              temperature: 0.3,
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
          });  


          return res.status(200).json({
            status: true,
            data: response,
        });


    }catch(err){
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error,
        });
    }
}

exports.Chat = async (req, res) => {
    try {
        
        const pathUrl = await req.body.path;
        const question = await req.body.question;
        let instruksiGemini='';
        const history = req.body.history || []; 
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
          });
        

        if (!question || !pathUrl) {
        
            return res.status(401).json({
                status: false,
                msg: "Empty Parameter",
            });
        }

        // Get data text pdf      
        let postResponse = await axios.post('https://jdih.pu.go.id/internal/AiAPI/getTextApi', 
            qs.stringify({ path: pathUrl }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        let dataAwal = await postResponse.data.data;
        

        if (dataAwal == null || dataAwal == "") {
            return res.status(401).json({
                status: false,
                msg: "Data Gagal di dapatkan",
            });
        }

        instruksiGemini = await instruksiGeminiText();
        let promptDenganKonteks = `
        KONTEKS DOKUMEN:
        ---
        ${dataAwal}
        ---
        
        PERTANYAAN PENGGUNA:
        ${question}
        
        Berdasarkan KONTEKS DOKUMEN di atas dan pengetahuan Anda tentang JDIH Kementerian PU.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: promptDenganKonteks,
            config: {
              systemInstruction: instruksiGemini,
              temperature: 0.3,
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ],
            history: history,
          });   

        return res.status(200).json({
            status: true,
            data: response,
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error,
        });
    }
};

function instruksiGeminiText () {
    const systemInstructionText = `

Ikuti aturan-aturan berikut dengan ketat:

1.  **Identitas:** identifikasi diri Anda sebagai 'AJI (Asisten JDIH Interaktif) Kementerian PU' dalam salam pembuka jika relevan.
2.  **Sumber Data Utama:** Fokus utama Anda adalah dokumen atau teks spesifik yang diberikan kepada Anda dalam prompt saat ini (akan diawali dengan "KONTEKS DOKUMEN:"). Jawaban Anda HARUS didasarkan pada konteks dokumen ini JIKA pertanyaan pengguna relevan dengan dokumen tersebut.
3.  **Sumber Data Sekunder:** Jika pertanyaan tidak secara spesifik tentang dokumen yang diberikan, anda harus membelasa ataupun merekomendasikan hal-hal apa saja yang berkaitan dengan dokumen tersebut.
4.  **Relevansi Pertanyaan:** Analisis pertanyaan pengguna. Prioritaskan jawaban berdasarkan KONTEKS DOKUMEN yang diberikan.
5.  **Jawaban Jika TIDAK Sesuai:** Jika pertanyaan pengguna:
    *   Sama sekali tidak berhubungan dengan JDIH Kementerian PU atau KONTEKS DOKUMEN yang diberikan (misalnya, bertanya resep masakan, berita olahraga, dll.).
    *   Meminta informasi di luar cakupan tersebut.
    Maka, Anda HARUS menjawab dengan variasi dari pesan berikut: "Anda harus membelasa ataupun merekomendasikan hal-hal apa saja yang berkaitan dengan dokumen tersebut." Jangan mencoba menjawab pertanyaan tersebut.
6.  **Batasan Konten (Keamanan):** Anda DILARANG KERAS menghasilkan atau menanggapi pertanyaan yang mengandung unsur SARA, konten seksual, ujaran kebencian, diskriminasi, permusuhan, promosi kekerasan/ilegal, atau informasi pribadi sensitif. Jika Anda mendeteksi pertanyaan semacam ini, tolak untuk menjawab dengan respons netral seperti: "Maaf, saya tidak dapat memproses permintaan tersebut."
7.  **Bahasa:** Gunakan Bahasa Indonesia yang formal, jelas, dan profesional.
8. jika di tanya anda bisa apa saja? jawab dengan saya bisa membantu memberikan informasi terkait (judul peraturan di sesuaikan dengan data yang ada)
9. Tolong format jawaban disesuaikan dengan tag HTML yang mudah dibaca dan paragraf yang jelas.
Langsung berikan hasil HTML bersih tanpa awalan apapun.
Pastikan juga tidak membungkus keseluruhan jawaban dengan tanda kutip.
Perhatikan juga penggunaan tag <br> atau <p> untuk memisahkan kalimat agar tampilan lebih nyaman dibaca.

`;

    return systemInstructionText;
}


exports.ChatGeneral = async (req, res) => {
    try {
        const { question, history: clientHistory = [] } = req.body;
        // const history2 = req.body.history || []; // <-- Ini tidak perlu, clientHistory sudah cukup.

        if (!question || typeof question !== 'string' || question.trim() === "") {
            return res.status(400).json({ status: false, message: "Pertanyaan tidak boleh kosong." });
        }

        // --- PERBAIKAN DIMULAI DI SINI ---
        // 1. Cari indeks dari pesan 'user' yang pertama di dalam history yang dikirim klien.
        const firstUserIndex = clientHistory.findIndex(msg => msg.role === 'user');

        // 2. Buat 'validHistory' yang akan diberikan ke Google AI.
        //    - Jika tidak ada pesan 'user' (misal, ini chat pertama kali), hasilnya adalah array kosong.
        //    - Jika ada, potong arraynya mulai dari pesan 'user' yang pertama.
        const validHistory = (firstUserIndex === -1) 
            ? [] 
            : clientHistory.slice(firstUserIndex);
        // --- AKHIR PERBAIKAN ---

        const systemInstruction = instruksiGeminiTextGeneral();
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: systemInstruction,
            // ... safety settings dan generationConfig ...
        });

        // 3. Gunakan 'validHistory' yang sudah bersih, bukan 'clientHistory'
        const chat = model.startChat({ history: validHistory });
        const result = await chat.sendMessage(question);
        
        // ... (sisa kode Anda dari sini ke bawah sebagian besar sudah benar) ...
        const geminiSdkResponse = result.response;
        let generatedText = geminiSdkResponse.text();
        let objResponse = null;

        if (!generatedText) {
            const fallbackMessage = "Aduh, maaf nih, aku lagi agak bingung dan nggak bisa kasih respons sekarang. Coba tanya lagi nanti ya!";
            return res.status(200).json({
                status: true,
                type: "text_response",
                message: fallbackMessage,
                querySql: null,
            });
        }

        let cleanedText = generatedText.trim();
        let processedText = cleanedText.trim(); 
        let isSqlQuery = false;
        let finalQuerySql = null;

        // 2. Coba ekstrak query dari markdown, JIKA ADA
        const markdownRegex = /^```(?:sql)?\s*([\s\S]*?)\s*```$/;
        const match = processedText.match(markdownRegex);

        if (match && match[1]) {
            // Jika ada markdown, ambil isinya saja
            processedText = match[1].trim();
        }

        // 3. Lakukan pengecekan final pada teks yang sudah bersih
        //    Ini akan berhasil untuk teks mentah MAUPUN teks yang sudah diekstrak dari markdown.
        const upperCaseText = processedText.toUpperCase();
        if (upperCaseText.startsWith("SELECT") || upperCaseText.startsWith("WITH")) {
            isSqlQuery = true;
            finalQuerySql = processedText; // Gunakan teks yang sudah diproses
        }


        if (isSqlQuery) {
            const isCapabilityQuery = finalQuerySql.toUpperCase().includes("AS KAPABILITAS_CHATBOT");
            if (isCapabilityQuery) {
                const capabilityMessageMatch = finalQuerySql.match(/^SELECT\s+'([\s\S]+)'\s+AS\s+kapabilitas_chatbot;?$/i);
                const extractedMessage = capabilityMessageMatch?.[1] || "Informasi kapabilitas tersedia.";
                objResponse = {
                    status: true, type: "capability_info", message: extractedMessage, querySql: finalQuerySql,
                };
                
            } else {
                objResponse = {
                    status: true, type: "data_query", querySql: finalQuerySql,
                };

                
            }
        } else {
            objResponse = {
                status: true, type: "text_response", message: cleanedText, querySql: null,
            };

           
        }

        if (objResponse.type === "data_query") {
            const querySql = objResponse.querySql;
            const queryResult = await prisma.$queryRawUnsafe(querySql);
            
            // --- SARAN PERBAIKAN KECIL ---
            // Gunakan history yang sudah valid untuk memberikan konteks yang lebih baik
            // ke fungsi generator teks Anda selanjutnya.
            const prosesAi = await gneretaeTextHasilQuery(queryResult, validHistory, question);
            // -----------------------------

           

            return res.status(200).json({
                status: true,
                type: "text_response",
                message: prosesAi?.candidates?.[0]?.content?.parts?.[0]?.text, 
                querySql: null, // querySql sudah dieksekusi, jadi kembalikan null
            });
        } else {
            return res.status(200).json(objResponse);
        }
        
    } catch (error) {
        console.error("Error di ChatGeneral:", error);
        let errorMessage = "Waduh, maaf banget nih, ada sedikit gangguan teknis di sistemku. Coba beberapa saat lagi ya!";
        return res.status(500).json({
            status: false,
            type: "error_response",
            message: errorMessage,
            querySql: null,
        });
    }
};




function instruksiGeminiTextGeneral() {
    // ... (kode untuk membaca prismaSchemaContent tetap sama) ...

     const prismaSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    let prismaSchemaContent = '';

    try {
        prismaSchemaContent = fs.readFileSync(prismaSchemaPath, 'utf-8');
    } catch (error) {
        console.error("Gagal membaca file schema.prisma dari:", prismaSchemaPath, "Error:", error.message);
        prismaSchemaContent = "// Gagal memuat skema Prisma. Harap periksa path file dan pastikan file ada.";
    }

const systemInstructionText = `# PRINSIP OPERASI INTI: ASISTEN PENCARI HUKUM CERDAS

Kamu adalah AJI (Assisten JDIH Interaktif), sebuah asisten yang cerdas, proaktif, dan sangat bersahabat.

1.  **MISI UTAMA:** Misi Anda adalah **membantu pengguna menemukan dokumen hukum** secepat mungkin.
    *   **Mode Eksekusi SQL:** Jika permintaan pengguna mengandung kata kunci yang bisa dicari, Anda **selalu memprioritaskan** untuk menerjemahkannya menjadi **satu baris string query SQL SELECT mentah**.
    *   **Mode Klarifikasi:** Mode ini **hanya digunakan** jika pengguna menyebut jenis peraturan TAPI tidak menyebut topik spesifiknya.
    *   **Mode Interaktif:** Jika pengguna hanya menyapa atau bertanya, Anda merespons dengan ramah.

2.  **MINDSET WAJIB:** Anda adalah **pemandu proaktif**. Tugas Anda adalah mengeksekusi pencarian jika memungkinkan. Jangan bertanya jika Anda bisa langsung memberikan hasil.

3.  **PANDUAN RESPONS:**
    *   **JANGAN** menghasilkan teks apa pun selain query SQL jika permintaan bisa diubah menjadi query.
    *   **JANGAN** menggunakan markdown \`\`\`sql\`\`\` atau titik koma (;) di akhir query.
    *   **FORMAT HTML WAJIB UNTUK TEKS:** Semua respons teks **WAJIB** menggunakan tag HTML seperti <p> dan <br>. **JANGAN PERNAH** menggunakan karakter \\n.

---

# ALUR KERJA BERBASIS KEJELASAN (IKUTI TANPA GAGAL)

1.  **ANALISIS INPUT:** Pindai input pengguna untuk mengidentifikasi **Tipe Peraturan** dan **Kata Kunci Tematik**.

2.  **PENENTUAN MODE (Prioritas pada SQL):**
    *   **PICU MODE SQL (PRIORITAS TERTINGGI):** Mode ini aktif jika input mengandung:
        *   **Kasus A (Spesifik):** Minimal satu **Tipe Peraturan** DAN minimal satu **Kata Kunci Tematik**. (Contoh: "perpres tentang jalan").
        *   **Kasus B (Umum):** Hanya mengandung **Kata Kunci Tematik** saja, tanpa Tipe Peraturan. (Contoh: "info soal jembatan").
    *   **PICU MODE KLARIFIKASI:** Mode ini hanya aktif jika input hanya mengandung **Tipe Peraturan** saja, tanpa Kata Kunci Tematik. (Contoh: "uu terbaru").
    *   **PICU MODE INTERAKTIF:** Mode ini aktif jika input **TIDAK MENGANDUNG** kata kunci pencarian sama sekali. (Contoh: "halo", "kamu bisa apa?").

3.  **EKSEKUSI MODE:**
    *   **JIKA MODE SQL:** Bangun query SQL sesuai aturan (Spesifik atau Umum). **Ini adalah satu-satunya output Anda.**
    *   **JIKA MODE KLARIFIKASI:** Pilih respons teks HTML dari **RESPONS KLARIFIKASI**.
    *   **JIKA MODE INTERAKTIF:** Pilih respons teks HTML dari **RESPONS INTERAKTIF**.

---

# KAMUS & KATA KUNCI

### KAMUS TIPE PERATURAN
*   "peraturan_category_id = 1": "uu", "undang-undang"
*   "peraturan_category_id = 3": "pp", "peraturan pemerintah"
*   "peraturan_category_id = 4": "perpres", "peraturan presiden"
*   "peraturan_category_id = 8": "permen", "peraturan menteri"
*   "peraturan_category_id = 11": "se menteri", "sementeri", "surat edaran menteri"
*   "peraturan_category_id = 22": "mou", "nota kesepahaman"

### DAFTAR KATA KUNCI TEMATIK
*   "irigasi", "sumber daya air", "sda", "jalan", "jembatan", "jalan tol", "bendungan", "drainase", "air minum", "sanitasi", "bangunan gedung", "jasa konstruksi", "berita", "artikel", "monografi", "putusan", "agenda".

---

# KONTEKS: SKEMA & LOGIKA

**Skema:**
ppj_peraturan {
  peraturan_id            Int                        @id @default(autoincrement())
  tipe_dokumen            ppj_peraturan_tipe_dokumen
  judul                   String?                    @db.Text
  teu                     String                     @db.VarChar(255)
  dept_id                 String?                    @db.VarChar(255)
  peraturan_category_id   Int?
  tentang                 String?                    @db.Text
  noperaturan             String?                    @db.Text
  tanggal                 String?                    @db.VarChar(35)
  lembar_negara           String?                    @db.VarChar(250)
  lembar_negara_tambahan  String?                    @db.VarChar(250)
  berita_negara           String?                    @db.VarChar(250)
  file_upload             String?                    @db.Text
  abstrak                 String?                    @db.Text
  katalog                 String?                    @db.Text
  tanggal_penetapan       String?                    @db.VarChar(35)
  tanggal_pengundangan    String?                    @db.VarChar(35)
  tags                    String?                    @db.Text
  kondisi                 ppj_peraturan_kondisi?
  status                  ppj_peraturan_status
  sifat                   ppj_peraturan_sifat?
  checksum                String?                    @db.Text
  status_dicabut_id       String?                    @db.Text
  status_dicabut_tentang  String?                    @db.Text
  status_dicabut_date     String?                    @db.VarChar(35)
  status_diubah_id        String?                    @db.Text
  status_diubah_tentang   String?                    @db.Text
  status_diubah_date      String?                    @db.VarChar(35)
  status_mencabut_id      String?                    @db.Text
  status_mencabut_tentang String?                    @db.Text
  status_mencabut_date    String?                    @db.VarChar(35)
  status_mengubah_id      String?                    @db.Text
  status_mengubah_tentang String?                    @db.Text
  status_mengubah_date    String?                    @db.VarChar(35)
  view_count              Int?
  download_count          Int?
  created_by              Int?
  updated_by              Int?
  tgl_buat                String?                    @db.VarChar(35)
  tgl_modifikasi          String?                    @db.VarChar(35)
  check_banner            String                     @db.VarChar(2)
  nomor_panggil           String                     @db.VarChar(255)
  singkatan               String                     @db.VarChar(255)
  cetakan                 String                     @db.VarChar(100)
  tempat_terbit           String                     @db.VarChar(255)
  penerbit                String                     @db.VarChar(255)
  deskripsi_fisik         String                     @db.Text
  sumber                  String                     @db.VarChar(255)
  subjek                  String                     @db.VarChar(255)
  isbn                    String                     @db.VarChar(255)
  bahasa                  String                     @db.VarChar(255)
  lokasi                  String                     @db.VarChar(255)
  bidang_hukum            String                     @db.VarChar(255)
  nomor_induk_buku        String                     @db.VarChar(255)
  file_abstrak            String                     @db.VarChar(255)
  file_zip                String                     @db.VarChar(255)
  approval_1              String                     @db.Char(1)
  approval_2              String                     @db.Char(1)
  nomor                   String                     @db.VarChar(100)
  link_url                String                     @db.VarChar(255)
  keyword                 String                     @db.Text
  slug                    String?                    @unique

  @@index([dept_id], map: "fk_ppj_peraturan_ppj_departemen1_idx")
  @@index([peraturan_category_id], map: "fk_ppj_peraturan_ppj_peraturan_category1_idx")
  @@index([created_by], map: "fk_ppj_peraturan_ppj_users1_idx")
  @@index([updated_by], map: "fk_ppj_peraturan_ppj_users2_idx")
  @@fulltext([judul, tentang], map: "judul")
}

ppj_peraturan_category {
  peraturan_category_id Int                                        @id @default(autoincrement())
  percategoryname       String?                                    @db.Text
  percategorycode       String?                                    @db.Text
  percategorygroup      String?                                    @db.Text
  percategorydept       String?                                    @db.Text
  percategorykondisi    ppj_peraturan_category_percategorykondisi?
  order                 Int?
  tgl_buat              String?                                    @db.VarChar(35)
  tgl_modifikasi        String?                                    @db.VarChar(35)
  pembuat               String                                     @db.VarChar(255)
  pengubah              String                                     @db.VarChar(255)
  tipe                  ppj_peraturan_category_tipe
  singkatan             String?                                    @db.VarChar(100)
  singkatan_file        String?                                    @db.VarChar(100)
}

tb_berita {
  id             Int     @id @default(autoincrement())
  judul          String  @db.VarChar(255)
  isi            String  @db.Text
  gambar_1       String  @db.VarChar(35)
  gambar_2       String  @db.VarChar(35)
  gambar_3       String  @db.VarChar(35)
  gambar_4       String  @db.VarChar(35)
  gambar_5       String  @db.VarChar(35)
  pembuat        String  @db.VarChar(35)
  tgl_buat       String  @db.VarChar(35)
  pengubah       String  @db.VarChar(35)
  tgl_modifikasi String  @db.VarChar(35)
  nomor          String  @db.VarChar(35)
  views          Float?  
  slug           String? @unique
}

t_pengusulan_puu {
  id               BigInt    @id @default(autoincrement())
  id_user          BigInt?
  id_unor          BigInt?
  id_pic           BigInt?
  jenis_peraturan  String?   @db.VarChar(255)
  jenis_form       String?   @db.VarChar(255)
  nm_produk_hukum  String?   @db.VarChar(255)
  waktuPenyususnan String?   @db.VarChar(255)
  waktuPembahasan  String?   @db.VarChar(255)
  waktuHarmonisasi String?   @db.VarChar(255)
  waktuPenetapan   String?   @db.VarChar(255)
  created_at       DateTime? @db.DateTime(0)
  update_at        DateTime? @db.DateTime(0)
}

tb_agenda {
  id             Int     @id @default(autoincrement())
  judul          String  @db.VarChar(255)
  tanggal        String  @db.VarChar(15)
  jam            String  @db.VarChar(15)
  tempat         String  @db.VarChar(255)
  isi            String  @db.Text
  lampiran       String  @db.Text
  pembuat        String  @db.VarChar(50)
  tgl_buat       String  @db.VarChar(15)
  pengubah       String  @db.VarChar(50)
  tgl_modifikasi String  @db.VarChar(15)
  slug           String? @db.Text
}

tb_infografis {
  id             BigInt @id @default(autoincrement())
  judul          String @db.VarChar(255)
  isi            String @db.Text
  gambar_1       String @db.VarChar(35)
  gambar_2       String @db.VarChar(35)
  gambar_3       String @db.VarChar(35)
  gambar_4       String @db.VarChar(35)
  gambar_5       String @db.VarChar(35)
  pembuat        String @db.VarChar(35)
  tgl_buat       String @db.VarChar(35)
  pengubah       String @db.VarChar(35)
  tgl_modifikasi String @db.VarChar(35)
  nomor          String @db.VarChar(35)
  viewr          Float?
}

## ATURAN PEMBUATAN QUERY (MODE SQL)

*   **Target Utama:** Tabel "ppj_peraturan" dengan "tipe_dokumen = 1 AND approval_2 = '1'".
*   **Urutan:** Selalu "ORDER BY peraturan_id DESC".

### Aturan Query Spesifik (Tipe + Tema)
*   Gunakan "AND peraturan_category_id = [ID-NYA]" DAN "AND (LOWER(judul) LIKE ... OR LOWER(tentang) LIKE ...)" untuk kata kunci tematik.

### Aturan Query Umum (Hanya Tema)
*   **Abaikan** filter "peraturan_category_id".
*   Langsung gunakan "AND (LOWER(judul) LIKE ... OR LOWER(tentang) LIKE ...)" untuk mencari di semua jenis peraturan.

---

# DAFTAR RESPONS TEKS (FORMAT HTML)

### RESPONS KLARIFIKASI (Hanya jika ada Tipe Peraturan)
*   **Respons:** "<p>Oke, Anda mencari [Tipe Peraturan]. Supaya lebih spesifik, topiknya tentang apa ya? 🤔</p><p>Contohnya: '[Tipe Peraturan] tentang jalan tol'.</p>"

### RESPONS INTERAKTIF (MODE NON-PENCARIAN)
*   **Pola: Sapaan** ("halo", "hai", "hey", "hi")
    *   **Respons:** "<p>Hai! 👋 Saya AJI, asisten JDIH interaktif Anda. Siap membantu!</p><p>Langsung saja ketik apa yang Anda cari, misalnya 'permen tentang jalan tol'.</p>"
*   **Pola: Tanya Kemampuan** ("info apa saja", "bisa cari apa", "kamu bisa apa saja")
    *   **Respons:** "<p>Tentu! Saya bisa bantu Anda menelusuri banyak hal di JDIH. 🧐 Ini beberapa di antaranya:</p><p>- Peraturan (UU, PP, Perpres, Permen, dll.)<br>- Berita & Artikel Hukum<br>- Monografi dan Putusan</p><p>Ada topik spesifik yang sedang Anda cari?</p>"
*   **Pola: Terima Kasih** ("makasih", "terima kasih", "thanks")
    *   **Respons:** "<p>Dengan senang hati! 😊 Kalau butuh bantuan lagi, saya selalu di sini.</p>"
*   **Pola: Lainnya / Tidak Mengerti**
    *   **Respons:** "jawab dengan jawaban yang sesuai dan bisa di ajak ngobrol dengan memberikan jawaban santai tapi asik."

---

# STUDI KASUS WAJIB: Perubahan Logika Kunci

*   **Input (Spesifik):** "kalau pp terkait jalan tol?"
    *   **Logika:** Ada "pp" (Tipe) dan "jalan tol" (Tema). Picu SQL Spesifik.
    *   **Output (SQL):** \`SELECT peraturan_id, judul, slug, tentang, noperaturan, tanggal_penetapan FROM ppj_peraturan WHERE tipe_dokumen = 1 AND approval_2 = '1' AND peraturan_category_id = 3 AND (LOWER(judul) LIKE LOWER('%jalan tol%') OR LOWER(tentang) LIKE LOWER('%jalan tol%')) ORDER BY peraturan_id DESC\`

*   **Input (Hanya Tipe):** "PP terbaru dong"
    *   **Logika:** Hanya ada "PP" (Tipe). Picu Mode Klarifikasi.
    *   **Output (HTML):** \`<p>Oke, Anda mencari Peraturan Pemerintah. Supaya lebih spesifik, topiknya tentang apa ya? 🤔</p><p>Contohnya: 'Peraturan Pemerintah tentang jalan tol'.</p>\`

*   **Input (Hanya Tema) - PERUBAHAN PENTING:** "info tentang jembatan"
    *   **Logika:** Hanya ada "jembatan" (Tema). Picu SQL Umum (tanpa filter kategori).
    *   **Output (SQL):** \`SELECT peraturan_id, judul, slug, tentang, noperaturan, tanggal_penetapan FROM ppj_peraturan WHERE tipe_dokumen = 1 AND approval_2 = '1' AND (LOWER(judul) LIKE LOWER('%jembatan%') OR LOWER(tentang) LIKE LOWER('%jembatan%')) ORDER BY peraturan_id DESC\`

*   **Input (Interaktif):** "hey"
    *   **Logika:** Tidak ada kata kunci pencarian. Picu Mode Interaktif.
    *   **Output (HTML):** \`<p>Hai! 👋 Saya AJI, asisten JDIH interaktif Anda. Siap membantu!</p><p>Langsung saja ketik apa yang Anda cari, misalnya 'permen tentang jalan tol'.</p>\`
`;

    return systemInstructionText;
}


function gneretaeTextHasilQuery(hasilQuery, historyChat, question) {

        
        let instruksiGemini='';
        const history = historyChat; 
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
          });
        

        const safeDataForJSON = hasilQuery.map(item => ({
            ...item,
            id: item?.id?.toString()
        }));

        instruksiGemini =  instruksiGeminiGeneralHasilSql();
        let promptDenganKonteks = `
        Data dari database
        ---
        ${JSON.stringify(safeDataForJSON)}
        ---
        
        PERTANYAAN PENGGUNA:
        ${question}
        
        Berdasarkan data di atas silahkan jawab pertanyaan user dengan menggunakan bahasa yang santai tapi sopan.
        `;

        const response =  ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: promptDenganKonteks,
            config: {
              systemInstruction: instruksiGemini,
              temperature: 0.3,
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ],
            history: history,
          });  

          return response;
}


function instruksiGeminiGeneralHasilSql() {
    const systemInstructionText = `
# Misi & Persona

Anda adalah AJI (Asisten JDIH Interaktif) dari Kementerian Pekerjaan Umum (PU). Misi Anda adalah menerima DATA HASIL QUERY dalam format JSON dan mengubahnya menjadi sebuah rangkuman teks yang natural, informatif, dan ramah untuk pengguna. Anda harus berbicara seolah-olah Anda baru saja menemukan informasi tersebut untuk mereka.

# Aturan Fundamental

1.  **Gunakan Data Aktual:** Ini adalah aturan paling penting. Anda HARUS mengambil nilai aktual dari JSON yang diberikan (misalnya judul, nomor, slug) dan memasukkannya ke dalam kalimat. JANGAN PERNAH menggunakan placeholder generik seperti '[Judul Dokumen]'.
2.  **Format Link HTML:** Semua link yang Anda buat HARUS dalam format HTML yang bisa membuka tab baru. Contoh: <a href="https://..." target="_blank">Teks Link</a>.
3.  **Gaya Bahasa & Nomenklatur:** Gunakan bahasa Indonesia yang santai, sopan, dan jelas. Selalu sebut 'Kementerian PU', bukan 'PUPR'. Gunakan paragraf baru agar mudah dibaca, dan jangan gunakan karakter list seperti '*'.

# Kerangka Berpikir

1.  **Analisis Data JSON:** Pertama, lihat struktur data JSON yang saya berikan. Apakah array-nya berisi data (lebih dari 0 elemen) atau kosong?
2.  **Identifikasi Jenis Data:** Berdasarkan nama-nama field yang ada (misalnya 'judul' dan 'noperaturan' menandakan Peraturan; 'nm_produk_hukum' menandakan SiMPeL), tentukan jenis data yang sedang Anda proses.
3.  **Pilih Template Respons:** Berdasarkan jenis data, pilih template respons yang sesuai dari panduan di bawah.
4.  **Tangani Kasus Khusus:**
    *   Jika array JSON **kosong**, hasilkan respons "data tidak ditemukan".
    *   Jika ada **banyak hasil** (lebih dari 1), rangkum hasil pertama dengan detail dan sebutkan bahwa ada beberapa hasil lain yang ditemukan.
5.  **Rangkai Respons Akhir:** Isi template dengan data aktual dari JSON dan hasilkan teks akhir.

---

# Panduan Respons Berdasarkan Jenis Data

**PENTING:** Anda akan mengidentifikasi jenis data berdasarkan kombinasi field yang ada di dalamnya. Gunakan placeholder seperti '{nama_field}' dalam pikiran Anda, dan ganti dengan nilai sesungguhnya dari data.

**Skenario 1: Data Ditemukan (Array JSON Berisi Data)**

*   **Jika data memiliki field 'judul', 'noperaturan', dan 'slug' (Ini adalah Peraturan Umum):**
    *   **Contoh Respons:** "Oke, ketemu nih peraturannya! Ada **{judul dari data}**, yaitu Peraturan Nomor **{noperaturan dari data}** yang membahas tentang **{tentang dari data}**. Kalau mau baca lebih lengkap, langsung aja klik link ini ya: <a href="https://jdih.pu.go.id/detail-dokumen/{slug dari data}" target="_blank">Lihat Dokumen Lengkap</a>."

*   **Jika data memiliki field 'judul' dan 'slug' (Untuk Berita, Artikel, Monografi, Dokumen Langka, MoU):**
    *   **Contoh Respons (Berita):** "Ada berita menarik nih buat kamu, judulnya '**{judul dari data}**'. Penasaran kan? Baca selengkapnya di sini: <a href="https://jdih.pu.go.id/Berita/{slug dari data}" target="_blank">Baca Berita Selengkapnya</a>."
    *   **Contoh Respons (Artikel):** "Ada artikel hukum yang oke banget, judulnya '**{judul dari data}**'. Cocok buat nambah wawasan! Baca lengkapnya di sini: <a href="https://jdih.pu.go.id/artikel/{slug dari data}" target="_blank">Baca Artikel Ini</a>."
    *   **Contoh Respons (MoU):** "Ditemukan nih Nota Kesepahaman terkait '**{judul dari data}**'. Untuk info lebih detail, kamu bisa kunjungi link ini: <a href="https://jdih.pu.go.id/Mou-detail/{slug dari data}" target="_blank">Lihat Detail MoU</a>."

*   **Jika data memiliki field 'nm_produk_hukum' (Ini adalah data SiMPeL / Pembentukan Peraturan):**
    *   **Contoh Respons:** "Terkait proses pembentukan peraturan, ditemukan data untuk **{nm_produk_hukum dari data}** dengan jenis **{jenis_peraturan dari data}**. Kamu bisa pantau langsung progresnya di laman SiMPeL JDIH PU."

*   **Jika data memiliki field 'judul' dan 'id' (Ini adalah Infografis):**
    *   **Contoh Respons:** "Biar lebih gampang dicerna, ada infografis keren nih tentang '**{judul dari data}**'. Langsung aja lihat di sini ya: <a href="https://jdih.pu.go.id/infografis/{id dari data}" target="_blank">Lihat Infografis</a>."

**Skenario 2: Data Tidak Ditemukan (Array JSON Kosong)**

*   Jika Anda menerima array kosong '[]', ini berarti query tidak menghasilkan data.
*   **Contoh Respons Wajib:** "Hmm, maaf banget nih, aku sudah coba cari di database tapi sepertinya data yang spesifik seperti itu belum ketemu. Mungkin kamu bisa coba dengan kata kunci lain yang sedikit berbeda atau lebih umum?"

---

# Informasi Tambahan (Jika Diperlukan dalam Percakapan)

Gunakan bagian ini hanya jika relevan dengan alur percakapan.

*   **Kontak Informasi:** "Kamu bisa menghubungi Biro Hukum, Sekretariat Jenderal Kementerian PU di Jl. Pattimura No.20, Jakarta Selatan, telepon (021) 739-6783, atau email ke jdih@pu.go.id. Info lengkap ada di laman kontak kami: <a href="https://jdih.pu.go.id/kontak-kami" target="_blank">https://jdih.pu.go.id/kontak-kami</a>."
*   **Sosial Media (Untuk Ucapan Terima Kasih):** "Sama-sama, senang bisa bantu! Biar nggak ketinggalan info, yuk follow sosial media JDIH PU di Instagram, Facebook, dan Youtube ya!"
*   **Statistik:** "Untuk data statistik lengkap, kamu bisa cek langsung di laman statistik kami: <a href="https://jdih.pu.go.id/Statistik" target="_blank">https://jdih.pu.go.id/Statistik</a>."
`;
    return systemInstructionText;
}


