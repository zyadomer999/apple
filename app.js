const express = require("express");
const ytdl = require("ytdl-core");
const FormData = require("form-data");
const fs = require("fs");
const got = require("got");
const os = require("child_process");
let serverNumber = 0;
let number = -1;
const app = express();
const EventEmitter = require("events");
class MyEmitter extends EventEmitter {}

os.exec("rm -rf *mp4*");
os.exec("rm -rf *mp3*");

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
  let name = "a";
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  for (let a = 0; a <= 5; ++a) {
    const randomNumber = (Math.random() * 61).toFixed(0);
    name += characters[randomNumber];
  }
  return name;
}
const events = [];
let requests = -1;

app.get("/file", async function (req, res, next) {
  const n = ++number;
  const form = new FormData();
  const chatId = req.query.chatId;
  const videoId = req.query.videoId.split("youtu.be/")[1];
  const name = randomName();
  new Promise((resolve, reject) => {
    getVideoLinks(videoId, resolve);
  }).then(async (chosen) => {
    events[events.push(new MyEmitter()) - 1].on("ready", async function () {
      events.shift();
      const videoPath = name + ".mp4";
      const audioPath = name + ".mp3";
      await new Promise((resolve, reject) => {
        os.exec(`aria2c -x 16 -s 16 -o "${videoPath}" "${chosen.video[0]}"`, function (e) {
          resolve();
        });
      });
      os.spawn("aria2c").kill();
      await new Promise((resolve, reject) => {
        os.exec(`aria2c -x 16 -s 16 -o "${audioPath}" "${chosen.audio[0]}"`, function (e) {
          resolve();
        });
      });
      os.spawn("aria2c").kill();
      os.exec(
        `ffmpeg -i ${videoPath} -i ${audioPath} -c copy output${videoPath}`,
        async function () {
          fs.unlink(videoPath, function (e) {});
          fs.unlink(audioPath, function (e) {});
          const readStream = fs.createReadStream("output" + videoPath);
          await new Promise((resolve, reject) => {
            readStream.on("ready", function () {
              resolve();
            });
          });
          form.append("chat_id", chatId);
          form.append("video", readStream, "output" + videoPath);
          form.append("height", chosen.video[2]);
          form.append("width", chosen.video[3]);
          form.append("caption", "This is just a test! " + n.toString());
          if (serverNumber == 9) {
            serverNumber = 0;
          }
          ++serverNumber;
          await got.post(
            `http://localhost:800${serverNumber}/bot1457488865:AAG4vqcb0EXNABBqHzN47mg5GEMaJqub-vQ/sendVideo`,
            { body: form }
          );
          fs.unlink("output" + videoPath, function (e) {});
          --requests;
          try {
            events[0].emit("ready");
          } catch {
            return;
          }
        }
      );
    });
    ++requests;
    if (requests < 10) {
      events[0].emit("ready");
    }
  });
  res.send("<h1>Video Downlaod!</h1>");
});

app.use(function (req, res, next) {
  res.send("<h1>Hello World!</h1>");
});

app.listen(3000);
