const express = require("express"),
  router = express.Router(),
  KpPerencanaanController = require("../controllers/KpPerencanaanController");

router
  .route("/kp-perencanaan/pagination")
  .post(KpPerencanaanController.getPaginationPerencanaanKp);

// Tambahkan route untuk insert masukan
router
  .route("/kp-perencanaan/masukan")
  .post(KpPerencanaanController.insertMasukan);

module.exports = router;
