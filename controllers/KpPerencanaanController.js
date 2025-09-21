const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getPaginationPerencanaanKp = async (req, res) => {
  try {
    const dataPost = await req.body,
      search =
        (await dataPost.search) !== undefined
          ? dataPost.search.toLowerCase()
          : "";

    let page = 1,
      limit = 6;

    if (dataPost?.page !== undefined) {
      page = await parseInt(dataPost.page);
    }

    const skip = (await (page - 1)) * limit;

    const posts = await prisma.t_konsultasi_publik_perencanaan.findMany({
      skip,
      take: limit,
      orderBy: { id: "desc" },
      where: {
        AND: [search ? { judul: { contains: search } } : {}],
      },
    });

    const totalPosts = await prisma.t_konsultasi_publik_perencanaan.count({
      where: {
        AND: [search ? { judul: { contains: search } } : {}],
      },
    });

    return res.status(200).json({
      status: true,
      data: {
        posts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};

const axios = require("axios");

exports.insertMasukan = async (req, res) => {
  try {
    const { nama, email, asal, masukan, id, captcha } = req.body;
    // Validasi sederhana
    if (!nama || !email || !asal || !masukan || !captcha) {
      return res.status(400).json({ message: "Semua field harus diisi." });
    }

    // Verifikasi captcha Cloudflare Turnstile
    const secretKey = process.env.RECAPTCHA_SECRET_KEY; // Ambil dari .env
    console.log("Secret Key:", secretKey); // Debugging line
    console.log("Captcha Response:", captcha); // Debugging line

    const verifyUrl =
      "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    try {
      const body = new URLSearchParams();
      body.append("secret", secretKey);
      body.append("response", captcha);
      body.append("remoteip", req.ip); // opsional

      const captchaResponse = await axios.post(verifyUrl, body.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!captchaResponse.data.success) {
        return res.status(400).json({ message: "Verifikasi captcha gagal." });
      }

      // lanjut kalau sukses
    } catch (captchaError) {
      return res.status(500).json({
        message: "Gagal memverifikasi captcha.",
        error: captchaError.message,
      });
    }

    // Simpan ke database t_masukan_kp_perencanaan
    try {
      await prisma.t_masukan_kp_perencanaan.create({
        data: {
          id_kp: id ? parseInt(id) : 0,
          nama,
          email,
          asal,
          masukan,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      res.status(201).json({ message: "Masukan berhasil disimpan." });
    } catch (dbError) {
      res.status(500).json({
        message: "Gagal menyimpan ke database.",
        error: dbError.message,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server.", error });
  }
};
