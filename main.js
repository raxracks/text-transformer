const Discord = require("concordia");
const client = new Discord.Client();
const config = require("./config-bot.json");
const { readFileSync, writeFileSync } = require("jsonfile");
const { compareTwoStrings } = require("string-similarity");
const { statSync } = require("node:fs");
const SexDB = require("./lib");
let db = new SexDB("ws://127.0.0.1:9001");
let data = readFileSync("./data.json")["data"];
let states = ["connecting", "open", "closing", "closed"];

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

setInterval(() => {
  data = shuffle(readFileSync("./data.json")["data"]);
}, 30000);

function gen(input, blacklist = []) {
    let highest = 0;
    let closest = [];
    let lastIndex = 0;
    let dIndex = 0;
      
    for(let index = 0; index < data.length; index++) {
      if(blacklist.includes(index)) {} else {
      let d = data[index];
      let matches = [];
      let score = 0;
      let i = 0;
      let matchI = 0;
      
      input.forEach(s => { 
        for(i = 0; i < d.length; i++) {
          let w = d[i];
          if(s === w) {
            matchI = i;
            matches.push(i);
            score++;
            break;
          }
        }
      });
      if(matches.length === d.length) score = 0;
      if(score > highest) {
        highest = score;
        closest = d;
        lastIndex = matchI + 1;
        dIndex = index;
      }
    }
    }

    for(let i = 0; i < lastIndex; i++) closest.shift();
    let result = [];
    for(let i = 0; i < Math.floor(Math.random() * 2) + 3; i++) result.push(closest[i]);

    return {result, dIndex, index: lastIndex};
    
  }

function run(input) {
 
  // let highest = 0;
  let collected = [];
  let matched = [];
  let startIndex = 0;
  let lastIndex = 0;
    
  data.forEach(d => {
    let i = 0;
    let score = 0;
    let matches = [];
    let matchI = 0;
    let startI = -1;
    input.forEach(s => { 
      for(i = 0; i < d.length; i++) {
        let w = d[i];
        if(s === w) {
          matches.push(i);
          matchI = i;
          if(startI === -1) startI = i;
          score++;
          break;
        }
      }
    });
    // if(matches.length === d.length) score = 0;
    collected.push({value: d.map((a, idx) => matches.includes(idx) ? `\`${a}\`` : a), score});
    // if(score > highest) {
    //   highest = score;
    //   closest = d;
    //   matched = matches;
    //   startIndex = startI;
    //   lastIndex = matchI + 1;
    // }
  });

  return {results: collected.sort((a, b) => b.score - a.score).filter(a => a.score > 0).slice(0, 10), totalResults: collected.filter(a => a.score > 0).length};
  

  // matched.forEach(m => {
  //   closest[m] = `\`${closest[m]}\``;
  // });

  // let full = closest.join(" ");
  // let result = closest.join(" ").split(" ");
  // for(let i = 0; i < lastIndex; i++) result.shift();
  // for(let i = 0; i < startIndex; i++) closest.shift();

  // return {result, score: highest / closest.length, full};
}

client.on("message", msg => {
  if(msg.author.bot && !msg.content.startsWith("sexdb ")) return;
  if(msg.content.toLowerCase() === "lph stats") {
    msg.reply(`
Messages: ${data.length}
Words: ${data.reduce((acc, current) => acc + current.length, 0)}
Letters: ${data.reduce((acc, current) => acc + current.reduce((a, c) => a + c.length, 0), 0)}
DB Size: ${Math.round((statSync("data.json").size / (1024*1024)) * 100) / 100}mb
    `);
  } else if(msg.content.toLowerCase().startsWith("lph search ")) {
    let split = msg.content.slice("lph search ".length).toLowerCase().trim().split(" ");
    let out = run(split);
    let a = out.results.map(a => `${a.value.join(" ")} (${a.score})`).join("\n");

    msg.reply(`***${out.totalResults}*** results.\n\n${a}​`.substring(0, 2000));
  } else if(msg.content.toLowerCase().startsWith("lph eval ")) {
    if(msg.author.id !== "141012665504890880") return;
    try {
      msg.reply("```json\n" + JSON.stringify(eval(msg.content.slice("lph eval ".length))) + "\n```");
    } catch(e) {
      msg.reply("ewwor: " + e);
    }
  } else if(msg.content.toLowerCase() === "sexdb status") {
    msg.reply(`
Websocket: ${states[db.ws.readyState]}
`).then(m => {
    let t = Date.now();

    db.custom("a").catch(() => {
      m.edit(`
Websocket: ${states[db.ws.readyState]}
Ping: ${Date.now() - t}ms
`)
    });
    });
  } else if(msg.content.toLowerCase().startsWith("sexdb ")) {
    db.custom(msg.content.slice("sexdb ".length)).then(res => {
	msg.reply(res);
    }).catch(err => {
	msg.reply(err);
    });
  } else if(msg.content.toLowerCase().startsWith("lph ")) {
    let split = msg.content.slice("lph ".length).toLowerCase().trim().split(" ");

    // msg.reply(run(split).map(a => `${a.value.join(" ")} (${a.score})`).join("\n") + "​");
    // let {result, score, full} = run(split);
    // let joint = `${split.join(" ")} ${result.join(" ").substring(0, 2000 - (split.join(" ").length + 1))}`;

    // msg.reply(`${joint}`);

    let previousDIndex = -1;
    let previousIndexes = [];
    let repeats = 0;
    let blacklist = [];
    // msg.reply(split.join(" ")).then(m => {
      for(let i = 0; i < Math.floor(Math.random() * 10) + 8; i++) {
        let {result, dIndex, index} = gen(split, blacklist);
        if(result.length === 1 && result[0] === undefined || result.length === 0) break;
        // if(previousIndexes.includes(index) && repeats >= 2) {
        // blacklist.push(dIndex);
        // repeats = 0;
        // }
        if(previousIndexes.includes(index)) {
        blacklist.push(dIndex);
        continue;
        }
        if(previousDIndex !== dIndex) previousIndexes = [];
        previousIndexes.push(index);
        previousDIndex = dIndex;
        result = result.filter(v => v !== undefined);
        split.push(...result);
        // m.edit(split.join(" "));
      }
      // m.edit(split.join(" "));
      // });
      
      msg.reply(split.join(" ").substring(0, 2000));
      // msg.channel.stopTyping();
  }
  
});

client.on("ready", () => {
  console.log("ready");
});

client.login(config.token);
