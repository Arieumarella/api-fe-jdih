const express = require("express"),
router = express.Router(),
BelanggananDanKepuasanMasyarakatController = require("../controllers/BelanggananDanKepuasanMasyarakatController");

router.route('/footer/getDataRating').get(BelanggananDanKepuasanMasyarakatController.getDataRating);
router.route('/footer/postRating').post(BelanggananDanKepuasanMasyarakatController.postRating);

module.exports = router;