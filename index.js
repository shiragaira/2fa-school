const express = require('express')
const bodyParser = require('body-parser')
const { JsonDB } = require('node-json-db')
const { Config } = require('node-json-db/dist/lib/JsonDBConfig')
const uuid = require('uuid')
const speakease = require('speakeasy')

const app = express()

const dbConfig = new Config('myDatabase', true, true, '/')
const db = new JsonDB(dbConfig)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/api', (req, res) => {
    res.json({ message: "Welcome to the two factor authentication example!" })
})

app.post('/api/register', (req, res) => {
    const id = uuid.v4()
    const username = "test_username";
    const password = "test_password";

    try {
        const path = `/user/${id}`

        const temp_secret = speakease.generateSecret()

        db.push(path, { id, temp_secret, username, password });;

        res.json({ id, secret: temp_secret.base32 })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something went wrong!" })
    }
})

app.post('/api/verify', (req, res) => {
    const { userId, token } = req.body
    console.log(req.body)
    try {
        const path = `/user/${userId}`
        const user = db.getData(path);

        const { base32: secret } = user.temp_secret;
        const verified = speakease.totp.verify({
            secret, encoding: 'base32', token
        })

        if (verified) {
            db.push(path, { id: userId, secret: user.temp_secret });
            res.json({ verified: true })
        } else {
            res.json({ verified: false })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong!" })
    }
})

app.post('/api/validate', (req, res) => {
    const { userId, token } = req.body;
    try {
        const path = `/user/${userId}`
        const user = db.getData(path)

        const { base32: secret } = user.secret;

        const tokenValidate = speakease.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 1
        })

        if (tokenValidate) {
            res.json({ validated: true })
        } else {
            res.json({ validated: false })
        }
    } catch (error) {
        console.log(error),
            res.status(500).json({ message: "Something went wrong!" })
    }
})

const port = 5000;
app.listen(port, () => {
    console.log(`App is running on localhost:${port}`)
})