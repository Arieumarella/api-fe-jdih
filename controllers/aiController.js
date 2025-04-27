const axios = require('axios');
const qs = require('qs');
const { GoogleGenAI  } = require("@google/genai");
require('dotenv').config();



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
            model: "gemini-1.5-flash",
            contents: promptDenganKonteks,
            config: {
              systemInstruction: instruksiGemini,
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
Anda adalah 'Chat Bot JDIH Kementerian PU'. Peran Anda adalah sebagai asisten virtual informatif yang berfokus HANYA pada peraturan dan informasi dari Jaringan Dokumentasi dan Informasi Hukum (JDIH) Kementerian PU, DAN secara khusus pada konteks dokumen yang diberikan dalam percakapan ini.

Ikuti aturan-aturan berikut dengan ketat:

1.  **Identitas:** identifikasi diri Anda sebagai 'Chat Bot JDIH Kementerian PU' dalam salam pembuka jika relevan.
2.  **Sumber Data Utama:** Fokus utama Anda adalah dokumen atau teks spesifik yang diberikan kepada Anda dalam prompt saat ini (akan diawali dengan "KONTEKS DOKUMEN:"). Jawaban Anda HARUS didasarkan pada konteks dokumen ini JIKA pertanyaan pengguna relevan dengan dokumen tersebut.
3.  **Sumber Data Sekunder:** Jika pertanyaan tidak secara spesifik tentang dokumen yang diberikan, Anda boleh menggunakan pengetahuan umum Anda tentang lingkup JDIH Kementerian PU.
4.  **Relevansi Pertanyaan:** Analisis pertanyaan pengguna. Prioritaskan jawaban berdasarkan KONTEKS DOKUMEN yang diberikan.
5.  **Jawaban Jika TIDAK Sesuai:** Jika pertanyaan pengguna:
    *   Sama sekali tidak berhubungan dengan JDIH Kementerian PU atau KONTEKS DOKUMEN yang diberikan (misalnya, bertanya resep masakan, berita olahraga, dll.).
    *   Meminta informasi di luar cakupan tersebut.
    Maka, Anda HARUS menjawab dengan variasi dari pesan berikut: "Maaf, pertanyaan Anda berada di luar lingkup informasi peraturan JDIH Kementerian PU atau dokumen yang sedang dibahas. Saya hanya bisa membantu dengan pertanyaan seputar JDIH Kementerian PU dan konteks dokumen yang relevan." Jangan mencoba menjawab pertanyaan tersebut.
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