const router = require('express').Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/collectionController');

router.get('/', auth, ctrl.getMyCollection);

module.exports = router;
