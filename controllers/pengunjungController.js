const { PrismaClient } = require("@prisma/client");
const client = require("../config/elasticsearch");
const prisma = new PrismaClient();


exports.insertData = async (req, res) => {
    try {
      
        const body = await req.body;
        const ip = await body.ip;
        const halaman = await body.halaman;
        const today = await new Date();
        const tgl = await today.toISOString().slice(0, 10).replace(/-/g, '');
        const waktuTb = await today.toISOString().slice(0, 10);
        const waktu = await Math.floor(Date.now() / 1000);

        const data = prisma.tb_hit_date.create({
            data: {
                ip: ip,
                halaman: halaman,
                tgl: tgl,
                session: "-",
                jml: 1,
                waktu: waktu,
            }
        });

        const cekingData = await prisma.tb_hit_date.findFirst({
            where: {
              waktu: new Date(waktuTb),
            },
          });

        if (cekingData) {
            const updateData = await prisma.tb_hit_date.update({
              where: {
                id: cekingData.id,
              },
              data: {
                jml: Number(cekingData.jml) + 1,
              },
            });
          }else{
            const insertData = await prisma.tb_hit_date.create({
              data: {
                waktu: new Date(waktuTb),
                jml: 1
              }
            });
          } 
          
        return res.status(200).json({
            status: true,
            msg: "data berhasil diinputkan",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error,
        });
    }
};