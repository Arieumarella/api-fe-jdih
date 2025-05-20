const express = require("express"),
router = express.Router(),
infografisController = require("../controllers/infografisController");

router.route('/infografis/pagination').post(infografisController.getPaginationInfografis);
router.route('/infografis/detail').post(infografisController.getDetailInfografis);
router.route('/infografis/InsertViewr').post(infografisController.InsertViewr);

module.exports = router;