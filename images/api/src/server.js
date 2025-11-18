const http = require('http');
const express = require('express');
const { createServer } = require('http');
const { join } = require('node:path');
const path = require('path');

const { Server } = require('socket.io');

const jwt = require('jsonwebtoken');
const cors = require("cors")

const { checkBodyFields } =require("./helpers/bodyHelpers");
const { uuidv4 } =require("./helpers/uuidHelpers");
const pg = require('./db/db.js')

const user_routes = require('./routes/users')
const classroom_routes = require('./routes/classrooms')
const feedback_routes = require('./routes/feedback')
const checkpoint_routes = require('./routes/checkpoints')
const contact_routes = require('./routes/contact')
const feedbackRequest_routes = require('./routes/feedbackRequests')
const feedbackDemand_routes = require('./routes/feedbackDemands')

const { init } = require('./socket');

const app = express();

const server = createServer(app);

app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/users', user_routes);
app.use('/classrooms', classroom_routes);
app.use('/feedback', feedback_routes);
app.use('/checkpoints', checkpoint_routes);
app.use('/contact', contact_routes);
app.use('/feedback-requests', feedbackRequest_routes);
app.use('/feedback-demands', feedbackDemand_routes);

app.get('/', (req, res) => {
  res.send("running")
})



init(server)





module.exports = server;