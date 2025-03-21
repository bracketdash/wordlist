const fs = require("fs");

const dict = "wordle";

function compress(wordlist) {
  const places = ["", "", "", "", ""];
  const counts = [0, 0, 0, 0, 0];
  for (let i = 0; i < wordlist.length; i++) {
    const word = wordlist[i];
    for (let j = 0; j < 5; j++) {
      if (i > 0 && word[j] !== wordlist[i - 1][j]) {
        places[j] += `${wordlist[i - 1][j]}${counts[j] > 1 ? counts[j] : ""}`;
        counts[j] = 1;
      } else {
        counts[j]++;
      }
    }
    if (i === wordlist.length - 1) {
      for (let j = 0; j < 5; j++) {
        places[j] += `${wordlist[i - 1][j]}${counts[j] > 1 ? counts[j] : ""}`;
      }
    }
  }
  return places.join(";");
}

function decompress(compressed) {
  const words = [];
  const places = compressed.split(";");
  const counts = [0, 0, 0, 0, 0];
  const firstPlaceChars = places[0].split(/[0-9]+/);
  firstPlaceChars.forEach((char) => {
    const index = places[0].indexOf(char);
    const num = parseInt(places[0].slice(index).match(/[0-9]+/), 10);
    for (let a = 0; a < num; a++) {
      const word = char;
      // TODO: construct the rest of the word
      words.push(word);
    }
  });
  process.exit(1);
}

const wordlist = fs.readFileSync(`./wordlists/${dict}.txt`, "utf-8");
const wordsArray = wordlist
  .split(/\r?\n/)
  .map((w) => w.split("").reverse().join(""))
  .sort();
const compressed = compress(wordsArray);

const finalContents = `const compressed = "${compressed}";`;
fs.writeFileSync(`./generated/${dict}-noTrieReverse.js`, finalContents);
process.exit(1);

const decompressed = decompress(compressed);
const commaSeparatedOriginal = wordsArray.join(",");
const commaSeparatedDecompressed = decompressed.join(",");
if (commaSeparatedOriginal === commaSeparatedDecompressed) {
  const finalContents = `const compressed = "${compressed}";`;
  fs.writeFileSync(`./generated/${dict}-noTrieReverse.js`, finalContents);
  const savings = wordlist.length - finalContents.length;
  const kSaved = Math.floor(savings / 1024);
  console.log(
    `Success! Produced ${dict}-noTrieReverse.js with a ${kSaved}k savings.`
  );
} else {
  console.log("Failed.");
}
