module.exports = (sequelize, DataTypes) => {
    const userBook = sequelize.define('userbook' , {
        userId : {
            type : DataTypes.INTEGER,
        },
        bookId : {
            type : DataTypes.INTEGER
        }
    })
    return userBook
}