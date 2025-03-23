const express = require("express"),
router = express.Router(),
monografiController = require("../controllers/monografiController");

router.route('/Monografi/detail').post(monografiController.getDetailMonografi);

module.exports = router;