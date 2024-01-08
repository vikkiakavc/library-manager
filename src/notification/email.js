const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SGMAIL_API);

const sendNotificationMail = (email, name, bookTitle) => {
    sgMail.send({
        from: 'vschaudhary2001@gmail.com',
        to: email,
        subject: 'Book Availability',
        text: `Dear ${name}, The book "${bookTitle}" is now available!`
    })
}

const sendDeletedMail = (email, name, bookTitle) => {
    sgMail.send({
        from: 'vschaudhary2001@gmail.com',
        to: email,
        subject: 'Book Availability',
        text: `Dear ${name}, The book "${bookTitle}" is removed from the library.`
    })
}

module.exports = {
    sendNotificationMail,
    sendDeletedMail
}
