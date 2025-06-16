const express = require("express"),
  router = express.Router(),
  aiController = require("../controllers/aiController");

router.route("/ai/chat").post(aiController.Chat);
router.route("/ai/chatGeneral").post(aiController.ChatGeneral);
router.route("/ai/ChatPantun").get(aiController.ChatPantun);

module.exports = router;