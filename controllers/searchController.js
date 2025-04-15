const { PrismaClient } = require("@prisma/client");
const client = require("../config/elasticsearch");
const prisma = new PrismaClient();

exports.getJenisPeraturan = async (req, res) => {
  try {
    const data = await prisma.ppj_peraturan_category.findMany({
      where: {
        AND: [{ tipe: "TYPE_1" }, { percategorykondisi: "TYPE_1" }],
      },
      orderBy: {
        order: "asc",
      },
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

exports.getJeniSubstansi = async (req, res) => {
  try {
    const data = await prisma.ppj_tags.findMany({
      orderBy: {
        order: "asc",
      },
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

exports.getDataPeraturan = async (req, res) => {
  try {
    let dataPost = req.body;
    let page = 0,
      limit = 10;

    if (dataPost?.page !== undefined) {
      page = await parseInt(dataPost.page);
    }

    let start = (page - 1) * limit,
      length = limit,
      judul = req.body.search.judul,
      peraturan_category_id = req.body.search.peraturan_category_id,
      jns_substansi = req.body.search.jns_substansi;
    (nomor = req.body.search.nomor),
      (tahun = req.body.search.tahun),
      (nomorPeraturan = req.body.search.nomorPeraturan),
      (tglPeraturan = req.body.search.tglPeraturan);

    const mustClauses = [];
    const shouldClauses = [];

    if (judul) {
      shouldClauses.push({ match: { judul: judul } });
      shouldClauses.push({ match: { keyword_search: judul } });
    }

    if (peraturan_category_id) {
      shouldClauses.push({
        term: { peraturan_category_id: peraturan_category_id },
      });
    }

    if (jns_substansi) {
      shouldClauses.push({ match: { tags: jns_substansi } });
    }

    if (nomor) {
      shouldClauses.push({ match: { noperaturan: nomor } });
    }

    if (tahun) {
      shouldClauses.push({ term: { tahun: tahun } });
    }

    const params = {
      index: "peraturan",
      body: {
        from: parseInt(start),
        size: parseInt(length),
        query: {
          bool: {
            should: shouldClauses,
          },
        },
        sort: [{ _score: { order: "desc" } }],
      },
    };

    const response = await client.search(params);
    const hitsData = response.hits.hits;
    let statusBerlaku = "";

    const data = await Promise.all(
      hitsData.map(async (hit) => {
        let item = hit._source;

        let result = await prisma.$queryRawUnsafe(`
          SELECT 
            a.*, 
            b.slug, 
            b.judul, 
            b.tentang, 
            c.percategoryname, 
            c.percategorycode
          FROM (
            SELECT * FROM ppj_peraturan_detail WHERE peraturan_id = '${item.peraturan_id}'
          ) AS a
          LEFT JOIN (
            SELECT * FROM ppj_peraturan
          ) AS b ON b.peraturan_id = a.peraturan_id_modifikasi
          LEFT JOIN (
            SELECT * FROM ppj_peraturan_category
          ) AS c ON b.peraturan_category_id = c.peraturan_category_id
        `);

        let dataReal = await prisma.$queryRawUnsafe(
          `SELECT * FROM ppj_peraturan WHERE peraturan_id='${item.peraturan_id}'`
        );

        let dataCatgory = await prisma.$queryRawUnsafe(
          `select percategorycode from ppj_peraturan_category where peraturan_category_id=${item.peraturan_category_id}`
        );

        let jnsPeraturan = (await (dataReal &&
          dataReal[0] &&
          dataReal[0].peraturan_category_id != undefined))
          ? await prisma.$queryRawUnsafe(
              `select percategoryname FROM ppj_peraturan_category WHERE peraturan_category_id='${dataReal[0].peraturan_category_id}'`
            )
          : "";

        if (
          dataReal &&
          dataReal[0] &&
          typeof dataReal[0].status !== "undefined"
        ) {
          statusBerlaku =
            dataReal[0].status === "1"
              ? "Tidak Berlaku " + formatRelativeDate(dataReal[0].tanggal)
              : "Berlaku " + formatRelativeDate(dataReal[0].tanggal);
        }

        return {
          ...item,
          logDataPeraturan: result,
          dataRealPeraturan: dataReal,
          statusPeraturn: statusBerlaku,
          jnsPeraturan: jnsPeraturan?.[0]?.percategoryname,
          pathAbstrak: `https://jdih.pu.go.id/internal/assets/assets/produk_abstrak/${
            dataCatgory[0].percategorycode
          }/${item.tanggal.slice(0, 4)}/${item.tanggal.slice(4, 6)}/${
            item.file_abstrak
          }`,
          pathFile: `https://jdih.pu.go.id/internal/assets/assets/produk/${
            dataCatgory[0].percategorycode
          }/${item.tanggal.slice(0, 4)}/${item.tanggal.slice(4, 6)}/${
            item.file_upload
          }`,
        };
      })
    );

    const total = response.hits.total.value;

    return res.status(200).json({
      status: true,
      data: {
        posts: data,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
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

exports.getDataDetailPeraturan = async (req, res) => {
  try {
    const dataPost = await req.body;

    const data = await prisma.ppj_peraturan.findFirst({
      where: {
        slug: dataPost.slug,
      },
    });

    const dataCatgori = await prisma.ppj_peraturan_category.findFirst({
      where: {
        peraturan_category_id: data.peraturan_category_id,
      },
    });

    const dataLogPeraturan = await prisma.$queryRawUnsafe(
      `select b.slug,c.percategorycode, a.noperaturan, b.judul, a.tentang, a.status  from (select * from ppj_peraturan_detail WHERE peraturan_id="${data.peraturan_id}") as a
      LEFT JOIN (select * from ppj_peraturan) as b on a.peraturan_id_modifikasi=b.peraturan_id
      LEFT JOIN (SELECT * FROM ppj_peraturan_category) as c on b.peraturan_category_id=c.peraturan_category_id`
    );

    const dataFileParsial = await prisma.ppj_peraturan_file.findMany({
      where: {
        peraturan_id: data.peraturan_id,
      },
      orderBy: {
        id: "asc",
      }
    });


    return res.status(200).json({
      status: true,
      data: data,
      dataCategory: dataCatgori,
      daraLogPeraturan: dataLogPeraturan,
      dataFileParsial: dataFileParsial
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};

function formatRelativeDate(yyyymmdd) {
  const year = parseInt(yyyymmdd.slice(0, 4));
  const month = parseInt(yyyymmdd.slice(4, 6)) - 1; // bulan dimulai dari 0
  const day = parseInt(yyyymmdd.slice(6, 8));

  const inputDate = new Date(year, month, day);
  const now = new Date();

  const diffInMonths =
    (now.getFullYear() - inputDate.getFullYear()) * 12 +
    (now.getMonth() - inputDate.getMonth());

  return `${diffInMonths} bulan yang lalu`;
}
