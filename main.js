const Discord = require("concordia");
const client = new Discord.Client();
const config = require("./config-bot.json");
const { readFileSync, writeFileSync } = require("jsonfile");
const { compareTwoStrings } = require("string-similarity");
const { statSync } = require("node:fs");
let data = readFileSync("./data.json")["data"];

setInterval(() => {
  data = readFileSync("./data.json")["data"];
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
    if(matches.length === d.length) score = 0;
    collected.push({value: d, score});
    // if(score > highest) {
    //   highest = score;
    //   closest = d;
    //   matched = matches;
    //   startIndex = startI;
    //   lastIndex = matchI + 1;
    // }
  });

  return collected.sort((a, b) => b.score - a.score).filter(a => a.score > 0).slice(0, 5);
  

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
  if(msg.author.bot) return;
  if(msg.content.toLowerCase() === "lph stats") {
    msg.reply(`
Messages: ${data.length}
Words: ${data.reduce((acc, current) => acc + current.length, 0)}
Letters: ${data.reduce((acc, current) => acc + current.reduce((a, c) => a + c.length, 0), 0)}
DB Size: ${Math.round((statSync("data.json").size / (1024*1024)) * 100) / 100}mb
    `);
  } else if(msg.content.toLowerCase().startsWith("lph search ")) {
    let split = msg.content.slice("lph search ".length).toLowerCase().trim().split(" ");

    msg.reply(run(split).map(a => `${a.value.join(" ")} (${a.score})`).join("\n").substring(0, 1999) + "​");
  } else if(msg.content.toLowerCase().startsWith("lph eval ")) {
    if(msg.author.id !== "141012665504890880") return;
    try {
      msg.reply("```json\n" + JSON.stringify(eval(msg.content.slice("lph eval ".length))) + "\n```");
    } catch(e) {
      msg.reply("ewwor: " + e);
    }
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
      for(let i = 0; i < Math.floor(Math.random() * 15) + 10; i++) {
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
      }
      msg.reply(split.join(" "));
      // msg.channel.stopTyping();
  }
});

client.on("ready", () => {
  console.log("ready");
});

client.login(config.token);
