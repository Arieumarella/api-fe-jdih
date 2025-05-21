const express = require("express"),
  router = express.Router(),
  searchController = require("../controllers/searchController");

router
  .route("/search/getJenisPeraturan")
  .get(searchController.getJenisPeraturan);

router
  .route("/search/getJenisSubstansi")
  .get(searchController.getJeniSubstansi);

router
  .route("/search/getDataPeraturan")
  .post(searchController.getDataPeraturan);

router
  .route("/search/getDetailPeraturan")
  .post(searchController.getDataDetailPeraturan);

router
  .route("/search/postMasukanDanKriting")
  .post(searchController.postMasukanDanKriting);

router.route("/search/getUnor").get(searchController.getUnitOrganisasi);

router
  .route("/search/addViews")
  .post(searchController.addViews);

router
  .route("/search/addDownload")
  .post(searchController.addDownload);




module.exports = router;
