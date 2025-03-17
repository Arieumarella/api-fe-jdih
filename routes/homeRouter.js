const express = require("express"),
router = express.Router(),
homeController = require("../controllers/homeController");

router.route('/home/getNuwPeraturan').get(homeController.getNuwPeraturan);
router.route('/home/getBanner').get(homeController.getBanner);

module.exports = router;