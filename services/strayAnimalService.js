// const StrayAnimal = require('../models/StrayAnimal');

// class StrayAnimalService {
//     async getStrayAnimals() {
//         return await StrayAnimal.find().sort({ createdOn: -1 }).exec();
//     }

//     async getStrayAnimalById(saId) {
//         return await StrayAnimal.findById(saId).exec();
//     }

//     async createStrayAnimal(newStrayAnimalData) {
//         const newStrayAnimal = new StrayAnimal(newStrayAnimalData);
//         return await newStrayAnimal.save();
//     }

//     // Implement other CRUD operations similarly
// }

// module.exports = new StrayAnimalService();
