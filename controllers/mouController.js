const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getPaginationMou = async (req, res) => {
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
          { tipe_dokumen: "TYPE_1" },
          { kondisi: "TYPE_3" },
          { peraturan_category_id: 22 },
          search ? { judul: { contains: search } } : {},
        ],
      },
    });

    const totalPosts = await prisma.ppj_peraturan.count({
      where: {
        AND: [
          { tipe_dokumen: "TYPE_1" },
          { kondisi: "TYPE_3" },
          { peraturan_category_id: 22 },
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


exports.getDetailMou = async (req, res) => {
  try {
    const dataPost = await req.body;

     let data = await prisma.ppj_peraturan.findUnique({
      where: {
        slug: dataPost.slug,
      }
    });

    

    let dataCategory = await prisma.ppj_peraturan_category.findUnique({
      where: {
        peraturan_category_id: data.peraturan_category_id,
      }
    });

    return res.status(200).json({
      status: data ? true : false,
      data: data,
      dataCategory: dataCategory
    });
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
}

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
}

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
}