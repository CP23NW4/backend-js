// const express = require('express');
// const router = express.Router();
// const strayAnimal = require('../models/strayAnimal');

// // GET all stray animals
// router.get('/', async (req, res) => {
//   try {
//     const strayAnimals = await strayAnimal.find().sort({ createdOn: -1 });
//     res.json(strayAnimals);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // GET a specific stray animal by ID
// router.get('/:saId', async (req, res) => {
//   try {
//     const strayAnimal = await strayAnimal.findById(req.params.saId);
//     res.json(strayAnimal);
//   } catch (err) {
//     res.status(404).json({ message: 'Stray animal not found' });
//   }
// });

// // POST create a new stray animal
// router.post('/', async (req, res) => {
//   const strayAnimal = new strayAnimal(req.body);
//   try {
//     const newStrayAnimal = await strayAnimal.save();
//     res.status(201).json(newStrayAnimal);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// // PUT update a stray animal by ID
// router.put('/:saId', async (req, res) => {
//   try {
//     const updatedStrayAnimal = await strayAnimal.findByIdAndUpdate(req.params.saId, req.body, { new: true });
//     res.json(updatedStrayAnimal);
//   } catch (err) {
//     res.status(404).json({ message: 'Stray animal not found' });
//   }
// });

// // DELETE a stray animal by ID
// router.delete('/:saId', async (req, res) => {
//   try {
//     await strayAnimal.findByIdAndDelete(req.params.saId);
//     res.json({ message: 'Stray animal deleted' });
//   } catch (err) {
//     res.status(404).json({ message: 'Stray animal not found' });
//   }
// });

// module.exports = router;
