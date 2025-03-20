const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getNuwPeraturan = async (req, res) => {
    try {
    
    const qry = "SELECT judul,slug, download_count,tanggal, status,if(a.file_abstrak = '', false, CONCAT('https://jdih.pu.go.id/internal/assets/assets/produk_abstrak/', b.percategorycode,'/',left(tanggal,4),'/', mid(tanggal,5,2), '/', a.file_abstrak)) as path_abstrak, CONCAT('https://jdih.pu.go.id/internal/assets/assets/produk/', b.percategorycode,'/',left(tanggal,4),'/', mid(tanggal,5,2), '/', a.file_upload) as path_file, a.file_upload from (SELECT * from ppj_peraturan where tipe_dokumen=1 AND (sifat=1 or sifat is null) and approval_2 ) as a LEFT JOIN (SELECT * FROM ppj_peraturan_category)  as b on a.peraturan_category_id=b.peraturan_category_id order by a.peraturan_id DESC LIMIT 5";
    
    const dataPeraturan = await prisma.$queryRawUnsafe(qry);

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

exports.getUnitOrganisasi = async (req, res) => {
    try {
    
    const qry = "select deptname,dept_id from ppj_departemen where parent_id='0' AND parent_id <> '10' AND dept_id <> '10' order by ppj_departemen.order ASC";
    
    const data = await prisma.$queryRawUnsafe(qry);

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

exports.getLinkTerkait = async (req, res) => {
    try {

        const qry = "select linkname, linkurl from ppj_link_terkait";
        const data = await prisma.$queryRawUnsafe(qry);

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

exports.getKurvaPengunjung = async (req, res) => {
    try {

        const qry = "SELECT  CASE DAYOFWEEK(waktu) WHEN 1 THEN 'Minggu' WHEN 2 THEN 'Senin' WHEN 3 THEN 'Selasa' WHEN 4 THEN 'Rabu' WHEN 5 THEN 'Kamis' WHEN 6 THEN 'Jumat' WHEN 7 THEN 'Sabtu' END AS name, jml as Pengunjung FROM tb_hit_date WHERE waktu BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE() ORDER BY waktu asc";
        const data = await prisma.$queryRawUnsafe(qry);

        // Ubah semua BigInt ke String
        const formattedData = data.map(row => {
            return Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    key,
                    typeof value === 'bigint' ? value.toString() : value
                ])
            );
        });

        return res.status(200).json({
            status: true,
            data: formattedData
        });

    }
    catch (error) {
        
        console.log(error); 
        return res.status(500).json({
            status: false,
            message: error
        });
    
    }
}

exports.getJenisPeraturan = async (req, res) => {
    try {

    const qry = "select peraturan_category_id,percategoryname from ppj_peraturan_category where percategorykondisi='1'  and tipe='1' order by ppj_peraturan_category.order ASC";
    const data = await prisma.$queryRawUnsafe(qry);

    return res.status(200).json({
        status: true,
        data: data
    });


    }
    catch (error) {
        
        console.log(error); 
        return res.status(500).json({
            status: false,
            message: error
        });
    
    }
}


exports.getDataBerita = async (req, res) => {
    try {
        
        const qry = "select id, judul, CONCAT('https://jdih.pu.go.id/internal/assets/assets/berita/', gambar_1) AS path_file, slug from tb_berita order by tgl_modifikasi DESC limit 7";
        const data = await prisma.$queryRawUnsafe(qry);

        return res.status(200).json({
            status: true,
            data: data
        });
    
    }
    catch (error) {
        
        console.log(error); 
        return res.status(500).json({
            status: false,
            message: error
        });
    
    }
}

exports.getDataMonografi = async (req, res) => {
    try {

        const qry = `SELECT 
            peraturan_id, 
            judul,
            CONCAT('https://jdih.pu.go.id/internal/assets/assets/produk/monografi/', percategorycode, '/', LEFT(tanggal,4), '/11/', file_upload) AS path_file,
            a.slug
            FROM (SELECT * FROM ppj_peraturan WHERE tipe_dokumen=2 AND kondisi='3') AS a
            LEFT JOIN (SELECT * FROM ppj_peraturan_category) AS b ON a.peraturan_category_id=b.peraturan_category_id ORDER BY tanggal desc`;

        const data = await prisma.$queryRawUnsafe(qry);

        return res.status(200).json({
            status: true,
            data: data
        });
    }
    catch (error) {
        
        console.log(error); 
        return res.status(500).json({
            status: false,
            message: error
        });
    
    }
}