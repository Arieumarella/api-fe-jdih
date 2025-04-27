const express = require("express"),
  router = express.Router(),
  aiController = require("../controllers/aiController");

router.route("/ai/chat").post(aiController.Chat);

module.exports = router;