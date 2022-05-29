const express = require('express')
const app = express()
const cors = require('cors');
require ("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.3r9vc.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyToken(token) {
  let email;
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      email = "Invalid email";
    }
    if (decoded) {
      email = decoded;
    }
  });
  return email;
}




async function run(){

  try{

   

    await client.connect();
    const productCollection = client.db('fruits-warehouse').collection('product');
    const orderCollection = client.db('fruits-warehouse').collection('order');
    const userCollection = client.db('fruits-warehouse').collection('user');
    
    app.get("/product", async (req, res) => {
 
      let query;
      if (req.query.email) {
        const tokenInfo = req.headers.authorization;
        const decoded = verifytoken(tokenInfo);
        const email = req.query.email;
 
        if (email === decoded.email) {
          query = { email };
          const result = await productCollection.find(query).toArray();
          res.send(result);
        } else {
          res.send({ message: "Unauthorized Access" });
        }
 
      } else {
        query = {};
        const result = await productCollection.find(query).toArray();
        res.send(result);
      }
 
    });



    app.get('/product/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const products = await productCollection.findOne(query);
      res.send(products);
    })

    app.put("/product/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
     
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateQuantity = {
        $set: {
          quantity: data.newQuantity,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updateQuantity,
        options
      );
      res.send(result);
    });

    app.post("/product", async (req, res) => {
      const product = req.body;

      const result = await productCollection.insertOne(product);
      res.send(result);
    });
    app.delete("/product/:id", async(req, res) => {
      const { id } = req.params;
     console.log(req.params);
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        res.send({message: 'successfully deleted'});
      } else {
        res.send({message: 'No documents matched the query'});
      }
    });

    app.post("/login", (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_SECRET_TOKEN);
      res.send({ token });
    });
 




  }finally{



  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})



