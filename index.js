const express = require('express');
const app = express();
const cors = require('cors');
var jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // await client.connect();


    const userCollection = client.db("PetDb").collection("users")
    const petCollection = client.db("PetDb").collection("pet")
    const addedPetsCollection = client.db("PetDb").collection("addedPets")
    const reqCollection = client.db("petBd").collection("petRequest")


    // jwt api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    // verify
    const tokenVerify = (req,res,next) => {
      console.log('inside verify', req.headers.authorization);
      if (!req.headers.authorization){
        return res.status(401).send({ message: 'Access Unavailable' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }
     // verify admin after tokenVerify
     const adminVerify = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }


    // user api
    app.get('/users',tokenVerify,  async(req,res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    });

    app.get('/users/admin/:email', tokenVerify, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden Access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })


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
    // make admin
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.get('/pet', async(req,res) => {
        const result = await petCollection.find().toArray()
        res.send(result);
    })
    app.post('/addedPets', async (req,res) => {
      const pets = req.body;
      const result = await addedPetsCollection.insertOne(pets);
      res.send(result)
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

  // update
    app.patch('/petRequest/:id', async (req,res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId (id)}
      const acceptReq = req.body;
      console.log(acceptReq);
      const updateDoc = {
        $set: {
          status: acceptReq.status
        },
      };

      const result = await reqCollection.updateOne(filter, updateDoc);
      res.send(result)

    });


    // req delete
    app.delete('/petRequest/:id', async (req,res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId (id)}
      const result = await reqCollection.deleteOne(query)
      res.send(result);
    });


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
