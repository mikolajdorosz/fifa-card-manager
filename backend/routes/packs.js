const router = require("express").Router();
const { auth, adminOnly } = require("../middleware/auth");
const ctrl = require("../controllers/packController");

router.get("/", ctrl.getAll);
router.get("/admin", auth, adminOnly, ctrl.getAllAdmin);
router.get("/:id", ctrl.getOne);
router.post("/", auth, adminOnly, ctrl.create);
router.put("/:id", auth, adminOnly, ctrl.update);
router.put("/:id/toggle", auth, adminOnly, ctrl.toggleActive);
router.post("/:id/open", auth, ctrl.openPack);

module.exports = router;
