const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/sbcController');

router.get('/', ctrl.getAll);
router.get('/admin', auth, adminOnly, ctrl.getAllAdmin);
router.post('/', auth, adminOnly, ctrl.create);
router.put('/:id/toggle', auth, adminOnly, ctrl.toggleActive);
router.post('/:id/submit', auth, ctrl.submit);

module.exports = router;
