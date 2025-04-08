const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getDetail = async (req, res) => {
  try {
    const data = await prisma.ppj_widget.findFirst({
      where: {
        widget_id: 1,
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
