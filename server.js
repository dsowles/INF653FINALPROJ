/**
 * Module server
 * Author David A. Sowles
 * Description   Main entry point for the Express application. Configures 
 *               middleware, database connectivity, routing, and error handling.
 */

// Loads environment variables from a .env file into process.env
require('dotenv').config();
// Web framework for building the API routing infrastructure
const express = require('express');
// Instance of the Express application to configure middleware and routes
const app = express();
// Object Data Modeling (ODM) library for MongoDB database interactions
const mongoose = require('mongoose');
// Middleware to enable Cross-Origin Resource Sharing for restricted resources
const cors = require('cors');


const PORT = process.env.PORT || 3500;

// Middleware configuration
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/states', require('./routes/states'));

// Connect to MongoDB Atlas using the Replit secret key
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas'))
    .catch(err => console.error('Database connection error:', err));

app.all('*path', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.send('<h1>404 Not Found</h1>'); // Or send a dedicated 404.html file
    } else if (req.accepts('json')) {
        res.json({ error: "404 Not Found" });
    } else {
        res.type('txt').send("404 Not Found");
    }
});

/**
 * Starts the Express server listening on the specified port.
 */
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));