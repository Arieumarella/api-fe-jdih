const express = require("express"),
router = express.Router(),
pengunjungController = require("../controllers/pengunjungController");

router.route('/Pengunjung/insertData').post(pengunjungController.insertData);

module.exports = router;