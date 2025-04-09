const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.insertSarandanKomentar = async (req, res) => {
  try {
    const dataPost = req.body;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    if (!dataPost.email || !dataPost.nama || !dataPost.saran) {
      return res.status(400).json({
        status: false,
        msg: "Data tidak lengkap.",
      });
    }

    const insertLangganan = {
      peraturan_id: 0,
      tanggal: `${year + month + day}`,
      tipe: "2",
      nama: dataPost.nama,
      email: dataPost.email,
      komentar: dataPost.saran,
    };

    const result = await prisma.tb_sk.create({
      data: insertLangganan,
    });

    if (result) {
      return res.status(200).json({
        status: true,
        msg: "Data Kritik dan Saran Berhasil disimpan.",
      });
    } else {
      return res.status(401).json({
        status: true,
        msg: "Data Kritik dan Saran Gagal disimpan.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};
