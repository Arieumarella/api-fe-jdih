const { PrismaClient } = require("@prisma/client");
const client = require("../config/elasticsearch");
const prisma = new PrismaClient();

exports.getDataSimpel = async (req, res) => {
    try {
        let dataPost = req.body;
        let idPeraturan = parseInt(dataPost.idPeraturan);
        let search = dataPost?.search || '';
        let page = parseInt(dataPost.page) || 1;
        let limit = 5;
        let skip = (page - 1) * limit;
        let where = await ``;

        let conditions = [];
        let params = [];

        if (idPeraturan === 5) {
            conditions.push("jenis_peraturan = ?");
            params.push("UU");
        } else if (idPeraturan === 1) {
            conditions.push("(jenis_peraturan = ? OR jenis_peraturan = ?)");
            params.push("PP", "PERPRES");
        } else if (idPeraturan === 2) {
            conditions.push("jenis_peraturan = ?");
            params.push("PERMEN");
        } else if (idPeraturan === 3) {
            conditions.push("(jenis_peraturan = ? OR jenis_peraturan = ?)");
            params.push("RPP", "RPERPRES");
        } else if (idPeraturan === 4) {
            conditions.push("jenis_peraturan = ?");
            params.push("RPERMEN");
        }

        if (search.trim() !== '') {
            conditions.push("nm_produk_hukum LIKE ?");
            params.push(`%${search}%`);
        }

        // Add limit and offset
        params.push(limit);
        params.push(skip);

        let whereClause = await conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

        let query = `
            SELECT * FROM t_pengusulan_puu 
            WHERE 1=1 ${whereClause} 
            ORDER BY id DESC 
            LIMIT ? OFFSET ?
        `;

        let data = await prisma.$queryRawUnsafe(query, ...params);


        let conditionsSearc = [];
        let paramsSearc = [];

        if (idPeraturan === 5) {
            conditionsSearc.push("jenis_peraturan = ?");
            paramsSearc.push("UU");
        } else if (idPeraturan === 1) {
            conditionsSearc.push("(jenis_peraturan = ? OR jenis_peraturan = ?)");
            paramsSearc.push("PP", "PERPRES");
        } else if (idPeraturan === 2) {
            conditionsSearc.push("jenis_peraturan = ?");
            paramsSearc.push("PERMEN");
        } else if (idPeraturan === 3) {
            conditionsSearc.push("(jenis_peraturan = ? OR jenis_peraturan = ?)");
            paramsSearc.push("RPP", "RPERPRES");
        } else if (idPeraturan === 4) {
            conditionsSearc.push("jenis_peraturan = ?");
            paramsSearc.push("RPERMEN");
        }

        if (search.trim() !== '') {
            conditionsSearc.push("nm_produk_hukum LIKE ?");
            paramsSearc.push(`%${search}%`);
        }

        let whereClauseSearch = await conditionsSearc.length > 0 ? `AND ${conditionsSearc.join(" AND ")}` : "";

        let jmlData = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) AS jml FROM t_pengusulan_puu WHERE 1=1 ${whereClauseSearch}`, ...paramsSearc
          );

        let totalData = await Number(jmlData[0].jml);
          
      
          data = data.map((row) => {
            const fixedRow = {};
            for (const key in row) {
              fixedRow[key] =
                typeof row[key] === "bigint" ? row[key].toString() : row[key];
            }
            return fixedRow;
          });

          dataFix = await Promise.all(data.map(async (row) => {

            if (parseInt(idPeraturan) == 1 || parseInt(idPeraturan) == 2 || parseInt(idPeraturan) == 5) {
                kdb03= await 1;
                kdb06= await 2;
                kdb09= await 3;
                kdb12= await 4;
            }

            if (parseInt(idPeraturan) == 3) {
                kdb03= await 5;
                kdb06= await 6;
                kdb09= await 7;
                kdb12= await 8;
            }

            if (parseInt(idPeraturan) == 4) {
                kdb03= await 9;
                kdb06= await 10;
                kdb09= await 11;
                kdb12= await 12;
            }

            
            if (row.jenis_peraturan == "PERPRES") {
                row.jenis_peraturan = "Peraturan Pemerintah Republik Indonesia";
            }

            let b03 = await prisma.$queryRawUnsafe(
                `SELECT path, b.nama FROM (SELECT * FROM t_target_peraturan_melekat_pada_peraturan WHERE id_peraturan='${row.id}') AS a
                LEFT JOIN (SELECT * FROM t_target_capaian) AS b ON a.id_target_capaian=b.id
                LEFT JOIN (SELECT * FROM t_masa_bulan) AS c ON b.id_masa=c.id
                WHERE c.id='${kdb03}'`
            );

            let b06 = await prisma.$queryRawUnsafe(
                `SELECT path, b.nama FROM (SELECT * FROM t_target_peraturan_melekat_pada_peraturan WHERE id_peraturan=${row.id}) AS a
                LEFT JOIN (SELECT * FROM t_target_capaian) AS b ON a.id_target_capaian=b.id
                LEFT JOIN (SELECT * FROM t_masa_bulan) AS c ON b.id_masa=c.id
                WHERE c.id='${kdb06}'`
            );


            let b09 = await prisma.$queryRawUnsafe(
                `SELECT path, b.nama FROM (SELECT * FROM t_target_peraturan_melekat_pada_peraturan WHERE id_peraturan=${row.id}) AS a
                LEFT JOIN (SELECT * FROM t_target_capaian) AS b ON a.id_target_capaian=b.id
                LEFT JOIN (SELECT * FROM t_masa_bulan) AS c ON b.id_masa=c.id
                WHERE c.id='${kdb09}'`
            );


            let b12 = await prisma.$queryRawUnsafe(
                `SELECT path, b.nama FROM (SELECT * FROM t_target_peraturan_melekat_pada_peraturan WHERE id_peraturan=${row.id}) AS a
                LEFT JOIN (SELECT * FROM t_target_capaian) AS b ON a.id_target_capaian=b.id
                LEFT JOIN (SELECT * FROM t_masa_bulan) AS c ON b.id_masa=c.id
                WHERE c.id='${kdb12}'`
            );

           return {
                ...row,
                b03: b03,
                b06: b06,
                b09: b09,
                b12: b12,
            };

          }));
    
        

         

        return res.status(200).json({
            posts: dataFix,
            currentPage: page,
            totalPages: Math.ceil(totalData / limit),
            totalData,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error,
        });
    }
};