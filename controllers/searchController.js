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
      length = await limit,
      judul = await req.body.search.judul,
      peraturan_category_id = await req.body.search.peraturan_category_id,
      jns_substansi = await req.body.search.jns_substansi,
      nomor = await req.body.search.nomor,
      tahun = await req.body.search.tahun,
      unor = await req.body.search.unor;

      cekStr = await getCategoryId(judul);
      
      

    const mustClauses = [];
    const shouldClauses = [];

    if (judul) {
      shouldClauses.push({ match: { judul: judul } });
      shouldClauses.push({ match: { keyword_search: judul } });
    }
    
    if (peraturan_category_id) {
      shouldClauses.push({
        term: {
          peraturan_category_id: {
            value: peraturan_category_id,
            boost: 5, // Tingkatkan skor untuk kategori
          },
        },
      });
    }

    if (cekStr) {
      shouldClauses.push({
        term: {
          peraturan_category_id: {
            value: cekStr,
            boost: 5, // Tingkatkan skor untuk kategori
          },
        },
      });
    }
    
    if (jns_substansi) {
      shouldClauses.push({ match: { tags: jns_substansi } });
    }
    
    if (nomor) {
      shouldClauses.push({ match: { noperaturan: nomor } });
    }
    
    if (tahun) {
      shouldClauses.push({
        term: {
          tahun: {
            value: tahun,
            boost: 5, // Misalnya boost sedang
          },
        },
      });
    }
    
    if (unor) {
      shouldClauses.push({
        term: {
          dept_id: {
            value: parseInt(unor),
            boost: 3, // Bisa disesuaikan
          },
        },
      });
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
    let statusPeraturan = "";

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

              statusPeraturan =
              dataReal[0].status === "1"
                ? "Tidak Berlaku "
                : "Berlaku ";
        }

        return {
          ...item,
          logDataPeraturan: result,
          dataRealPeraturan: dataReal,
          statusPeraturn: statusBerlaku,
          jnsPeraturan: jnsPeraturan?.[0]?.percategoryname,
          statusPeraturan: statusPeraturan,
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
      },
    });

    return res.status(200).json({
      status: true,
      data: data,
      dataCategory: dataCatgori,
      daraLogPeraturan: dataLogPeraturan,
      dataFileParsial: dataFileParsial,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};

exports.postMasukanDanKriting = async (req, res) => {
  try {
    const dataPost = await req.body;

    const insertKritik = {
      peraturan_id: parseInt(dataPost.peraturan_id),
      tanggal: getCurrentDateFormatted(),
      tipe: "1",
      nama: dataPost.nama,
      email: dataPost.email,
      komentar: dataPost.saran,
      berkas: "",
    };

    const result = await prisma.tb_sk.create({
      data: insertKritik,
    });

    return res.status(200).json({
      status: true,
      msg: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};

exports.getUnitOrganisasi = async (req, res) => {
  try {
    const qry =
      "select deptname,dept_id from ppj_departemen where parent_id='0' AND parent_id <> '10' AND dept_id <> '10' order by ppj_departemen.order ASC";

    const data = await prisma.$queryRawUnsafe(qry);

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


exports.addViews = async (req, res) => {
  try {
    const dataPost = await req.body;

    let dataCategory = await prisma.ppj_peraturan.findUnique({
      where: {
        slug: dataPost.slug,
      },
      select: {
        view_count: true,
      },
    });

    let jmlView = await dataCategory.view_count == null ? 0 : Number(dataCategory.view_count);

    const data = await prisma.ppj_peraturan.update({
      where: {
        slug: dataPost.slug,
      },
      data: {
        view_count: jmlView + 1,
      },
    });
    
    
    return res.status(200).json({
      status: true,
      message: "data berhasil diupdate",
      hasil: data
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};

exports.addDownload = async (req, res) => {
  try {
    const dataPost = await req.body;

    let dataCategory = await prisma.ppj_peraturan.findUnique({
      where: {
        slug: dataPost.slug,
      },
      select: {
        download_count: true,
      },
    });

    let jmlDownload = await dataCategory.download_count == null ? 0 : Number(dataCategory.download_count);

    const data = await prisma.ppj_peraturan.update({
      where: {
        slug: dataPost.slug,
      },
      data: {
        download_count: jmlDownload + 1,
      },
    });
    
    
    return res.status(200).json({
      status: true,
      message: "data berhasil diupdate",
      hasil: data
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

const getCurrentDateFormatted = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // bulan dari 0-11
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
};

function containsAnyKeyword(judul, keywordArray) {
  if (!judul) return false;
  const lowerJudul = judul.toLowerCase();
  return keywordArray.some(keyword => lowerJudul.includes(keyword.toLowerCase()));
}


function getCategoryId(judul) {

  const permenWord = ['peraturan menteri', "Peraturan Menteri", "permen", "Permen", "PERMEN"];
  const uuWord = ['undang-undang', 'Undang-Undang', 'uu', 'UU', 'U.U.', 'u.u.'];
  const ppWord = ['peraturan pemerintah', 'Peraturan Pemerintah', 'pp', 'PP', 'P.P.', 'p.p.'];
  const perpresWord = ['peraturan presiden', 'Peraturan Presiden', 'perpres', 'Perpres', 'PRES', 'pres'];
  const keppresWord = [
    'keputusan presiden',
    'Keputusan Presiden',
    'keppres',
    'Keppres',
    'KEPPRES'
  ];
  const inpresWord = [
    'instruksi presiden',
    'Instruksi Presiden',
    'inpres',
    'Inpres',
    'INPRES'
  ];
  const kepmenWord = [
    'keputusan menteri',
    'Keputusan Menteri',
    'kepmen',
    'Kepmen',
    'KEPMEN'
  ];
  const seMenWord = [
    'surat edaran menteri',
    'Surat Edaran Menteri',
    'se menteri',
    'SE Menteri',
    'SEMENTERI',
    'semen'
  ];
  const inmenWord = [
    'instruksi menteri',
    'Instruksi Menteri',
    'inmen',
    'Inmen',
    'INMEN'
  ];
  const kepSesjenWord = [
    'keputusan sekertaris jenderal',
    'Keputusan Sekertaris Jenderal',
    'keputusan sesjen',
    'Keputusan Sesjen',
    'kepsesjen',
    'KepSesjen',
    'KEPSESJEN'
  ];
  const inSesjenWord = [
    'instruksi sekertaris jenderal',
    'Instruksi Sekertaris Jenderal',
    'instruksi sesjen',
    'Instruksi Sesjen',
    'insesjen',
    'InSesjen',
    'INSESJEN'
  ];

  // ID kategori peraturan yang sesuai dengan masing-masing kategori
  const categoryCodes = {
    'UU': 1,
    'Perpu': 2,
    'PP': 3,
    'Perpres': 4,
    'Keppres': 5,
    'Inpres': 6,
    'PermenPUPR': 8,
    'KepmenPUPR': 9,
    'InmenPUPR': 10,
    'SEMenteriPUPR': 11,
    'SESekjenPUPR': 12,
    'KepSekJen': 23,
    'terjemahan': 54
  };


  if (containsAnyKeyword(judul, permenWord)) {
    return categoryCodes['PermenPUPR'];
  }

  if (containsAnyKeyword(judul, uuWord)) {
    return categoryCodes['UU'];
  }

  if (containsAnyKeyword(judul, ppWord)) {
    return categoryCodes['PP'];
  }

  if (containsAnyKeyword(judul, perpresWord)) {
    return categoryCodes['Perpres'];
  }

  if (containsAnyKeyword(judul, keppresWord)) {
    return categoryCodes['Keppres'];
  }

  if (containsAnyKeyword(judul, inpresWord)) {
    return categoryCodes['Inpres'];
  }

  if (containsAnyKeyword(judul, kepmenWord)) {
    return categoryCodes['KepmenPUPR'];
  }

  if (containsAnyKeyword(judul, seMenWord)) {
    return categoryCodes['SEMenteriPUPR'];
  }

  if (containsAnyKeyword(judul, inmenWord)) {
    return categoryCodes['InmenPUPR'];
  }

  if (containsAnyKeyword(judul, kepSesjenWord)) {
    return categoryCodes['SESekjenPUPR'];
  }

  if (containsAnyKeyword(judul, inSesjenWord)) {
    return categoryCodes['KepSekJen'];
  }

  return null; // Tidak ditemukan kategori
}

