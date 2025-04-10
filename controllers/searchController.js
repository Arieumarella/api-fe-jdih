const { PrismaClient } = require("@prisma/client");
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};
