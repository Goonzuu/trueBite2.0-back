const express = require("express");
const { sendOk, sendServerError } = require("../lib/api-response");

const router = express.Router();

router.get("/me/benefits", (req, res) => {
  try {
    res.status(200).json({ success: true, data: [], count: 0 });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

module.exports = router;