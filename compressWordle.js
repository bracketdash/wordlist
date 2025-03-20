const fs = require("fs");
const { compress, decompress } = require("./functions.js");

const wordlist = fs.readFileSync("wordsWordle.txt", "utf-8");

const compressed = compress(wordlist);

const decompressed = decompress(compressed);

if (decompressed === wordlist) {
  const finalContents = `const compressedTrie = "${compressed}";`;
  fs.writeFileSync("wordle.js", finalContents);
  const savings = wordlist.length - finalContents.length;
  const kSaved = Math.floor(savings / 1024);
  console.log(`Success! Produced all.js with a ${kSaved}k savings.`);
} else {
  console.log("Failed.");
}
