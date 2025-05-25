const express = require("express"),
  router = express.Router(),
  dokumenLangkaController = require("../controllers/dokumenLangkaController");

router
  .route("/dokumenLangka/pagination")
  .post(dokumenLangkaController.getPaginationdokumenLangka);

router.route("/dokumenLangka/detail").post(dokumenLangkaController.getDetaildokumenLangka);

router.route("/dokumenLangka/addViews").post(dokumenLangkaController.addViews);
router.route("/dokumenLangka/addDownload").post(dokumenLangkaController.addDownload);

module.exports = router;