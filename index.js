const express = require('express')
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

//middle war

app.use(cors())
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(fileUpload());

// mongoDb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.icikx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// main

async function run() {
    try {
        await client.connect();
        const database = client.db("group_info");
        const userPostCollection = database.collection("userPost");
        const usersCollection = database.collection("user");
        app.get('/:email/myPost', async (req, res) => {
            console.log(req.body, req.params)
            console.log('hit');
            const email = req?.params?.email;
            const query = { 'client.email': email }
            console.log(query);
            const result = await userPostCollection.find(query).toArray();
            console.log(result);
            res.json(result)

        })
        app.get('/:email/loved', async (req, res) => {
            console.log('hit love');
            const email = req?.params?.email;
            const query = {
                loves: email
            }
            console.log(query);
            const result = await userPostCollection.find(query).toArray();
            console.log(result);
            res.json(result)

        })
        app.get('/userPost/:postName', async (req, res) => {
            const postName = req.params.postName;
            console.log('type of post', postName);
            const query = {
                postIn: '/' + postName
            }
            console.log(query);
            const outPut = await userPostCollection.find(query).toArray();
            const result = await outPut.reverse()
            console.log('get from db');
            res.json(result);
        })
        app.post('/userPost', async (req, res) => {
            const data = req.body;
            const pic = req?.files?.pic;
            data.client = JSON.parse(data.client);
            const picData = pic?.data;
            data.loves = [];
            data.comments = [];
            console.log(data);
            if (picData) {
                const encodedPic = picData.toString('base64');
                const imageBuffer = Buffer.from(encodedPic, 'base64');
                data.pic = imageBuffer.toString('base64');
            }
            else {
                delete data.pic
                console.log('hghghghghghg');
            }
            const result = await userPostCollection.insertOne(data);
            res.json(result);
            console.log('post the data');
        })
        app.put('/userPost/love', async (req, res) => {
            console.log("hit", req.body);
            const email = req.body.email;
            const _id = req.body._id;
            const filter = { _id: ObjectId(_id) }
            const updateDoc = {
                $push: { loves: email }
            }
            const result = await userPostCollection.updateOne(filter, updateDoc)
            console.log('update done');
            res.json(result);
        })
        app.delete('/userPost/love', async (req, res) => {
            console.log("delete", req.body);
            const email = req.body.email;
            console.log(email);
            const _id = req.body._id;
            const filter = { _id: ObjectId(_id) }
            const updateDoc = {
                $pull: { loves: email }
            }
            const result = await userPostCollection.updateOne(filter, updateDoc)
            console.log('update done');
            res.json(result);
        })
        app.delete('/userPost/:id', async (req, res) => {
            console.log('post dele', req.body);
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await userPostCollection.deleteOne(query);
            res.json(req.body)
        })
        app.put('/userPost/comment', async (req, res) => {
            const data = req.body;
            const _id = data.postId;
            const pic = req?.files?.pic;
            data.client = JSON.parse(data.client);
            const picData = pic?.data;
            console.log(pic, picData);
            console.log(data);
            if (picData) {
                const encodedPic = picData.toString('base64');
                const imageBuffer = Buffer.from(encodedPic, 'base64');
                data.pic = imageBuffer.toString('base64');
            }
            else {
                delete data.pic
                console.log('hghghghghghg');
            }
            const filter = { _id: ObjectId(_id) }
            console.log(filter);
            const options = { upsert: true };
            const updateDoc = {
                $push: { comments: data }
            }
            const result = await userPostCollection.updateOne(filter, updateDoc, options)
            console.log('update done', data);
            res.json(data);
        })
        app.put('/userPost/deleteComment', async (req, res) => {
            const data = req.body;
            console.log(data.data, 'delete comment ');
            const filter = { _id: ObjectId(data.data.postId) }
            const updateDoc = {
                $pull: { comments: { time: data.data.time } }
            }
            console.log(filter);
            const result = await userPostCollection.updateOne(filter, updateDoc);
            console.log(result);
            res.json(data)
        })
        app.post('/user', async (req, res) => {
            const user = req.body;
            console.log('post user');
            const result = await usersCollection.insertOne(user);
            res.json(result);
            console.log(result);
        });
        //make admin
        app.put('/user/makeAdmin', async (req, res) => {
            console.log('user put');
            const email = req?.body?.email
            console.log(email);
            const filter = { email };
            const options = { upsert: true }
            const updateDoc = { $set: { role: 'admin' } }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
        })

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


// default 
app.get('/', async (req, res) => {
    res.send('const group server is runing  ');
})
app.listen(port, () => {
    console.log('server is running at port', port);
})