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

    const pemrakarsa = await prisma.ppj_departemen.findFirst({
      where: {
        parent_id: parseInt(dataX?.parent_id),
        dept_id: parseInt(dataX?.dept_id),
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
      pemrakarsa: pemrakarsa,
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
    const dataPost = await req.body;

    // Sanitize and validate input
    const search =
      dataPost.search !== undefined
        ? String(dataPost.search).trim().toLowerCase()
        : "";

    let page = 1;
    let limit = 6;

    if (dataPost?.page !== undefined) {
      page = Math.max(1, parseInt(dataPost.page) || 1);
    }

    const offset = (page - 1) * limit;

    // Execute main query with proper parameterization
    let posts;
    if (search) {
      const searchParam = `%${search}%`;
      posts = await prisma.$queryRaw`
        SELECT a.*, b.deptcode FROM (
          SELECT * FROM t_konsultasi_publik
        ) AS a
        LEFT JOIN (
          SELECT dept_id, parent_id, deptcode FROM ppj_departemen
        ) AS b ON a.dept_id = b.dept_id AND a.parent_id = b.parent_id
        WHERE LOWER(a.judul_rancangan_peraturan) LIKE ${searchParam}
        GROUP BY a.id 
        ORDER BY a.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      posts = await prisma.$queryRaw`
        SELECT a.*, b.deptcode FROM (
          SELECT * FROM t_konsultasi_publik
        ) AS a
        LEFT JOIN (
          SELECT dept_id, parent_id, deptcode FROM ppj_departemen
        ) AS b ON a.dept_id = b.dept_id AND a.parent_id = b.parent_id
        GROUP BY a.id 
        ORDER BY a.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Execute count query with proper parameterization
    let countResult;
    if (search) {
      const searchParam = `%${search}%`;
      countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as total FROM (
          SELECT a.id FROM (
            SELECT * FROM t_konsultasi_publik
          ) AS a
          LEFT JOIN (
            SELECT dept_id, parent_id, deptcode FROM ppj_departemen
          ) AS b ON a.dept_id = b.dept_id AND a.parent_id = b.parent_id
          WHERE LOWER(a.judul_rancangan_peraturan) LIKE ${searchParam}
          GROUP BY a.id
        ) AS counted
      `;
    } else {
      countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as total FROM (
          SELECT a.id FROM (
            SELECT * FROM t_konsultasi_publik
          ) AS a
          LEFT JOIN (
            SELECT dept_id, parent_id, deptcode FROM ppj_departemen
          ) AS b ON a.dept_id = b.dept_id AND a.parent_id = b.parent_id
          GROUP BY a.id
        ) AS counted
      `;
    }

    const totalPosts = Number(countResult[0].total);

    // Convert BigInt values to strings for JSON serialization
    const formattedPosts = posts.map((post) => {
      return Object.fromEntries(
        Object.entries(post).map(([key, value]) => [
          key,
          typeof value === "bigint" ? value.toString() : value,
        ])
      );
    });

    return res.status(200).json({
      status: true,
      data: {
        posts: formattedPosts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
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
