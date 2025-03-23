const { PrismaClient } = require('@prisma/client');
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
