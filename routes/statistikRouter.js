const express = require("express"),
  router = express.Router(),
  statistikController = require("../controllers/statistikController");

router
  .route("/statistik/getRekapJumlahPeraturan")
  .get(statistikController.getRekapJumlahPeraturan);

  router
  .route("/statistik/getTotalDokumentUnor")
  .get(statistikController.getTotalDokumentUnor);

  router
  .route("/statistik/getTotalDownloadDok")
  .get(statistikController.getTotalDownloadDok);

  router
  .route("/statistik/getTotalViewPeraturan")
  .get(statistikController.getTotalViewPeraturan);

  router
  .route("/statistik/getTotalPengunjung")
  .get(statistikController.getTotalPengunjung);

module.exports = router;
