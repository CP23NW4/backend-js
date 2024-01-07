// azureBlobService.js to encapsulate Azure Blob Storage functionality

const { BlobServiceClient } = require('@azure/storage-blob');

require('dotenv').config({ path: '../.env' });


const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'dogs'; // Your container name in Azure Storage

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

async function uploadImageToBlob(imageData, fileName) {
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  const uploadBlobResponse = await blockBlobClient.uploadData(imageData);
  return uploadBlobResponse;
}

// Add more functions for retrieving/deleting images as needed

module.exports = {
  uploadImageToBlob,
  // export other functions if needed
};
