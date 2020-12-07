const os = require("child_process");
os.exec(
  `curl --location --request POST 'http://localhost:9001/bot1457488865:AAG4vqcb0EXNABBqHzN47mg5GEMaJqub-vQ/sendVideo' --form 'video=@"./outputade3WU8.mp4"' --form 'chat_id="413923637"' --form 'height="1080"' --form 'width="1920"' --form 'caption="This is just a test!"'`
);

os.exec(
  `curl --location --request POST 'http://localhost:90${serverNumber}/bot1457488865:AAG4vqcb0EXNABBqHzN47mg5GEMaJqub-vQ/sendVideo' --form 'video=@"./output${videoPath}"' --form 'chat_id="${chatId}"' --form 'height="${
    chosen.video[2]
  }"' --form 'width="${
    chosen.video[3]
  }"' --form 'caption="This is just a test (${n.toString()})!"' && rm -rf *${name}*`
);
