// ไฟล์ run: node index.js
// models folder เก็บ db
// routes folder เก็บ crud (ทำ crud แยกไฟล์ปกติ)
// const express = require('express'); <- ต้องใช้ประจำ ทุกไฟล์
// ใน routes.index import file require แล้วก็ต้อง export router ไปที่ file ใหญ่ (add.js)
// model.index ไว้เชื่อม db


const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
// const route = require('./routes');    // api
const port = 8090;
// const model = require('./models')


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use('/', route);
// Define a route
app.get('/', (request, response) => {
  res.send('Hello, Express! you can testå');
});

// Start the server
app.listen(port, () => {
  console.log(`Backend running with port : ${port} !!!`);
});