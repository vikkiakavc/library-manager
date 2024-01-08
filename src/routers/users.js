const express = require('express')
const router = express.Router()
const userCtrl = require('../controllers/users')
const auth = require('../middleware/auth')


router.post('/users', userCtrl.addUser)

router.post('/users/login', userCtrl.loginUser)

router.post('/users/logout', auth, userCtrl.logoutUser)

router.post('/users/logoutAll', auth, userCtrl.logoutAll)

router.get('/users', auth, userCtrl.getUser)

router.patch('/users' , auth, userCtrl.updateUser)

router.delete('/users', auth, userCtrl.deleteUser)

router.post('/users/returnbook/:id', auth, userCtrl.returnBook)

router.post('/users/borrowbook/:id', auth, userCtrl.borrowBook)

router.get('/users/history', auth, userCtrl.userHistory)

module.exports = router