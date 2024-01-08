const db = require('../db/index')
const Users = db.users
const Books = db.books
const userBook = db.userbooks


// register a new user
const addUser = async (req, res) => {
    try {
        const user = await Users.create(req.body)
        const token = await user.generateAuthToken()
        console.log('data saved')
        res.status(201).send({ user, token });
    } catch (e) {
        console.log(e)
        res.status(500).send({ error: 'Internal server error!' })
    }
}

// login user
const loginUser = async (req, res) => {
    try {
        const user = await Users.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({ user, token })

    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
}

// logout user
const logoutUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send({ error: 'Please authenticate as a user!' })
        }
        const user = req.user
        console.log(user)
        const updatedTokens = user.getDataValue('tokens').filter((token) => {
            return token.token !== req.token
        })

        await Users.update({ tokens: updatedTokens }, { where: { id: user.id } })
        res.send();

    } catch (e) {
        console.log(e)
        res.status(500).send();
    }
}

// logout user from all devices
const logoutAll = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send({ error: 'Please authenticate as a user!' })
        }
        const user = req.user
        const updatedTokens = []
        await Users.update({ tokens: updatedTokens }, { where: { id: user.id } })
        res.send()
    } catch (e) {
        console.log(e)
        res.status(500).send();
    }
}

// get user profile
const getUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send({ error: 'Please authenticate as a user!' })
        }
        const user = await Users.findOne(
            {
                where: { id: req.user.id },
                include: [
                    { model: Books, as: 'books' },
                ]
            },
        )
        res.status(200).send({ user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// update user
const updateUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send({ error: 'Please authenticate as a user!' })
        }
        const updates = Object.keys(req.body);
        const allowedUpdates = ['username', 'email', 'password', 'gender']
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
        if (!isValidOperation) {
            return res.status(400).json({ error: 'Invalid updates!' });
        }
        const user = await Users.findOne({ where: { id: req.params.id } })
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        res.status(200).send(user)
    } catch (e) {
        console.log(e)
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// Delete user
const deleteUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send({ error: 'Please authenticate as a user!' })
        }
        // Go to user history
        const userHistory = req.user.getDataValue('history');

        // Iterate on all books in the history
        for (const bId of userHistory) {
            const book = await Books.findByPk(bId);

            if (book) {
                const bookHistory = book.getDataValue('history');

                // Delete the user from the history of those books
                const updatedBookHistory = bookHistory.filter((uId) => uId !== req.user.id);

                // Update the book history
                await Books.update({ history: updatedBookHistory }, { where: { id: bId } });
            }
        }

        // Delete the user
        await req.user.destroy();

        res.status(204).send({ deletedUser: req.user });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// Borrow book
const borrowBook = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send({ error: 'Please authenticate as a user!' })
        }
        const userId = req.user.id;
        const bookId = req.params.id;

        // Find the book in the Books table
        const book = await Books.findByPk(bookId);

        if (!book) {
            return res.status(404).json({ error: 'Book not found in the library' });
        }

        // check if the user has already borrowed the book, if yes, deny the user
        const preEntry = await userBook.findOne({ where : { bookId, userId}})
        if (preEntry){
            return res.status(404).json({ error: 'sorry to inform you that you can not borrow the same book again if you have already borrowed it' });
        }
        
        // if no copies of the book are available, notify the user whenever available
        const availableCopies = book.getDataValue('totalCopies')
        if (availableCopies === 0) {
            const updatedReservation = req.user.getDataValue('reservation');
            updatedReservation.push(bookId)
            await Users.update({ reservation: updatedReservation }, { where: { id: req.user.id } });
            return res.status(404).json({ error: 'Enough book copies are not available at the moment, You will be notified whenever the book is available' });
        }

        // Create entry in the userBook table
        const entry = await userBook.create({ userId, bookId });

        // Update the totalCopies for the book
        const copies = book.getDataValue('totalCopies');
        const updatedCopies = copies - 1;

        // Update the user history
        const userHistory = req.user.getDataValue('history');
        if (!userHistory.includes(bookId)){
            userHistory.push(bookId);
            await Users.update({ history: userHistory }, { where: { id: req.user.id } });
        }
        // update user reservatin if the book is in the reservation
        const reservatin = req.user.getDataValue('reservation')
        if (reservatin.includes(bookId)) {
            console.log('---------------')
            console.log(reservatin)
            updatedReservation = reservatin.filter((bId) => {
                return bId !== bookId
            })
            console.log(updatedReservation)
            console.log('---------------')
            await Users.update({ reservation: updatedReservation }, { where: { id: req.user.id } });
        }

        // update the book history
        const bookHistory = book.getDataValue('history');
        if (!bookHistory.includes(userId)){
            bookHistory.push(userId);
        }
        await Books.update({ totalCopies: updatedCopies, history: bookHistory }, { where: { id: bookId } });

        res.send({ book, message: 'Book borrowed successfully!' });
    } catch (e) {
        console.error(e);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};



// return book
const returnBook = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send({ error: 'Please authenticate as a user!' })
        }
        const userId = req.user.id;
        const bookId = req.params.id;

        // Find the book in the Books table
        const book = await Books.findByPk(bookId);
        if (!book) {
            return res.status(404).send({ error: 'Book not found in the library' });
        }

        // Find the entry in the userBook table
        const entry = await userBook.findOne({ where: { userId, bookId } });

        if (!entry) {
            return res.status(404).send({ error: 'Book not found in user\'s borrowed list' });
        }

        // Delete the entry in the userBook table
        await entry.destroy();

        // Update the totalCopies for the book
        const copies = book.getDataValue('totalCopies');
        const updatedCopies = copies + 1;
        await Books.update({ totalCopies: updatedCopies }, { where: { id: bookId } });

        res.send({ book, message: 'Book returned successfully!' });
    } catch (e) {
        console.error(e);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

// history of users 
const userHistory = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send({ error: 'Please authenticate as a user!' })
        }
        const history = await req.user.getDataValue('history')
        const response = []
        for (const bId of history) {
            const book = await Books.findByPk(bId)
            response.push(book)
        }
        res.send({ userHistory: response })
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
    borrowBook,
    returnBook,
    userHistory
}