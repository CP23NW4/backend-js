// azureBlobService.js to encapsulate Azure Blob Storage functionality

const { BlobServiceClient } = require('@azure/storage-blob');

require('dotenv').config({ path: '../.env' });


const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Remove the default containerName here

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

async function uploadImageToBlob(imageData, fileName, containerName) {
  // Get the container client dynamically based on the provided containerName
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  const uploadBlobResponse = await blockBlobClient.uploadData(imageData);
  return uploadBlobResponse;
}

// Add more functions for retrieving/deleting images as needed

async function getImageFromBlob(fileName, containerName) {
  // Get the container client dynamically based on the provided containerName
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  const downloadBlockBlobResponse = await blockBlobClient.download(0);
  const data = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
  return data;
}

  // Helper function to convert stream to buffer
  function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

module.exports = {
  uploadImageToBlob,
  getImageFromBlob,
  // export other functions if needed
};
