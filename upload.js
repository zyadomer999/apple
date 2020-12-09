const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const data = new FormData();
data.append("video", fs.createReadStream(process.argv[2]));
data.append("chat_id", process.argv[3]);
data.append("height", process.argv[4]);
data.append("width", process.argv[5]);
data.append("caption", process.argv[6]);

const config = {
  method: "post",
  url: process.argv[7],
  headers: {
    ...data.getHeaders(),
  },
  data: data,
};

axios(config);
