const express = require('express');
const bodyParser = require('body-parser');
const ObjectID = require('mongodb').ObjectID;
const cors = require('cors');
const fs = require('fs-extra');
//  const fileUpload = require('express-fileUpload');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('bson');
require('dotenv').config();


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vjh6y.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('services'));
app.use(fileUpload());

const port = 5001;



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookingCollection = client.db("dryvsclean").collection("usersclean");
    const bookCollection = client.db("dryvsclean").collection("services");
    const testimonialCollection = client.db("dryvsclean").collection("testimonial");
    const makeAdminCollection = client.db("dryvsclean").collection("admins");

    app.post('/addBooking', (req, res) => {
        const booking = req.body;
        // console.log(booking);
        bookingCollection.insertOne(booking)
            .then(result => {
                // console.log(result)
                res.send(result.insertedCount > 0)
            })
    })

    app.post('/bookings', (req, res) => {
        const email = req.body.email;
        bookCollection.find({ email: email })
            .toArray((err, admins) => {
                const filter = { email: email }
                if (admins.length === 0) {
                    filter.email = email;
                }
                bookingCollection.find(filter)
                    .toArray((err, documents) => {
                        res.send(documents);
                        console.log(documents)
                    })
            })


    })
    app.get('/orderList', (req, res) => {
        bookingCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.patch('/update/:id', (req, res) => {
        bookingCollection.updateOne({ _id: ObjectID(req.params.id)}, 
          {
              $set: {status: req.body.status},
          }
        )
        .then((result) => {
            console.log(result)
            res.send(result.modifiedCount > 0);
        })
    })
    // app.get('/checkAdmin', (req, res) => {
    //     const queryEmail = req.query.email
    //     console.log(queryEmail)
    //     adminEmails.find({ email: queryEmail })
    //       .toArray((err, documents) => {
    //         res.send(documents.length > 0)
    //       })
    //   })

    app.get('/service/:id', (req, res) => {
        const id = ObjectID(req.params.id)
        bookCollection.find({ _id: id })
            .toArray((err, events) => {
                res.send(events[0])
            })
    })


    app.get('/services', (req, res) => {
        bookCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });
    app.post('/addAService', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const price = req.body.price;
        const description = req.body.description;
        const filePath = `${__dirname}/services/${file.name}`

        file.mv(filePath, err => {
            if (err) {
                console.log(err);
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');

            var image = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size,
                img: Buffer(encImg, 'base64')
            };
            bookCollection.insertOne({ name, email, image, price, description })
                .then(result => {
                    fs.remove(filePath, error => {
                        if (error) {
                            console.log(error)
                            res.status(500).send({ msg: `Failed to upload Image` })
                        }
                        res.send(result.insertedCount > 0);
                    })



                })
        })

    })

    app.get('/testimonial', (req, res) => {
        testimonialCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    app.post('/addATestimonial', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const description = req.body.description;
        const filePath = `${__dirname}/testimonial/${file.name}`

        file.mv(filePath, err => {
            if (err) {
                console.log(err);
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');

            var image = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size,
                img: Buffer(encImg, 'base64')
            };
            testimonialCollection.insertOne({ name, email, image, description })
                .then(result => {
                    fs.remove(filePath, error => {
                        if (error) {
                            console.log(error)
                            res.status(500).send({ msg: `Failed to upload Image` })
                        }
                        res.send(result.insertedCount > 0);
                    })



                })
        })

    })

    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        makeAdminCollection.find({ email: email })
            .toArray((err, admins) => {
                res.send(admins.length > 0);
                    
            })


    })

    app.post('/AddMakeAdmin', (req, res) => {
        const admin = req.body;
        console.log(admin)
        makeAdminCollection.insertOne(admin)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })
    // app.get('/makeAdmin', (req, res) => {
        
    //     makeAdminCollection.find({ email:  req.params.email})
    //     console.log(email)
    //         .toArray((err, documents) => {
    //             res.send(documents);
    //         })
    // });

});



app.get('/', (req, res) => {
    res.send("Hello from db it's working working")
})

app.listen(process.env.PORT || port);