const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dayjs = require("dayjs");

exports.getDataRating = async (req, res) => {
    try {

        const qry = "select count(*) as totData, rating from tb_rating group by rating order by rating desc";
        const data = await prisma.$queryRawUnsafe(qry); 
        
        const formattedData = data.map(row => {
            return Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    key,
                    typeof value === 'bigint' ? value.toString() : value
                ])
            );
        });



        let totalNilai = 0;
        let totalPemberiRating = 0;

        await formattedData.forEach(item => {
            totalNilai += item.rating * item.totData; 
            totalPemberiRating += parseFloat(item.totData);
        });

        
        const rataRata = await totalNilai / totalPemberiRating;

        const packageData = {
            'dataArray' : formattedData,
            'totalNilai' : totalNilai,
            'totalPemberiRating' : totalPemberiRating,
            'rataRata' : rataRata.toFixed(1)
        }
        
        return res.status(200).json({
            status: true,
            data: packageData
        });

    }
    catch (error) {
        
        console.log(error); 
        return res.status(500).json({
            status: false,
            message: error
        })
    
    }
}

exports.postRating = async (req, res) => {
    try {

        const dataPost = req.body;
        const dateNow = dayjs().format("DD/MM/YYYY");

        if (!dataPost.nama || !dataPost.email || !dataPost.saran || !dataPost.rating) {
            return res.status(400).json({
                status: false,
                msg: "Data tidak lengkap."
            });
        }

        const insertRating = {
            'nama' : dataPost.nama,
            'email' : dataPost.email,
            'deskripsi' : dataPost.saran,
            'rating' : parseFloat(dataPost.rating),
            'tanggal' : dateNow
        }

        const result = await prisma.tb_rating.create({
            data: insertRating
        });
        

        if (result) {
            return res.status(200).json({
                status: true,
                msg: "Data Rating Berhasil disimpan."
            });
        } else {
            return res.status(401).json({
                status: true,
                msg: "Data Rating Gagal disimpan."
            });
        }

    }
    catch (error) {
        
        console.log(error); 
        return res.status(500).json({
            status: false,
            message: error
        })
    
    }
}

exports.postLangganan = async (req, res) => {
    try {

        const dataPost = req.body;
        const dateNow = dayjs().format("DD/MM/YYYY");

        if (!dataPost.email || !dataPost.nama) {
            return res.status(400).json({
                status: false,
                msg: "Data tidak lengkap."
            });
        }

        const insertLangganan = {
            'email' : dataPost.email,
            'nama' : dataPost.nama,
            'tgl_buat' : dateNow,
            'status' : "0"
        }

        const result = await prisma.tb_subscribe.create({
            data: insertLangganan
        });
        
        
        if (result) {
            return res.status(200).json({
                status: true,
                msg: "Data Langganan Berhasil disimpan."
            });
        } else {
            return res.status(401).json({
                status: true,
                msg: "Data Langganan Gagal disimpan."
            });
        }

    }
    catch (error) {
        
        console.log(error); 
        return res.status(500).json({
            status: false,
            message: error
        })
    
    }
}
