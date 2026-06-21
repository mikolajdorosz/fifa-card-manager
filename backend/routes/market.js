const router = require('express').Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/marketController');

router.get('/', ctrl.getListings);
router.post('/', auth, ctrl.listCard);
router.post('/:id/buy', auth, ctrl.buyCard);
router.delete('/:id', auth, ctrl.cancelListing);

module.exports = router;
