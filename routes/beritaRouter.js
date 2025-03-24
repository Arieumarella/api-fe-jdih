const express = require("express"),
router = express.Router(),
beritaController = require("../controllers/beritaController");

router.route('/Berita/detail').post(beritaController.getDetailBerita);
router.route('/Berita/pagination').post(beritaController.getPagination);

module.exports = router;