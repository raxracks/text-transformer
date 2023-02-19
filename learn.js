const Discord = require("discord.js-selfbot-v13");
const client = new Discord.Client();
const config = require("./config.json");
const { readFileSync, writeFileSync } = require("jsonfile");
const data = readFileSync("./data.json");

client.on("message", msg => {
  if(msg.content.startsWith("lph") || msg.channel.type === "DM") return;
  if(config.ignore.includes(msg.author.id)) return;
  
  let split = msg.content.toLowerCase().split(/\s+|\n+/g);
  if(split.length === 1 && split[0] === "" || split.length === 0) return;
  data["data"].push(split);
});

setInterval(() => {
  writeFileSync("./data.json", data);
}, 5000);

client.login(config.token);

