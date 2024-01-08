const cron = require('node-cron');
const db = require('../db/index')
const Books = db.books
const Users = db.users
const { sendNotificationMail, sendDeletedMail } = require('./email');

// Schedule a task to run every day at a specific time
const job = cron.schedule('0 12 * * *', async () => {
    try {
        // Find users who have atleast one reservation
        const usersToNotify = await Users.findAll({
            where: sequelize.literal('JSON_LENGTH(reservation) > 0'),
        });

        // Iterate through users and notify them
        for (const user of usersToNotify) {
            const reservedBooks = user.getDataValue('reservation');

            // Iterate through all the books
            for (const bookId of reservedBooks) {
                const book = await Books.findByPk(bookId);

                // check if the book is available in the library
                if (!book) {
                    // remove the book as a reservation in the user's reservation list
                    const updatedReservation = user.getDataValue('reservation').filter((id) => {
                        return id !== bookId
                    })
                    await Users.update({ reservation: updatedReservation }, { where: { id: user.id } })
                    // notify user that the book is deleted from the library
                    const email = user.getDataValue('email')
                    const name = user.getDataValue('name')
                    const title = book.getDataValue('title')
                    sendDeletedMail(email, name, title);
                    
                } else if (book.getDataValue('totalCopies').length > 0) {
                    const email = user.getDataValue('email')
                    const name = user.getDataValue('name')
                    const title = book.getDataValue('title')
                    sendNotificationMail(email, name, title);

                    // remove the book as a reservation in the user's reservation list
                    const updatedReservation = user.getDataValue('reservation').filter((id) => {
                        return id !== bookId
                    })
                    await Users.update({ reservation: updatedReservation }, { where: { id: user.id } })
                }
            }
        }
    } catch (error) {
        console.error('Error in notification task:', error);
    }
});

job.start()