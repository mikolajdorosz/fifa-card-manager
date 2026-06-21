const router = require('express').Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/squadController');

router.get('/', auth, ctrl.getSquad);
router.put('/', auth, ctrl.saveSquad);

module.exports = router;
