/**
 * routes/cards.js — Trasy dla kart piłkarzy
 */
const router = require("express").Router();
const { auth, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ctrl = require("../controllers/cardController");

// Publiczne
router.get("/", ctrl.getAll);
router.get("/image-proxy", ctrl.proxyImage);
router.get("/search-player", auth, adminOnly, ctrl.searchApiPlayer);
router.get("/preview-player/:id", auth, adminOnly, ctrl.previewApiPlayer);
router.get("/:id", ctrl.getOne);

// Admin
router.post("/", auth, adminOnly, ctrl.createFromApi);
router.post(
    "/custom",
    auth,
    adminOnly,
    upload.single("image"),
    ctrl.createCustom,
);
router.put("/:id", auth, adminOnly, ctrl.update);
router.delete("/:id", auth, adminOnly, ctrl.remove);

module.exports = router;
