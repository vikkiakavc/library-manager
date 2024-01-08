module.exports = (sequelize, DataTypes) => {
    const Books = sequelize.define('books', {
        title : {
            type : DataTypes.STRING,
            allownull : false,
        },
        author : {
            type : DataTypes.STRING,
            allownull : false
        },
        genre : {
            type : DataTypes.STRING,
            allownull: false
        },
        price : {
            type : DataTypes.INTEGER,
            allownull : false
        },
        totalCopies : {
            type : DataTypes.INTEGER,
            allownull : false
        },
        history : {
            type : DataTypes.JSON,
            defaultValue : []
        }
    })

    Books.beforeCreate (async (book, options) => {
        book.title = book.title.toLowerCase()
        book.author = book.author.toLowerCase()
        book.genre = book.genre.toLowerCase()
    })

    return Books
}