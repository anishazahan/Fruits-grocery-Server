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

function verifytoken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}



async function run(){

  try{

    // await client.connect();
    // const productsCollection=client.db("fruits-warehouse").collection('product');
    

    // app.get('/product',async (req,res) =>{

    //   const query = {};
    //     const cursor = productsCollection.find(query);
    //     const products =await cursor.toArray();
    //     res.send(products);
        
    // })

    await client.connect();
    const productCollection = client.db('fruits-warehouse').collection('product');
    const orderCollection = client.db('fruits-warehouse').collection('order');
    const userCollection = client.db('fruits-warehouse').collection('user');
    // const doctorCollection = client.db('doctors_portal').collection('doctors');
    // const paymentCollection = client.db('doctors_portal').collection('payments');

    

    // app.post('/create-payment-intent',verifytoken, async(req, res) =>{
    //   const service = req.body;
    //   const price = service.price;
    //   const amount = price*100;
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount : amount,
    //     currency: 'usd',
    //     payment_method_types:['card']
    //   });
    //   res.send({clientSecret: paymentIntent.client_secret})
    // });

    app.get('/product', async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
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



