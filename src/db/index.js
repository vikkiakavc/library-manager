const {Sequelize, DataTypes} = require('sequelize')

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

sequelize.authenticate().then(() => {
    console.log('Connected')
}).catch((err) => {
    console.log(err)
})

const db = {}
db.sequelize = sequelize;
db.Sequelize = Sequelize

db.librarians = require('../models/librarians')(sequelize, DataTypes)
db.users = require('../models/users')(sequelize, DataTypes)
db.books = require('../models/books')(sequelize, DataTypes)
db.userbooks = require('../models/userBook')(sequelize, DataTypes)

// many to many between users and books
db.users.belongsToMany(db.books , { through : 'userbook', foreignKey : 'userId', onDelete: 'CASCADE'})
db.books.belongsToMany(db.users , { through : 'userbook', foreignKey : 'bookId', onDelete: 'CASCADE'})

db.sequelize.sync({ force: false }).then(() => {
    console.log(' yes re-sync')
})

module.exports = db