const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const dayjs = require("dayjs");

exports.getDetailInfografis = async (req, res) => {
  try {
    const dataPost = await req.body;
   
    const dataX = await prisma.tb_infografis.findFirst({
      where: {
        id: dataPost.id,
      },
    });

    // Ubah semua BigInt ke String
    const formattedData = Object.fromEntries(
      Object.entries(dataX).map(([key, value]) => [
        key,
        value.toString(),
      ])
    );


    return res.status(200).json({
      status: true,
      data: formattedData,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};

exports.getPaginationInfografis = async (req, res) => {
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

    const posts = await prisma.tb_infografis.findMany({
      skip,
      take: limit,
      orderBy: { id: "desc" },
      where: {
        AND: [
          search ? { judul: { contains: search } } : {},
        ],
      },
    });

     // Ubah semua BigInt ke String
    const formattedData = await posts.map((row) => {
      return Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          typeof value === "bigint" ? value.toString() : value,
        ])
      );
    });

    const totalPosts = await prisma.tb_infografis.count({
      where: {
        AND: [
          search ? { judul: { contains: search } } : {},
        ],
      },
    });

    return res.status(200).json({
      status: true,
      data: {
        posts: formattedData,
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

exports.InsertViewr = async (req, res) => {
  try {
    const dataPost = await req.body;
    
    let dataCatgory = await prisma.$queryRawUnsafe(
          `SELECT viewr FROM tb_infografis where id=${dataPost.id}`
        );

    let jmlView = await dataCatgory[0].viewr == null ? 0 : Number(dataCatgory[0].viewr);

    const data = await prisma.tb_infografis.update({
      where: {
        id: dataPost.id,
      },
      data: {
        viewr: jmlView + 1,
      },
    });
    
    
    return res.status(200).json({
      status: true,
      message: "data berhasil diupdate",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};
