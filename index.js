const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9ca3bxa.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const userCollection = client.db("PetDb").collection("users")
    const petCollection = client.db("PetDb").collection("pet")
    const reqCollection = client.db("petBd").collection("petRequest")


    // user api
    app.post('/users', async(req,res) => {
      const user =req.body;

      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'user exist' , insertedId : null})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);

      
    })

    app.get('/pet', async(req,res) => {
        const result = await petCollection.find().toArray()
        res.send(result);
    })

    // pet Request
    app.get('/petRequest', async (req,res) => {
      console.log(req.query);
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await reqCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/petRequest', async (req,res) => {
      const request = req.body;
      console.log(request);
      const result = await reqCollection.insertOne(request);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res) => {
    res.send('backend Server is Running')
})

app.listen(port, () => {
    console.log(`Pet Adoption Is Running On Port ${port}`);
})
