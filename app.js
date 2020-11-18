const express = require("express");
const ytdl = require("ytdl-core");
const FormData = require("form-data");
const fs = require("fs");
const got = require("got");
const os = require("child_process");

const app = express();

function getVideoLinks(videoId, resolve) {
  const chosen = { video: [0, 0, 0, 0, 10000], audio: [0, 0, 0] };
  const video = ytdl(videoId);
  video.on("info", (info) => {
    for (a of info.formats) {
      if (a.container == "mp4" && ["mp4a", "avc1"].includes(a.codecs.split(".")[0])) {
        if (a.qualityLabel != null && a.audioBitrate == null) {
          if (a.height >= chosen.video[2] && a.fps <= chosen.video[4] && a.contentLength) {
            chosen.video[0] = a.url;
            chosen.video[1] = parseInt(a.contentLength);
            chosen.video[2] = a.height;
            chosen.video[3] = a.width;
            chosen.video[4] = a.fps;
          }
        } else if (a.qualityLabel == null && a.audioBitrate != null) {
          if (a.audioBitrate > chosen.audio[2]) {
            chosen.audio[0] = a.url;
            chosen.audio[1] = parseInt(a.contentLength);
            chosen.audio[2] = a.audioBitrate;
          }
        }
      }
    }
    resolve(chosen);
  });
}

function randomName() {
  let name = "";
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let a = 0; a <= 50; ++a) {
    const randomNumber = (Math.random() * 51).toFixed(0);
    name += characters[randomNumber];
  }
  return name;
}

app.get("/file", async function (req, res, next) {
  console.log("Hello World");
  const form = new FormData();
  const chatId = req.query.chatId;
  const videoId = req.query.videoId.split("youtu.be/")[1];
  const name = randomName();
  new Promise((resolve, reject) => {
    getVideoLinks(videoId, resolve);
  }).then(async (chosen) => {
    const videoPath = name + ".mp4";
    const audioPath = name + ".mp3";
    await new Promise((resolve, reject) => {
      os.exec(`aria2c -x 16 -s 16 -o "${videoPath}" "${chosen.video[0]}"`, function () {
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      os.exec(`aria2c -x 16 -s 16 -o "${audioPath}" "${chosen.audio[0]}"`, function () {
        resolve();
      });
    });
    os.exec(`ffmpeg -i ${videoPath} -i ${audioPath} -c copy output${videoPath}`, async function () {
      fs.unlink(videoPath, function () {});
      fs.unlink(audioPath, function () {});
      const readStream = fs.createReadStream("output" + videoPath);
      form.append("chat_id", chatId);
      form.append("video", readStream, "output" + videoPath);
      form.append("height", chosen.video[2]);
      form.append("width", chosen.video[3]);
      form.append("caption", "This is just a test!");
      await got.post(
        "http://localhost:8081/bot1457488865:AAG4vqcb0EXNABBqHzN47mg5GEMaJqub-vQ/sendVideo",
        { body: form }
      );
      fs.unlink("output" + videoPath, function () {});
    });
  });
  res.status(200).end();
});

app.listen(5000);
