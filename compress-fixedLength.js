const fs = require("fs");

const availableDicts = ["wordle"];
let dict = "wordle";

if (process.argv[2] && availableDicts.includes(process.argv[2])) {
  dict = process.argv[2];
  console.log(`Compressing dictionary "${dict}"...`);
} else {
  console.log(`Defaulting to dictionary "${dict}"...`);
}

function compress(wordlist) {
  const places = ["", "", "", "", ""];
  const counts = [1, 1, 1, 1, 1];
  for (let i = 1; i < wordlist.length; i++) {
    const word = wordlist[i];
    for (let j = 0; j < 5; j++) {
      if (word[j] !== wordlist[i - 1][j]) {
        places[j] += `${wordlist[i - 1][j]}${counts[j] > 1 ? counts[j] : ""}`;
        counts[j] = 1;
        if (i === wordlist.length - 1) {
          places[j] += word[j];
        }
      } else {
        counts[j]++;
        if (i === wordlist.length - 1) {
          places[j] += `${word[j]}${counts[j]}`;
        }
      }
    }
  }
  return places.join(";");
}

function decompress(compressed) {
  const words = [];
  const places = compressed
    .split(";")
    .map((place) =>
      place
        .match(/([a-z])([0-9]+)?/g)
        .map((match) => [
          match[0],
          match.length > 1 ? parseInt(match.slice(1)) : 1,
        ])
    );
  const counts = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ];
  places[0].forEach(([char, num]) => {
    for (let a = 0; a < num; a++) {
      let word = char;
      for (let b = 1; b < 5; b++) {
        word += places[b][counts[b][0]][0];
        counts[b][1]++;
        if (counts[b][1] >= places[b][counts[b][0]][1]) {
          counts[b][1] = 0;
          counts[b][0]++;
        }
      }
      words.push(word);
    }
  });
  return words.sort();
}

const wordlist = fs.readFileSync(`./wordlists/${dict}.txt`, "utf-8");
const wordsArray = wordlist
  .split(/\r?\n/)
  .map((w) => w.split("").reverse().join(""))
  .sort();
const compressed = compress(wordsArray);

const decompressed = decompress(compressed);
const commaSeparatedOriginal = wordsArray.join(",");
const commaSeparatedDecompressed = decompressed.join(",");
if (commaSeparatedOriginal === commaSeparatedDecompressed) {
  const finalContents = `const compressed = "${compressed}";`;
  fs.writeFileSync(`./generated/${dict}-fixedLength.js`, finalContents);
  const savings = wordlist.length - finalContents.length;
  const kSaved = Math.floor(savings / 1024);
  console.log(
    `Success! Produced ${dict}-fixedLength.js with a ${kSaved}k savings.`
  );
} else {
  console.log("Failed.");
}
