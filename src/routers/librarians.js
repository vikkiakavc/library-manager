const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/librarians');
const auth = require('../middleware/auth');

router.post('/admin', adminCtrl.addUser);
router.post('/admin/login', adminCtrl.loginUser);
router.post('/admin/logout', auth, adminCtrl.logoutUser);
router.post('/admin/logoutAll', auth, adminCtrl.logoutAll);
router.get('/admin', auth, adminCtrl.getUser);
router.patch('/admin', auth, adminCtrl.updateUser);
router.delete('/admin', auth, adminCtrl.deleteUser);
router.post('/book', auth, adminCtrl.addBook);
router.patch('/book/:id', auth, adminCtrl.updateBook);
router.get('/books', adminCtrl.getBooks);
router.delete('/book/:id', auth, adminCtrl.deleteBook);
router.get('/book/:id', auth, adminCtrl.bookHistory);

module.exports = router;
