const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const dayjs = require("dayjs");

exports.getDetailMonografi = async (req, res) => {
  try {
    const dataPost = req.body;
    const data = await prisma.ppj_peraturan.findFirst({
      where: {
        slug: dataPost.slug,
      },
    });

    console.log(data);

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

exports.getPaginationMonografi = async (req, res) => {
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

    const posts = await prisma.ppj_peraturan.findMany({
      skip,
      take: limit,
      orderBy: { peraturan_id: "desc" },
      where: {
        AND: [
          { tipe_dokumen: "TYPE_2" },
          { kondisi: "TYPE_3" },
          search ? { judul: { contains: search } } : {},
        ],
      },
    });

    const totalPosts = await prisma.ppj_peraturan.count({
      where: {
        AND: [
          { tipe_dokumen: "TYPE_2" },
          { kondisi: "TYPE_3" },
          search ? { judul: { contains: search } } : {},
        ],
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
