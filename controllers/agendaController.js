const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.pagination = async (req, res) => {
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

    const posts = await prisma.tb_agenda.findMany({
      skip,
      take: limit,
      orderBy: { id: "desc" },
      where: {
        judul: {
          contains: search,
        },
      },
    });

    const totalPosts = await prisma.tb_agenda.count({
      where: search ? { judul: { contains: search } } : {},
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
