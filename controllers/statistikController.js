const { PrismaClient } = require("@prisma/client");
const client = require("../config/elasticsearch");
const prisma = new PrismaClient();

exports.getRekapJumlahPeraturan = async (req, res) => {
  try {
    let data = await prisma.$queryRawUnsafe(
      `SELECT percategorycode, COUNT(*) as jml_peraturan FROM (
        SELECT * FROM ppj_peraturan WHERE tipe_dokumen <> 2 and tipe_dokumen <> 3 AND tipe_dokumen <> 4
        ) as a
        LEFT JOIN (SELECT * from ppj_peraturan_category) as b ON a.peraturan_category_id=b.peraturan_category_id
        GROUP BY a.peraturan_category_id`
    );

    data = data.map((row) => {
      const fixedRow = {};
      for (const key in row) {
        fixedRow[key] =
          typeof row[key] === "bigint" ? row[key].toString() : row[key];
      }
      return fixedRow;
    });

    return res.status(200).json({
      status: true,
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};

exports.getTotalDokumentUnor = async (req, res) => {
  try {
    let data = await prisma.$queryRawUnsafe(
      `SELECT deptname, deptcode, SUM(jml_dok) AS tot_dok FROM (
        SELECT dept_id, COUNT(*) AS jml_dok FROM ppj_peraturan 
        WHERE 
        tipe_dokumen NOT IN (2,3,4) 
        GROUP BY dept_id 
        ORDER BY dept_id ASC
        ) AS a
        LEFT JOIN(
        SELECT * FROM ppj_departemen
        ) AS b ON a.dept_id=b.dept_id WHERE  deptcode <> 'Setjen' GROUP BY b.parent_id ORDER BY a.dept_id`
    );

    data = data.map((row) => {
      const fixedRow = {};
      for (const key in row) {
        fixedRow[key] =
          typeof row[key] === "bigint" ? row[key].toString() : row[key];
      }
      return fixedRow;
    });

    return res.status(200).json({
      status: true,
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};

exports.getTotalDownloadDok = async (req, res) => {
  try {
    let data = await prisma.$queryRawUnsafe(
      `SELECT percategorycode, SUM(download_count) AS jml_download FROM (
        SELECT * FROM ppj_peraturan WHERE tipe_dokumen <> 2 AND tipe_dokumen <> 3 AND tipe_dokumen <> 4
        ) AS a
        LEFT JOIN (SELECT * FROM ppj_peraturan_category) AS b ON a.peraturan_category_id=b.peraturan_category_id
        GROUP BY a.peraturan_category_id`
    );

    data = data.map((row) => {
      const fixedRow = {};
      for (const key in row) {
        fixedRow[key] =
          typeof row[key] === "bigint" ? row[key].toString() : row[key];
      }
      return fixedRow;
    });

    return res.status(200).json({
      status: true,
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};


exports.getTotalViewPeraturan = async (req, res) => {
  try {
    let data = await prisma.$queryRawUnsafe(
      `SELECT percategorycode, SUM(view_count) AS jml_view FROM (
        SELECT * FROM ppj_peraturan WHERE tipe_dokumen <> 2 AND tipe_dokumen <> 3 AND tipe_dokumen <> 4
        ) AS a
        LEFT JOIN (SELECT * FROM ppj_peraturan_category) AS b ON a.peraturan_category_id=b.peraturan_category_id
        GROUP BY a.peraturan_category_id`
    );

    data = data.map((row) => {
      const fixedRow = {};
      for (const key in row) {
        fixedRow[key] =
          typeof row[key] === "bigint" ? row[key].toString() : row[key];
      }
      return fixedRow;
    });

    return res.status(200).json({
      status: true,
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};


exports.getTotalPengunjung = async (req, res) => {
  try {
    let data = await prisma.$queryRawUnsafe(
      `SELECT
      ELT(MONTH(waktu), 
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember') AS nama_bulan,
      SUM(jml) AS tot_pengunjung FROM tb_hit_date 
      WHERE LEFT(waktu,4)='2025' GROUP BY MID(waktu,6,2) 
      ORDER BY MID(waktu,6,2)`
    );

    data = data.map((row) => {
      const fixedRow = {};
      for (const key in row) {
        fixedRow[key] =
          typeof row[key] === "bigint" ? row[key].toString() : row[key];
      }
      return fixedRow;
    });

    return res.status(200).json({
      status: true,
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};
