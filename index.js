const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

// f

//middle war

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use(fileUpload());

// mongoDb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.icikx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// main
async function run() {
  try {
    await client.connect();
    const database = client.db("group_info");
    const userPostCollection = database.collection("userPost");
    const usersCollection = database.collection("user");
    const groupCollection = database.collection("group");
    app.get("/test", async (req, res) => {
      res.json({ s: "hi", env: process.env });
    });
    app.get("/:email/myPost", async (req, res) => {
      console.log(req.body, req.params);
      console.log("hit");
      const email = req?.params?.email;
      const query = { "client.email": email };
      console.log(query);
      const result = await userPostCollection.find(query).toArray();
      console.log(result);
      res.json(result);
    });
    app.get("/:email/loved", async (req, res) => {
      console.log("hit love");
      const email = req?.params?.email;
      const query = {
        loves: email,
      };
      console.log(query);
      const result = await userPostCollection.find(query).toArray();
      console.log(result);
      res.json(result);
    });
    app.get("/userPost", async (req, res) => {
      const postPath = req?.query;
      console.log("type of post", postPath);
      const skip = parseInt(postPath.skip);
      const query = {
        postIn: "/" + postPath.gpId + "/" + postPath.postIn,
      };
      console.log(query);
      const cursor = await userPostCollection.find(query);
      const outPut = await cursor
        .sort({ _id: -1 })
        .skip(skip)
        .limit(7)
        .toArray();
      res.json(outPut);
    });
    app.post("/userPost", async (req, res) => {
      const data = req.body;
      const pic = req?.files?.pic;
      data.client = JSON.parse(data.client);
      const picData = pic?.data;
      console.log(pic);
      data.loves = [];
      data.comments = [];
      console.log(data);
      if (picData) {
        const encodedPic = picData.toString("base64");
        const imageBuffer = Buffer.from(encodedPic, "base64");
        data.pic = imageBuffer.toString("base64");
      } else {
        delete data.pic;
      }
      const result = await userPostCollection.insertOne(data);
      res.json(data);
      console.log("post the data");
    });
    app.post("/convertImg", async (req, res) => {
      const pic = req?.files?.pic;
      const picData = pic?.data;
      console.log(pic);
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      const mainImgString = imageBuffer.toString("base64");

      console.log("hghghghghghg", mainImgString);
      res.json(mainImgString);
      console.log("post the data");
    });
    app.put("/userPost/love", async (req, res) => {
      console.log("hit", req.body);
      const email = req.body.email;
      const _id = req.body._id;
      const filter = { _id: ObjectId(_id) };
      const updateDoc = {
        $push: { loves: email },
      };
      const result = await userPostCollection.updateOne(filter, updateDoc);
      console.log("update done");
      res.json(result);
    });
    app.delete("/userPost/love", async (req, res) => {
      console.log("delete", req.body);
      const email = req.body.email;
      console.log(email);
      const _id = req.body._id;
      const filter = { _id: ObjectId(_id) };
      const updateDoc = {
        $pull: { loves: email },
      };
      const result = await userPostCollection.updateOne(filter, updateDoc);
      console.log("update done");
      res.json(result);
    });
    app.delete("/userPost/:id", async (req, res) => {
      console.log("post dele", req.body);
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userPostCollection.deleteOne(query);
      res.json(req.body);
    });
    app.put("/userPost/comment", async (req, res) => {
      const data = req.body;
      const _id = data.postId;
      const pic = req?.files?.pic;
      data.client = JSON.parse(data.client);
      const picData = pic?.data;
      console.log(pic, picData);
      console.log(data);
      if (picData) {
        const encodedPic = picData.toString("base64");
        const imageBuffer = Buffer.from(encodedPic, "base64");
        data.pic = imageBuffer.toString("base64");
      } else {
        delete data.pic;
        console.log("hghghghghghg");
      }
      const filter = { _id: ObjectId(_id) };
      console.log(filter);
      const options = { upsert: true };
      const updateDoc = {
        $push: { comments: data },
      };
      const result = await userPostCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log("update done", data);
      res.json(data);
    });
    app.put("/userPost/deleteComment", async (req, res) => {
      const data = req.body;
      console.log(data.data, "delete comment ");
      const filter = { _id: ObjectId(data.data.postId) };
      const updateDoc = {
        $pull: { comments: { time: data.data.time } },
      };
      console.log(filter);
      const result = await userPostCollection.updateOne(filter, updateDoc);
      res.json(data);
    });
    app.put("/user", async (req, res) => {
      const user = req.body;
      console.log("put user", user);
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
      console.log(result);
    });
    app.post("/user", async (req, res) => {
      const user = req.body;
      console.log("post user");
      const result = await usersCollection.insertOne(user);
      res.json(result);
      console.log(result);
    });
    //make admin
    app.put("/user/makeAdmin", async (req, res) => {
      console.log("user put");
      const email = req?.body?.email;
      console.log(email);
      const filter = { email };
      const options = { upsert: true };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });
    //  all about  groups
    app.post("/createGroup", async (req, res) => {
      console.log(req.body);
      const data = req.body;
      const result = await groupCollection.insertOne(data);
      res.json(result);
    });
    app.delete("/deleteGroup/:gpId", async (req, res) => {
      console.log(req.params?.gpId, "delete gropup");
      const _id = req.params?.gpId;
      const query = { _id: ObjectId(_id) };
      const result = await groupCollection.deleteOne(query);
      const help = {
        postIn: "/" + _id + "/help",
      };
      const announcement = {
        postIn: "/" + _id + "/announcement",
      };
      const discussion = {
        postIn: "/" + _id + "/discussion",
      };
      const deleteHelp = await userPostCollection.deleteMany(help);
      const deleteAnnounce = await userPostCollection.deleteMany(announcement);
      const deleteDiscuss = await userPostCollection.deleteMany(discussion);
      console.log(result, deleteHelp, deleteAnnounce, deleteDiscuss);
      res.json({ _id });
    });
    app.get("/allGroup", async (req, res) => {
      const result = await groupCollection.find({}).toArray();

      res.json(result);
    });
    app.get("/group/:id", async (req, res) => {
      const _id = req.params.id;
      console.log(_id);
      const query = { _id: ObjectId(_id) };
      const result = await groupCollection.findOne(query);
      console.log(result);
      res.json(result);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      console.log(user);
      res.json({ admin: isAdmin });
    });
    app.get("/userInfo/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email };
      const users = await usersCollection.findOne(query);
      res.json(users);
    });
    app.put("/addUserToGroup", async (req, res) => {
      const data = req.body;
      console.log(data);
      const filter = { _id: ObjectId(data.gpId) };
      const doc = { $push: { members: data?.user } };
      const options = { upsert: true };
      const result = await groupCollection.updateOne(filter, doc, options);
      console.log(result);
      res.json(data);
    });
    app.put("/removeUserFromGroup", async (req, res) => {
      const data = req.body;
      console.log(data);
      const filter = { _id: ObjectId(data.gpId) };
      const doc = { $pull: { members: data.user } };
      const options = { upsert: true };
      const result = await groupCollection.updateOne(filter, doc, options);
      console.log(result);
      res.json(data);
    });
    app.put("/makeGroupAdmin", async (req, res) => {
      const data = req.body;
      console.log(data);
      const filter = { _id: ObjectId(data.gpId) };
      const doc = { $push: { admin: data?.user } };
      const options = { upsert: true };
      const result = await groupCollection.updateOne(filter, doc, options);
      console.log(result);
      res.json(data);
    });
    app.put("/removeAdminOfGroup", async (req, res) => {
      const data = req.body;
      console.log(data);
      const filter = { _id: ObjectId(data.gpId) };
      const doc = { $pull: { admin: data.user } };
      const options = { upsert: true };
      const result = await groupCollection.updateOne(filter, doc, options);
      console.log(result);
      res.json(data);
    });
    app.put("/sendRequest", async (req, res) => {
      const data = req.body;
      console.log(data);
      const filter = { _id: ObjectId(data.gpId) };
      const doc = { $push: { memberRequest: data?.user } };
      const options = { upsert: true };
      const result = await groupCollection.updateOne(filter, doc, options);
      console.log(result);
      res.json(data);
    });
    app.put("/cancelRequest", async (req, res) => {
      const data = req.body;
      console.log(data);
      const filter = { _id: ObjectId(data.gpId) };
      const doc = { $pull: { memberRequest: data?.user } };
      const options = { upsert: true };
      const result = await groupCollection.updateOne(filter, doc, options);
      console.log(result);
      res.json(data);
    });
    app.put("/acceptRequest", async (req, res) => {
      const data = req.body;
      console.log(data);
      const filter = { _id: ObjectId(data.gpId) };
      const doc = { $push: { members: data?.user } };
      const options = { upsert: true };
      const result = await groupCollection.updateOne(filter, doc, options);
      console.log(result);
      res.json(data);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// defaults
app.get("/", async (req, res) => {
  res.send(
    `const group server is runing${process.env.DB_USER}  hi ${process.env.DB_PASS}`
  );
});
app.listen(port, () => {
  console.log("server is running at port", port);
});
