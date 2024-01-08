const express = require('express')
require('./db/index')
require('../src/notification/notification.js')

const app = express()
const port = process.env.PORT

const adminRouter = require('./routers/librarians.js')
const userRouter = require('./routers/users.js')

app.use(express.json());
app.use(adminRouter)
app.use(userRouter)

app.get('/', (req, res) => {
    res.send('Hiiiiiiiiiiii')
})

app.listen(port, () => {
    console.log(`server is up and running on ${port}`)
})