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


    app.get('/user', verifytoken, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });



   


    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });
    });

    
   

    app.get('/booking',verifytoken, async (req, res) => {
      const patient = req.query.patient;
      const decodedEmail = req.decoded.email;
      if (patient === decodedEmail) {
        const query = { patient: patient };
        const bookings = await bookingCollection.find(query).toArray();
        return res.send(bookings);
      }
      else {
        return res.status(403).send({ message: 'forbidden access' });
      }
    });

   

    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists })
      }
      const result = await bookingCollection.insertOne(booking);
      console.log('sending email');
      sendAppointmentEmail(booking);
      return res.send({ success: true, result });
    });

    app.patch('/booking/:id',verifytoken, async(req, res) =>{
      const id  = req.params.id;
      const payment = req.body;
      const filter = {_id: ObjectId(id)};
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId
        }
      }

      const result = await paymentCollection.insertOne(payment);
      const updatedBooking = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(updatedBooking);
    })

 


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



