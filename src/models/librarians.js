const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

module.exports = (sequelize, DataTypes) => {
    const Librarians = sequelize.define('librarians', {
        username: {
            type: DataTypes.STRING,
            allownull: false
        },

        email: {
            type: DataTypes.STRING,
            allownull: false,
            unique: true,
            validate: {
                isEmail: true
            },
            set(value) {
                this.setDataValue('email', value.toLowerCase())
            }
        },
        password: {
            type: DataTypes.STRING,
            allownull: false,
            validate: {
                isLongEnough(value) {
                    if (value.length < 9) {
                        throw new Error('set your password atleast 8 characters long!')
                    }
                },
                isYourPasswordpassword(value) {
                    if (value.toLowerCase() === 'password') {
                        throw new Error(`Your password must not be the word ${value}, yk it is easy to crack ;p`)
                    }
                }
            }
        },
        gender: {
            type: DataTypes.STRING,
            allownull: false,
            validate: {
                isIn: {
                    args: [['Male', 'Female']],
                    msg: 'Please select from your gender from Male or Female only'
                }
            }
        },
        tokens: {
            type: DataTypes.JSON,
            defaultValue: [],
            allownull: false
        }
    })

    // preHooks
    // changing username and password values before creating
    Librarians.beforeCreate(async (user, options) => {
        user.username = user.username.trim()
        user.password = await bcrypt.hash(user.password.trim(), 8)
    })

    // changing values before updating
    Librarians.beforeUpdate(async (user, options) => {
        if (user.changed('username')) {
            user.username = user.username.trim()
        }

        if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password.trim(), 8)
        }
    })

    // class method
    Librarians.findByCredentials = async function (email, password) {
        const user = await Librarians.findOne({ where: { email } })
        if (!user) {
            throw new Error('Unable to login!')
        }
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            throw new Error('Unable to login!')
        }
        return user
    }

    // Instance methods
    // generating auth token
    Librarians.prototype.generateAuthToken = async function () {
        const user = this

        const token = jwt.sign({ id: user.id, userType: 'Admin' }, process.env.JWT_SECRET)
        const existingTokens = user.getDataValue('tokens')

        existingTokens.push({ token })

        await Librarians.update(
            { tokens: existingTokens },
            { where: { id: user.id } }
        );
        return token
    }

    Librarians.prototype.toJSON = function () {
        const user = { ...this.get()}

        delete user.password
        delete user.tokens

        return user
    }

    return Librarians
}