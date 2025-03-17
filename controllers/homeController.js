const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getNuwPeraturan = async (req, res) => {
    try {
    
    const qry = "SELECT judul,slug, download_count,tanggal, status,if(a.file_abstrak = '', false, CONCAT('internal/assets/assets/produk_abstrak/', b.percategorycode,'/',left(tanggal,4),'/', mid(tanggal,5,2), '/', a.file_abstrak)) as path_abstrak, CONCAT('internal/assets/assets/produk/', b.percategorycode,'/',left(tanggal,4),'/', mid(tanggal,5,2), '/', a.file_upload) as path_file   from (SELECT * from ppj_peraturan where tipe_dokumen=1 AND (sifat=1 or sifat is null) and approval_2 ) as a LEFT JOIN (SELECT * FROM ppj_peraturan_category)  as b on a.peraturan_category_id=b.peraturan_category_id order by a.peraturan_id DESC LIMIT 5";
    
    const dataPeraturan = await prisma.$queryRawUnsafe(qry);

    console.log(dataPeraturan);

    return res.status(200).json({
        status: true,
        data: dataPeraturan
    });

    
    }catch (error) {
        
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error
        });
    
    }
}

exports.getBanner = async (req,res) => {
    try { 

    const sql = `SELECT CONCAT('https://jdih.pu.go.id/internal/assets/assets/banner/', gambar) AS path_file FROM tb_banner_home WHERE STATUS='a' ORDER BY nomor ASC`;

    const data = await prisma.$queryRawUnsafe(sql);

    console.log(data);

    return res.status(200).json({
        status: true,
        data: data
    });

    }catch (error) {
        
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error
        });
    
    }
}