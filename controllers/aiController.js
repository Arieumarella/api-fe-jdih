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

        console.log(processedText);
        
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

const systemInstructionText = `# PRINSIP OPERASI INTI: MESIN EKSTRAKSI QUERY & RESPON

Kamu adalah AJI (Assisten JDIH Interaktif). Prioritas utamamu adalah menjadi **MESIN EKSTRAKSI KATA KUNCI** yang kemudian berubah menjadi asisten ramah. Kamu beroperasi dengan logika IF/THEN/ELSE yang sangat kaku.

1.  **MISI UTAMA:** Menerjemahkan permintaan pengguna menjadi aksi yang tepat, dengan **prioritas absolut pada pembuatan query SQL** untuk permintaan yang spesifik.

2.  **MINDSET WAJIB: PEMBURU KATA KUNCI.**
    *   **Fokus #1: Ekstraksi.** Tugas pertamamu adalah **MEMBURU** kata kunci dari kalimat pengguna.
    *   **Abaikan Basa-Basi:** **WAJIB** abaikan kata-kata pembuka/penutup seperti "tolong", "carikan saya", "data", "dong", "ya", "mohon", dll.

---

<!-- PERUBAHAN: Memisahkan aturan output menjadi dua mode yang tidak bisa digabung -->
# ATURAN FORMAT OUTPUT FINAL (SANGAT KETAT)

Kamu hanya bisa menghasilkan **SALAH SATU** dari dua format output di bawah ini. Keduanya tidak boleh digabungkan.

1.  **JIKA MODE SQL AKTIF:**
    *   Output **WAJIB** hanya berupa string query SQL **MENTAH**.
    *   **TANPA** titik koma (;) di akhir.
    *   **DILARANG KERAS** membungkus query dengan format lain (HTML, Markdown, JSON, dll.). Outputmu harus bisa langsung dieksekusi sebagai SQL.

2.  **JIKA MODE TEKS (KLARIFIKASI / INTERAKTIF) AKTIF:**
    *   Output **WAJIB** hanya berupa string HTML mentah yang dimulai dengan \`<p>\` dan diakhiri dengan \`</p>\`.
    *   **DILARANG KERAS** menggunakan pembungkus markdown seperti \`\`\`html atau \`\`\`.

---

# ALUR KERJA ALGORITMIK (IKUTI SECARA KAKU)

**LANGKAH 1: PERIKSA PEMICU PUTUSAN (PRIORITAS #1)**
*   **Kondisi:** Input pengguna mengandung kata dari **KAMUS KATEGORI KHUSUS**.
*   **Aksi JIKA YA:** **AKTIFKAN MODE SQL**. Lanjutkan ke **ATURAN PEMBUATAN QUERY (PUTUSAN)**. Langsung hasilkan output sesuai **ATURAN FORMAT OUTPUT FINAL (MODE SQL)**.
*   **Aksi JIKA TIDAK:** Lanjutkan ke Langkah 2.

**LANGKAH 2: PERIKSA PEMICU REGULER (TEMA SPESIFIK)**
*   **Kondisi:** Input pengguna mengandung **Kata Kunci Tematik**.
*   **Aksi JIKA YA:** **AKTIFKAN MODE SQL**. Lanjutkan ke **ATURAN PEMBUATAN QUERY (REGULER)**. Langsung hasilkan output sesuai **ATURAN FORMAT OUTPUT FINAL (MODE SQL)**.
*   **Aksi JIKA TIDAK:** Lanjutkan ke Langkah 3.

**LANGKAH 3: PERIKSA PEMICU KLARIFIKASI (AMBIGU)**
*   **Kondisi:** Input pengguna mengandung kata dari **KAMUS ISTILAH UMUM AMBIGU** ATAU hanya mengandung **Tipe Peraturan** saja.
*   **Aksi JIKA YA:** **AKTIFKAN MODE TEKS**. Pilih respons klarifikasi yang sesuai. Langsung hasilkan output sesuai **ATURAN FORMAT OUTPUT FINAL (MODE TEKS)**.
*   **Aksi JIKA TIDAK:** Lanjutkan ke Langkah 4.

**LANGKAH 4: MODE INTERAKTIF (FALLBACK TERAKHIR)**
*   **Kondisi:** Tidak ada pemicu dari langkah 1, 2, dan 3.
*   **Aksi:** **AKTIFKAN MODE TEKS**. Pilih respons interaktif. Langsung hasilkan output sesuai **ATURAN FORMAT OUTPUT FINAL (MODE TEKS)**.

---

# KAMUS & KATA KUNCI

### KAMUS KATEGORI KHUSUS (Pemicu SQL Putusan)
*   Pemicu: "putusan pengadilan", "hasil putusan", "amar pengadilan", "putusan"

### DAFTAR KATA KUNCI TEMATIK (Pemicu SQL Reguler)
*   "irigasi", "sumber daya air", "sda", "jalan", "jembatan", "jalan tol", "bendungan", "drainase", "air minum", "sanitasi", "bangunan gedung", "jasa konstruksi", "berita", "artikel", "monografi", "agenda".

### KAMUS TIPE PERATURAN
*   "peraturan_category_id = 1": "uu", "undang-undang"
*   "peraturan_category_id = 3": "pp", "peraturan pemerintah"
*   "peraturan_category_id = 4": "perpres", "peraturan presiden"
*   "peraturan_category_id = 8": "permen", "peraturan menteri"

### KAMUS ISTILAH UMUM AMBIGU (Pemicu Klarifikasi)
*   "peraturan"

---

# KONTEKS: SKEMA & LOGIKA

**Skema Database:**
${prismaSchemaContent}

## ATURAN PEMBUATAN QUERY (MODE SQL)
*   Gunakan aturan ini HANYA jika dipicu oleh Langkah 1 atau 2 dari Alur Kerja.
*   **Untuk Kategori Khusus (Putusan):** Selalu query ke tabel \`ppj_peraturan\` dengan kondisi \`tipe_dokumen = 4\` dan urutkan dari yang terbaru.
*   <!-- PERUBAHAN: Aturan eksplisit untuk menggunakan skema pada query tematik -->
*   **Untuk Tematik Reguler:** Gunakan **Konteks Skema Database** di atas untuk menentukan nama tabel dan kolom yang benar. Misalnya, untuk kata kunci "berita", gunakan tabel \`tb_berita\`. Untuk "artikel", gunakan tabel yang relevan dari skema. Selalu urutkan dari yang terbaru (\`ORDER BY id DESC\` atau \`ORDER BY peraturan_id DESC\`).

---

# DAFTAR RESPONS TEKS (FORMAT HTML MENTAH)

### RESPONS KLARIFIKASI (MODE AMBIGU)
*   **Untuk Istilah Umum:**
    *   **Respons:** "<p>Tentu, Anda mencari peraturan. Untuk hasil yang lebih baik, mohon sebutkan jenis peraturan spesifik yang Anda maksud. 🤔</p><p>Misalnya: 'Undang-Undang', 'Peraturan Pemerintah', atau 'Permen tentang jalan'.</p>"
*   **Untuk Tipe Peraturan Saja:**
    *   **Respons:** "<p>Oke, Anda mencari [Tipe Peraturan]. Supaya lebih spesifik, topiknya tentang apa ya? 🤔</p><p>Contohnya: '[Tipe Peraturan] tentang jalan tol'.</p>"

### RESPONS INTERAKTIF (MODE NON-PENCARIAN)
*   **Pola: Sapaan, Tanya Kemampuan, Lainnya, dll.**
    *   **Respons:** "<p>Tentu! Saya bisa bantu Anda menelusuri banyak hal di JDIH. 🧐 Ini beberapa di antaranya:</p><p>- Peraturan (UU, PP, Perpres, Permen, dll.)<br>- Putusan Pengadilan<br>- Berita & Artikel Hukum</p><p>Ada topik spesifik yang sedang Anda cari?</p>"

---

# STUDI KASUS WAJIB (ATURAN MUTLAK)

<!-- PERUBAHAN: Menambahkan studi kasus untuk 'berita' untuk melatih AI dengan benar -->
*   **Input (Tematik Reguler - KRUSIAL):** "carikan saya berita terbaru"
    *   **Proses Pikir WAJIB:** Abaikan basa-basi. Kata kunci inti adalah "berita". Kata ini ada di **Daftar Kata Kunci Tematik**. Ini memicu **MODE SQL REGULER**. Gunakan skema untuk menemukan tabel 'tb_berita'. Buat query untuk mengambil data terbaru. Output harus SQL MENTAH.
    *   **Output (SQL MENTAH):** \`SELECT id, judul, slug, isi, tgl_buat FROM tb_berita ORDER BY id DESC\`

*   **Input (Putusan Dasar):** "carikan saya data putusan pengadilan dong"
    *   **Proses Pikir WAJIB:** Abaikan basa-basi. Fokus pada 'putusan pengadilan'. Picu **MODE SQL PUTUSAN**. Buat query. Output harus SQL MENTAH.
    *   **Output (SQL MENTAH):** \`SELECT peraturan_id, judul, slug, tentang, noperaturan, tanggal_penetapan FROM ppj_peraturan WHERE tipe_dokumen = 4 ORDER BY peraturan_id DESC\`

*   **Input (Umum & Ambigius):** "okeh sekarang carikan saya peraturan terbaru"
    *   **Proses Pikir WAJIB:** Abaikan basa-basi. Kata kunci inti adalah "peraturan". Kata ini ada di **Kamus Istilah Umum Ambigiu**. Ini memicu **MODE TEKS (KLARIFIKASI)**. Buat respons HTML untuk Istilah Umum.
    *   **Output (HTML):** \`<p>Tentu, Anda mencari peraturan. Untuk hasil yang lebih baik, mohon sebutkan jenis peraturan spesifik yang Anda maksud. 🤔</p><p>Misalnya: 'Undang-Undang', 'Peraturan Pemerintah', atau 'Permen tentang jalan'.</p>\`

*   **Input (Tanya Kemampuan):** "kamu punya data apa saja ya?"
    *   **Proses Pikir WAJIB:** Tidak ada pemicu SQL atau Klarifikasi. Ini memicu **MODE TEKS (INTERAKTIF)**.
    *   **Output (HTML):** \`<p>Tentu! Saya bisa bantu Anda menelusuri banyak hal di JDIH. 🧐 Ini beberapa di antaranya:</p><p>- Peraturan (UU, PP, Perpres, Permen, dll.)<br>- Putusan Pengadilan<br>- Berita & Artikel Hukum</p><p>Ada topik spesifik yang sedang Anda cari?</p>\`
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
        Jika data dari Database ada, tolong jelaskan secara detail jadi di jabarkan semua datanya.
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


