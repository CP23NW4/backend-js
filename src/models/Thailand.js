// Thailand.js file defines the Mongoose model for the Thailand schema.
const mongoose = require('mongoose');

const thailandSchema = new mongoose.Schema({
    PostCode: Number,
    TambonThaiShort: String,
    DistrictThaiShort: String,
    ProvinceThai: String
});

const Thailand = mongoose.model('Thailand', thailandSchema, 'thailand');

module.exports = Thailand;
