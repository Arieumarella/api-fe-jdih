const express = require("express"),
router = express.Router(),
homeController = require("../controllers/homeController");

router.route('/home/getNuwPeraturan').get(homeController.getNuwPeraturan);
router.route('/home/getBanner').get(homeController.getBanner);
router.route('/home/getUnitOrganisasi').get(homeController.getUnitOrganisasi);
router.route('/home/getLinkTerkait').get(homeController.getLinkTerkait);
router.route('/home/getKurvaPengunjung').get(homeController.getKurvaPengunjung);
router.route('/home/getJenisPeraturan').get(homeController.getJenisPeraturan);
router.route('/home/getDataBerita').get(homeController.getDataBerita);
router.route('/home/getDataMonografi').get(homeController.getDataMonografi);


module.exports = router;