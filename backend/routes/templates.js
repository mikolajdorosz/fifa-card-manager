const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/templateController');

router.get('/', ctrl.getAll);
router.post('/', auth, adminOnly, ctrl.create);
router.put('/:id', auth, adminOnly, ctrl.update);
router.delete('/:id', auth, adminOnly, ctrl.remove);
// Upload obrazka tła szablonu (alternatywa dla koloru bgColor)
router.post(
  '/:id/background-image',
  auth,
  adminOnly,
  upload.single('image'),
  ctrl.uploadBackgroundImage,
);

module.exports = router;
