/**
 * module models/States.js
 * author David A. Sowles
 * requires mongoose
 * description      Defines the schema structure and compiling model configuration 
 *                  for storing and querying US state data in MongoDB.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const stateSchema = new Schema({
    stateCode: {
        type: String,
        required: true,
        unique: true
    },
    funfacts: [{
        type: String
    }]
});


module.exports = mongoose.model('State', stateSchema);