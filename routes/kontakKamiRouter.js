const express = require("express"),
  router = express.Router(),
  kontakKamiController = require("../controllers/kontakKamiController");

router.route("/kontakKami").post(kontakKamiController.insertSarandanKomentar);

module.exports = router;
