const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7878;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB using Mongoose
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fphq6.mongodb.net/?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Listen for the connection events
const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});


// Define Mongoose Schema
const licenseSchema = new mongoose.Schema({
  name: String,
  email: String,
  id: String,
  vehicleNo: String,
  chessNo: String,
  photo: String,
  nidCopy: String,
  presentAddress: String,
  permanentAddress: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const License = mongoose.model('License', licenseSchema);
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/submit-license', upload.fields([{ name: 'photo' }, { name: 'nidCopy' }]), async (req, res) => {
  const formData = req.body;
  const files = req.files;

  // Convert file buffers to base64 for simplicity
  const photoBase64 = files['photo'][0].buffer.toString('base64');
  const nidCopyBase64 = files['nidCopy'][0].buffer.toString('base64');

  const newLicense = new License({
    ...formData,
    photo: photoBase64,
    nidCopy: nidCopyBase64,
  });

  try {
    await newLicense.save();
    res.status(201).json({ message: 'License application submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// GET endpoint to fetch all license data in descending order based on creation date
app.get('/api/licenses', async (req, res) => {
  try {
    const licenses = await License.find().sort({ createdAt: -1 });
    res.status(200).json(licenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET endpoint to fetch a single license by ID
app.get('/api/licenses/:id', async (req, res) => {
  const licenseId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(licenseId)) {
    return res.status(400).json({ message: 'Invalid license ID format.' });
  }

  try {
    const license = await License.findById(licenseId);

    if (!license) {
      return res.status(404).json({ message: 'License not found.' });
    }

    res.status(200).json(license);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET endpoint to fetch all subscribers
app.get('/api/subscribers', async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.status(200).json(subscribers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// GET endpoint to fetch license data based on email
app.get('/api/licenses/email/:userEmail', async (req, res) => {
  const email = req.params.userEmail; // Use a different parameter name

  try {
    const licenses = await License.find({ email: email }).sort({ createdAt: -1 });

    if (licenses.length === 0) {
      return res.status(404).json({ message: 'No licenses found for the provided email.' });
    }

    res.status(200).json(licenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// POST endpoint to subscribe users by email
app.post('/api/subscribe', async (req, res) => {
  const { email } = req.body;

  try {
    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();
    res.status(201).json({ message: 'Subscribed successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET endpoint to fetch all subscribers
app.get('/api/subscribers', async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.status(200).json(subscribers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});