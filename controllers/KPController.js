const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getDetailKP = async (req, res) => {
  try {
    const dataPost = await req.body;

    const dataX = await prisma.t_konsultasi_publik.findFirst({
      where: {
        slug: dataPost.slug,
      },
    });

    // Ubah semua BigInt ke String
    const formattedData = Object.fromEntries(
      Object.entries(dataX).map(([key, value]) => [
        key,
        typeof value === "bigint" ? value.toString() : value,
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

exports.getPaginationKP = async (req, res) => {
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

    const posts = await prisma.t_konsultasi_publik.findMany({
      skip,
      take: limit,
      orderBy: { id: "desc" },
      where: {
        AND: [search ? { judul: { contains: search } } : {}],
      },
    });

    const totalPosts = await prisma.t_konsultasi_publik.count({
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

exports.addView = async (req, res) => {
  try {
    const dataPost = await req.body;

    const dataX = await prisma.t_konsultasi_publik.findFirst({
      where: {
        slug: dataPost.slug,
      },
    });

    if (!dataX) {
      return res.status(401).json({
        status: false,
        message: "Data not found",
      });
    }

    await prisma.t_konsultasi_publik.update({
      where: {
        slug: dataPost.slug,
      },
      data: {
        view: dataX?.view == null ? 1 : Number(dataX.view) + 1,
      },
    });

    return res.status(200).json({
      status: true,
      data: "data berhasil ditambah",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};
