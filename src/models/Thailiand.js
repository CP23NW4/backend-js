const mongoose = require('mongoose')

// Define schema
const ThailandSchema = new mongoose.Schema({
  PostCode: Number,
  TambonThaiShort: String,
  DistrictThaiShort: String,
  ProvinceThai: String
});

// Create model
const Thailand = mongoose.model('Thailand', ThailandSchema);

module.exports = Thailand;

