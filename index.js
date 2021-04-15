const express = require('express')
const app = express()
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;

require('dotenv').config()

const port = process.env.PORT || 7000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2gxdt.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

app.use(express.json());
app.use(cors());
app.use(express.static('doctors'));
app.use(fileUpload())

app.get('/', (req, res) => {
    res.send('Hello World!')
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    console.log('database connected successfully');
    const appointmentCollection = client.db("doctorsDB").collection("appointments");
    const doctorCollection = client.db("doctorsDB").collection("doctors");

    // add appointment
    app.post('/addAppointment', (req, res) => {
        const appointment = req.body;
        console.log('app', appointment);
        appointmentCollection.insertOne(appointment)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    // show appointments by date

    app.post('/appointmentByDate', (req, res) => {
        const data = req.body;
        const email = req.body.email;
        console.log('date', data.date);
        console.log(email);
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {

                const filter = { date: data.date }
                if (doctors.length === 0) {
                    filter.email = email
                }
                appointmentCollection.find(filter)
                    .toArray((err, documents) => {
                        res.send(documents)
                    })
            })
    })

    // all patients appointments
    app.get('/appointments', (req, res) => {
        appointmentCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

    // for file uploadd
    app.post('/addADoctor', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        // const filePath =`${__dirname}/doctors/${file.name}`
        // file.mv(filePath, err => {
        //     if (err) {
        //         console.log(err);
        //         return res.status(500).send({ msg: 'Failed to Upload Image' });
        //     }
        // const newImg = fs.readFileSync(filePath);
        const newImg = req.files.file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: req.files.file.mimetype,
            size: req.files.file.size,
            img: Buffer.from(encImg, 'base64')
        };
        doctorCollection.insertOne({ name, email, image })
            .then(result => {
                // fs.remove(filePath, error => {
                //     if(error){
                //         console.log(error);
                //         res.status(500).send({ msg: 'Failed to Upload Image' });
                //     }
                res.send(result.insertedCount > 0)
                // })

            })
        // return res.send({name: file.name, path: `/${file.name}`})
        // })
    })

    // is doctor or not
    app.post('/isDoctor', (req, res) => {
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                res.send(doctors.length > 0)
            })
    })

    // show doctor

    app.get('/doctor', (req, res) => {
        doctorCollection.find({})
            .toArray((err, documents) => {
                console.log(documents);
                res.send(documents)
            })
    })

    // // for file uploadd
    // app.post('/addADoctor', (req, res) => {
    //     const file = req.files.file;
    //     const name = req.body.name;
    //     const email = req.body.email;
    //     console.log(name, email, file);
    //     file.mv(`${__dirname}/doctors/${file.name}`, err => {
    //         if (err) {
    //             console.log(err);
    //             return res.status(500).send({ msg: 'Failed to Upload Image' });
    //         }
    //         doctorCollection.insertOne({ name, email, img: file.name })
    //             .then(result => {
    //                 res.send(result.insertedCount > 0)
    //             })
    //         // return res.send({name: file.name, path: `/${file.name}`})
    //     })
    // })

});

app.listen(port)