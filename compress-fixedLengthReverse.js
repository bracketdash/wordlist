const fs = require("fs");

const dict = "wordle";

const FIXED_LENGTH = 5;

function makeTrieFrom(words) {
  const trie = {};
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex].split("").reverse().join("");
    let currentNode = trie;
    for (let letterIndex = 0; letterIndex < FIXED_LENGTH; letterIndex++) {
      const char = word[letterIndex];
      if (letterIndex === FIXED_LENGTH - 1) {
        currentNode[char] = "$";
      } else if (!currentNode[char]) {
        currentNode[char] = {};
      }
      currentNode = currentNode[char];
    }
  }
  return trie;
}

function makeWordsFrom(trie) {
  const words = [];
  const stack = [[trie, ""]];
  while (stack.length > 0) {
    const [currentNode, prefix] = stack.pop();
    if (currentNode === "$") {
      words.push(prefix.split("").reverse().join(""));
    } else {
      const chars = Object.keys(currentNode);
      for (let i = chars.length - 1; i >= 0; i--) {
        const char = chars[i];
        stack.push([currentNode[char], prefix + char]);
      }
    }
  }
  return words;
}

function compress(wordlist) {
  const trie = makeTrieFrom(wordlist);
  let compressed = JSON.stringify(trie);

  compressed = compressed.replace(/"([a-z])":"\$"/g, (_, c) => c.toUpperCase());

  compressed = compressed.replace(/"([a-z])":{/g, "$1");

  compressed = compressed.replace(/(\}+),/g, (_, c) => c.length);

  compressed = compressed.replaceAll(",", "");

  return compressed;
}

function decompress(compressed) {
  let decompressed = compressed;

  decompressed = decompressed.replace(/([A-Z])([A-Z])/g, "$1,$2");
  decompressed = decompressed.replace(/([A-Z])([A-Z])/g, "$1,$2");

  decompressed = decompressed.replace(/([a-z])/g, '"$1":{');

  decompressed = decompressed.replace(
    /([A-Z])/g,
    (c) => `"${c.toLowerCase()}":"$"`
  );

  const getEndBrackets = (c) => "}".repeat(parseInt(c, 10)) + ",";
  decompressed = decompressed.replace(/([0-9]+)/g, getEndBrackets);

  const words = makeWordsFrom(JSON.parse(decompressed));
  words.sort();
  return words;
}

const wordlist = fs.readFileSync(`./wordlists/${dict}.txt`, "utf-8");
const wordsArray = wordlist.split(/\r?\n/).sort();
const compressed = compress(wordsArray);

// const finalContents = `const compressedTrie = "${compressed}";`;
// fs.writeFileSync(`./generated/${dict}-fixedlengthReverse.js`, finalContents);
// process.exit(1);

const decompressed = decompress(compressed);
const commaSeparatedOriginal = wordsArray.join(",");
const commaSeparatedDecompressed = decompressed.join(",");
if (commaSeparatedOriginal === commaSeparatedDecompressed) {
  const finalContents = `const compressedTrie = "${compressed}";`;
  fs.writeFileSync(`./generated/${dict}-fixedlengthReverse.js`, finalContents);
  const savings = wordlist.length - finalContents.length;
  const kSaved = Math.floor(savings / 1024);
  console.log(
    `Success! Produced ${dict}-fixedlengthReverse.js with a ${kSaved}k savings.`
  );
} else {
  console.log("Failed.");
}
