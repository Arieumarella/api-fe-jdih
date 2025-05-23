const express = require("express"),
  router = express.Router(),
  mouController = require("../controllers/mouController");

router
  .route("/Mou/pagination")
  .post(mouController.getPaginationMou);

router.route("/Mou/detail").post(mouController.getDetailMou);

router.route("/Mou/addViews").post(mouController.addViews);
router.route("/Mou/addDownload").post(mouController.addDownload);

module.exports = router;