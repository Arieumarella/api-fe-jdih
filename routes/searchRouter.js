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

module.exports = router;
