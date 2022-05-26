const express = require('express');
const cors = require('cors');

const { serverPort } = require('./config');

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use('/user', require('./routes/v1/user'));
app.use('/wines', require('./routes/v1/wines'));
app.use('/my_wines', require('./routes/v1/myWines'));

// Testing
app.get('/', (req, res) => {
  res.send('ok somlje');
});

app.all('*', (req, res) => res.status(404).send({ error: 'Page not found' }));

app.listen(serverPort, () => console.log(`Running on port ${serverPort}`));
