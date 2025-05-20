const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDetailBerita = async (req, res) => {
    try {
        const dataPost = req.body;
        const data = await prisma.tb_berita.findFirst({
            where: {
                slug: dataPost.slug,
            },
        });

        return res.status(200).json({
            status: true,
            data: data
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error
        });
    }
}

exports.getPagination = async (req, res) => {
    try {
        const dataPost = await req.body,
        search = await dataPost.search !== undefined ? dataPost.search.toLowerCase() : "";

        let page = 1,
        limit = 6;

        if(dataPost?.page !== undefined ){
            page = await parseInt(dataPost.page); 
        }

        const skip = await (page - 1) * limit;

        const posts = await prisma.tb_berita.findMany({
            skip,
            take: limit,
            orderBy: { id: "desc" },
            where: {
                judul: {
                  contains: search
                },
              },
          });
      
        const totalPosts = await prisma.tb_berita.count({
            where: search ? { judul: { contains: search } } : {},
        });
      

        return res.status(200).json({
            status: true,
            data: {
                posts,
                currentPage: page,
                totalPages: Math.ceil(totalPosts / limit),
                totalPosts,
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error
        });
    }
}

exports.insertviews = async (req, res) => {
  try {
    const dataPost = await req.body;
    
    let dataCatgory = await prisma.$queryRawUnsafe(
          `SELECT views FROM tb_berita where slug="${dataPost.slug}"`
        );

    let jmlView = await dataCatgory[0].views == null ? 0 : Number(dataCatgory[0].views);

    const data = await prisma.tb_berita.update({
      where: {
        slug: dataPost.slug,
      },
      data: {
        views: jmlView + 1,
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