const SMTPServer = require("smtp-server").SMTPServer
const parser = require("mailparser").simpleParser
const nodemailer = require('nodemailer')

const server = new SMTPServer({
    onRcptTo(address, session, callback) {
        if (!address.address.endsWith('calipsa.io')) {
            console.log("Invalid sender address so we rejected it. It must end in calipsa.io.")
            console.log(`The address given was: "${address.address}"`)
            return callback(
                new Error("Recipient error, goodbye!")
            )
        }
        return callback()
    },
    onData(stream, session, callback) {
        parser(stream, {}, (err, parsed) => {
            if (err)
                console.log("Error:", err)

            console.log("::: Email Received :::: \n")
            console.log(parsed)

            const emailFromAddress = parsed.from.text
            const emailToAddress = parsed.to.text
            const emailSubject = parsed.subject
            const emailText = parsed.text
            const emailAttachments = parsed.attachments

            // Do the calipsa magic
            for (const attachment of emailAttachments) {
                attachment.contentType = 'image/jpeg'
            }

            const transport = nodemailer.createTransport({
                host: "smtp.calipsa.io",
                port: 25,
                secure: false,
                tls: {
                    ignoreTLS: true,
                    rejectUnauthorized: false
                },
                debug: true
            })

            const mailOptions = {
                from: emailFromAddress,
                to: emailToAddress,
                subject: emailSubject,
                text: emailText,
                attachments: emailAttachments
            }

            transport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error)
                }
                console.log('Message sent: %s', info.messageId)
            })

            stream.on("end", callback)
        })
    },
    disabledCommands: ['AUTH']
})

server.listen(25)
console.log("::: Server Started :::")