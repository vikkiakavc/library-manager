const db = require('../db/index')
const Librarians = db.librarians
const Books = db.books
const Users = db.users

// console.log('I am here')
// register a new Admin
const addUser = async (req, res) => {
    try {
        const user = await Librarians.create(req.body)
        const token = await user.generateAuthToken()
        console.log('data saved')
        res.status(201).send({ user, token });
    } catch (e) {
        console.log(e)
        res.status(500).send({ error: 'Internal server error!' })
    }
}

// login admin
const loginUser = async (req, res) => {
    try {
        const user = await Librarians.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({ user, token })

    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
}

// logout admin
const logoutUser = async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(401).send({ error: 'Please authenticate as a admin!' })
        }
        const user = req.admin
        const updatedTokens = user.getDataValue('tokens').filter((token) => {
            return token.token !== req.token
        })

        await Librarians.update({ tokens: updatedTokens }, { where: { id: user.id } })
        res.send();

    } catch (e) {
        console.log(e)
        res.status(500).send();
    }
}

// logout admin from all devices
const logoutAll = async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(401).send({ error: 'Please authenticate as a admin!' })
        }
        const user = req.admin
        const updatedTokens = []
        await Librarians.update({ tokens: updatedTokens }, { where: { id: user.id } })
        res.send()
    } catch (e) {
        console.log(e)
        res.status(500).send();
    }
}

// get admin profile
const getUser = async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(401).send({ error: 'Please authenticate as a admin!' })
        }
        // const user = await Librarians.findOne({ where: { id: req.admin.id } })
        res.status(200).send({ admin:  req.admin});
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// update admin
const updateUser = async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(401).send({ error: 'Please authenticate as a admin!' })
        }
        const updates = Object.keys(req.body);
        const allowedUpdates = ['username', 'email', 'password', 'gender']
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
        if (!isValidOperation) {
            return res.status(400).json({ error: 'Invalid updates!' });
        }
        const user = await Librarians.findOne({ where: { id: req.admin.id } })
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        res.status(200).send(user)
    } catch (e) {
        console.log(e)
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// delete admin
const deleteUser = async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(401).send({ error: 'Please authenticate as a admin!' })
        }
        const admin = req.admin
        await req.admin.destroy()
        res.status(204).send({ deletedAdmin: admin });
    } catch (e) {
        console.log(e)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// add a new book
const addBook = async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(401).send({ error: 'Please authenticate as a admin!' })
        }
        const book = await Books.create(req.body)
        res.status(201).send({ book })
    } catch (e) {
        console.log(e)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// update a book
const updateBook = async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(401).send({ error: 'Please authenticate as a admin!' })
        }
        const updates = Object.keys(req.body);
        const allowedUpdates = ['title', 'author', 'genre', 'price', 'totalCopies']
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
        if (!isValidOperation) {
            return res.status(400).json({ error: 'Invalid updates!' });
        }
        const book = await Books.findOne({ where: { id: req.params.id } })
        updates.forEach((update) => book[update] = req.body[update])
        await book.save()
        res.status(200).send(book)
    } catch (e) {
        console.log(e)
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// get books
const getBooks = async (req, res) => {
    try {
        const books = await Books.findAll();
        res.send(books)
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// Delete a book
const deleteBook = async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(401).send({ error: 'Please authenticate as a admin!' })
        }
        const book = await Books.findByPk(req.params.id);

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Go to book history
        const bookHistory = book.getDataValue('history');

        // Iterate on all users in the history
        for (const uId of bookHistory) {
            const user = await Users.findByPk(uId);

            if (user) {
                const userHistory = user.getDataValue('history');

                // Delete the book from the history of those users
                const updatedUserHistory = userHistory.filter((bId) => bId !== req.params.id);

                // Update the user history
                await Users.update({ history: updatedUserHistory }, { where: { id: uId } });
            }
        }

        await book.destroy();
        res.status(200).json({ deletedBook: book });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// history of books 
const bookHistory = async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(401).send({ error: 'Please authenticate as a admin!' })
        }
        const book = await Books.findByPk(req.params.id)
        const history = await book.getDataValue('history')
        const response = []
        for (const uId of history) {
            const user = await Users.findByPk(uId)
            response.push(user)
        }
        res.send({ bookHistory: response })
    } catch (e) {
        console.error(e);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}


module.exports = {
    addUser,
    loginUser,
    logoutUser,
    logoutAll,
    getUser,
    updateUser,
    deleteUser,
    addBook,
    updateBook,
    getBooks,
    deleteBook,
    bookHistory
}