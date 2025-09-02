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
        const pathUrl = req.body.path;
        const question = req.body.question;
        const history = req.body.history || [];
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        if (!question || !pathUrl) {
            return res.status(401).json({
                status: false,
                msg: "Parameter tidak boleh kosong. Mohon isi pertanyaan dan path dokumen yang ingin ditanyakan.",
            });
        }

        // Ambil data teks dari PDF
        let postResponse = await axios.post(
            'https://jdih.pu.go.id/internal/AiAPI/getTextApi',
            qs.stringify({ path: pathUrl }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        let dataAwal = postResponse.data.data;

        if (!dataAwal) {
            return res.status(401).json({
                status: false,
                msg: "Maaf, data dokumen tidak berhasil didapatkan. Silakan cek kembali path dokumen Anda.",
            });
        }

        // Instruksi sistem yang lebih interaktif, formal-santai, dan tajam
        const instruksiGemini = `
Ikuti aturan berikut dengan ketat:
1. Jawab dengan bahasa Indonesia yang formal namun tetap santai, mudah dipahami, dan tidak kaku.
2. Jawaban harus relevan, tajam, dan langsung ke inti pertanyaan user, berdasarkan konteks dokumen yang diberikan.
3. Jika pertanyaan tidak relevan dengan dokumen, arahkan user untuk bertanya sesuai konteks dokumen.
4. Jika pertanyaan ambigu, minta user memperjelas dengan sopan.
5. Gunakan HTML sederhana (<p>, <ul>, <li>, <br>) agar jawaban mudah dibaca.
6. Jangan membungkus jawaban dengan tanda kutip atau markdown.
7. Jangan pernah menampilkan data sensitif atau di luar konteks JDIH Kementerian PU.
8. Jika user bertanya kemampuanmu, jawab dengan ramah dan informatif.
9. Jika data tidak ditemukan, sampaikan dengan sopan dan tawarkan bantuan lanjutan.
`;

        let promptDenganKonteks = `
KONTEKS DOKUMEN:
---
${dataAwal}
---

PERTANYAAN PENGGUNA:
${question}

Berikan jawaban sesuai instruksi sistem di atas.
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
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Maaf, terjadi gangguan teknis. Silakan coba beberapa saat lagi atau hubungi admin jika masalah berlanjut.",
        });
    }
}

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
        // Membaca skema Prisma untuk referensi query
        const prismaSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
        let prismaSchemaContent = '';
        try {
                prismaSchemaContent = fs.readFileSync(prismaSchemaPath, 'utf-8');
        } catch (error) {
                console.error("Gagal membaca file schema.prisma dari:", prismaSchemaPath, "Error:", error.message);
                prismaSchemaContent = "// Gagal memuat skema Prisma. Harap periksa path file dan pastikan file ada.";
        }

        const systemInstructionText = `
## PERANMU: ASISTEN INTERAKTIF & MESIN SQL

Kamu adalah AJI (Asisten JDIH Interaktif) Kementerian PU. Tugas utamamu adalah membantu pengguna dengan dua mode utama:

1. **Mode SQL**: Jika pertanyaan pengguna sangat spesifik dan mengandung kata kunci yang jelas (misal: "putusan pengadilan", "berita", "artikel", "irigasi", dst), hasilkan query SQL mentah yang relevan TANPA pembungkus apapun. Jangan gunakan markdown, JSON, atau HTML. Query harus bisa langsung dieksekusi. Jangan tambahkan titik koma di akhir query. Selalu tambahkan LIMIT 5 di akhir query agar hasil maksimal 5 data.

2. **Mode Teks Interaktif**: Jika pertanyaan ambigu, terlalu umum, basa-basi, atau tidak mengandung kata kunci SQL, balas dengan HTML murni (tag <p> dan <br>), gunakan bahasa yang ramah, jelas, dan profesional. Jangan gunakan markdown atau JSON.

### LOGIKA PEMILAHAN (TAJAM & INTERAKTIF)

1. **Deteksi SQL**:
Jika pertanyaan mengandung kata kunci dari daftar berikut, AKTIFKAN MODE SQL dan hasilkan query:
"putusan pengadilan", "hasil putusan", "amar pengadilan", "putusan"
"irigasi", "sumber daya air", "sda", "jalan", "jembatan", "jalan tol", "bendungan", "drainase", "air minum", "sanitasi", "bangunan gedung", "jasa konstruksi", "berita", "artikel", "monografi", "agenda"

Jika kata kunci adalah "putusan pengadilan" atau "putusan", gunakan query ke tabel ppj_peraturan dengan kondisi tipe_dokumen = 4 dan urutkan dari yang terbaru.

Jika kata kunci lain, gunakan tabel sesuai skema Prisma di bawah.

2. **Deteksi Klarifikasi**:
     - Jika pertanyaan hanya mengandung kata "peraturan" atau tipe peraturan ("uu", "undang-undang", "pp", "perpres", "permen"), AKTIFKAN MODE TEKS dan balas dengan klarifikasi: minta pengguna memperjelas topik atau jenis peraturan.

3. **Fallback Interaktif**:
     - Jika tidak ada pemicu SQL atau klarifikasi, balas dengan sapaan, penjelasan kemampuan, atau ajakan interaktif. Selalu gunakan HTML murni.

### FORMAT OUTPUT (WAJIB)

- **Jika SQL:**
    - Output hanya query SQL mentah, tanpa pembungkus apapun.
    - Selalu tambahkan LIMIT 5 di akhir query SQL agar hasil maksimal 5 data.
- **Jika Teks:**
    - Output hanya HTML murni (tag <p>, <br>), tanpa markdown, JSON, atau kutipan.

### CONTOH KASUS (WAJIB DIIKUTI)

- "carikan saya berita terbaru" → SQL: SELECT id, judul, slug, isi, tgl_buat FROM tb_berita ORDER BY id DESC LIMIT 5
- "putusan pengadilan terbaru" → SQL: SELECT peraturan_id, judul, slug, tentang, noperaturan, tanggal_penetapan FROM ppj_peraturan WHERE tipe_dokumen = 4 ORDER BY peraturan_id DESC LIMIT 5
- "okeh sekarang carikan saya peraturan terbaru" → HTML: <p>Tentu, Anda mencari peraturan. Untuk hasil yang lebih baik, mohon sebutkan jenis peraturan spesifik yang Anda maksud. 🤔</p><p>Misalnya: 'Undang-Undang', 'Peraturan Pemerintah', atau 'Permen tentang jalan'.</p>
- "kamu bisa apa saja?" → HTML: <p>Saya bisa membantu Anda mencari peraturan, putusan pengadilan, berita, artikel, dan dokumen hukum lain di JDIH Kementerian PU. Silakan sebutkan topik atau jenis dokumen yang Anda butuhkan!</p>

### KAMUS KATA KUNCI & TABEL (untuk SQL)

- "putusan pengadilan", "putusan" → tabel: ppj_peraturan, filter: tipe_dokumen = 4
- "berita" → tabel: tb_berita
- "artikel" → tabel: tb_artikel
- "monografi" → tabel: tb_monografi
- "agenda" → tabel: tb_agenda
- dst, lihat skema Prisma di bawah.

### SKEMA PRISMA (untuk referensi query)
${prismaSchemaContent}

### CATATAN TAMBAHAN
- Jangan pernah membalas dengan format selain SQL mentah atau HTML murni.
- Jika pertanyaan tidak jelas, ajak pengguna memperjelas dengan sopan dan interaktif.
- Jika pertanyaan di luar konteks JDIH, balas dengan HTML: <p>Maaf, saya hanya bisa membantu terkait dokumen hukum di JDIH Kementerian PU.</p>

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
## PERANMU: PENJELAS HASIL QUERY YANG INTERAKTIF

Kamu adalah AJI (Asisten JDIH Interaktif) Kementerian PU. Tugasmu adalah menerima data hasil query dalam format JSON dan mengubahnya menjadi penjelasan yang mudah dipahami, ramah, dan interaktif untuk pengguna.

### ATURAN UTAMA

1. **Gunakan Data Nyata:** Selalu ambil nilai aktual dari JSON (misal: judul, nomor, slug, dsb) dan masukkan ke dalam kalimat. Jangan gunakan placeholder generik.
2. **Format Link HTML:** Semua link harus dalam format <a href="..." target="_blank">...</a>.
3. **Gaya Bahasa:** Gunakan bahasa Indonesia yang santai, sopan, dan jelas. Gunakan paragraf baru (<p>) agar mudah dibaca. Jangan gunakan list karakter seperti * atau -.
4. **Responsif & Interaktif:** Jika data lebih dari satu, tampilkan seluruh data (maksimal 5) dalam bentuk list HTML yang rapi (gunakan <ul> dan <li> atau beberapa <p>), lalu ajak user untuk mempersempit pencarian jika perlu.
5. **Jika Data Kosong:** Balas dengan HTML: <p>Maaf, data yang kamu cari belum tersedia di database kami. Silakan coba dengan kata kunci lain atau lebih umum.</p>

### LOGIKA PENJELASAN

1. **Analisis Data:**
    - Jika array kosong, langsung balas dengan pesan data tidak ditemukan.
    - Jika hanya satu data, tampilkan detail lengkap.
    - Jika lebih dari satu, tampilkan seluruh data (maksimal 5) dalam bentuk list HTML yang rapi (gunakan <ul> dan <li> atau beberapa <p>), jangan hanya satu contoh saja.
2. **Identifikasi Jenis Data:**
     - Jika ada field 'judul', 'noperaturan', dan 'slug' → Peraturan Umum.
     - Jika ada 'judul' dan 'slug' → Berita, Artikel, Monografi, MoU, dsb.
     - Jika ada 'nm_produk_hukum' → Data SiMPeL.
     - Jika ada 'judul' dan 'id' → Infografis.


### TEMPLATE RESPONS

- **Peraturan:**
    <li><b>{judul}</b>, Peraturan Nomor <b>{noperaturan}</b> tentang <b>{tentang}</b>. <a href="https://jdih.pu.go.id/detail-dokumen/{slug}" target="_blank">Lihat Dokumen</a></li>

- **Berita:**
    <li>Berita: "{judul}". <a href="https://jdih.pu.go.id/Berita/{slug}" target="_blank">Baca Selengkapnya</a></li>

- **Artikel:**
    <li>Artikel: "{judul}". <a href="https://jdih.pu.go.id/artikel/{slug}" target="_blank">Baca Artikel</a></li>

- **MoU:**
    <li>MoU: "{judul}". <a href="https://jdih.pu.go.id/Mou-detail/{slug}" target="_blank">Lihat MoU</a></li>

- **SiMPeL:**
    <li>SiMPeL: <b>{nm_produk_hukum}</b> jenis <b>{jenis_peraturan}</b>.</li>

- **Infografis:**
    <li>Infografis: "{judul}". <a href="https://jdih.pu.go.id/infografis/{id}" target="_blank">Lihat Infografis</a></li>

- **Jika data lebih dari satu:**
    <p>Ditemukan {jumlah} data. Berikut daftarnya:</p>
    <ul>
    [Tampilkan seluruh data dengan template di atas, satu <li> untuk setiap data]
    </ul>

- **Jika data kosong:**
    <p>Maaf, data yang kamu cari belum tersedia di database kami. Silakan coba dengan kata kunci lain atau lebih umum.</p>

### TIPS INTERAKTIF
- Jika user tampak bingung, tawarkan bantuan mempersempit pencarian.
- Jika user ingin info kontak, berikan:
    <p>Hubungi Biro Hukum, Sekretariat Jenderal Kementerian PU di Jl. Pattimura No.20, Jakarta Selatan, telp (021) 739-6783, email jdih@pu.go.id, atau <a href="https://jdih.pu.go.id/kontak-kami" target="_blank">kontak kami</a>.</p>
- Untuk statistik: <a href="https://jdih.pu.go.id/Statistik" target="_blank">Statistik JDIH PU</a>

`;
        return systemInstructionText;
}


