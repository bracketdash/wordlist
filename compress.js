const fs = require("fs");

const availableDicts = ["all", "bananagrams", "wordle"];
let dict = "all";

if (process.argv[2] && availableDicts.includes(process.argv[2])) {
  dict = process.argv[2];
  console.log(`Compressing dictionary "${dict}"...`);
} else {
  console.log('Defaulting to dictionary "all"...');
}

function makeTrieFrom(words) {
  const trie = {};
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex];
    let currentNode = trie;
    for (let letterIndex = 0; letterIndex < word.length; letterIndex++) {
      const char = word[letterIndex];
      if (!currentNode[char]) {
        currentNode[char] = {};
      }
      currentNode = currentNode[char];
    }
    currentNode.$ = 1;
  }
  return trie;
}

function makeWordsFrom(trie) {
  const words = [];
  const stack = [[trie, ""]];
  while (stack.length > 0) {
    const [currentNode, prefix] = stack.pop();
    if (currentNode.$) {
      words.push(prefix);
    }
    const chars = Object.keys(currentNode).filter((key) => key !== "$");
    for (let i = chars.length - 1; i >= 0; i--) {
      const char = chars[i];
      stack.push([currentNode[char], prefix + char]);
    }
  }
  return words;
}

function compress(wordlist) {
  const trie = makeTrieFrom(wordlist);
  let compressed = JSON.stringify(trie);

  // A
  compressed = compressed.replace(/"([a-z])":{/g, "$1");

  // B
  compressed = compressed.replaceAll('"$":1', "$");

  // C
  compressed = compressed.replace(/(\}+)/g, (c) => c.length);

  // D
  compressed = compressed.replace(/([0-9]+),/g, "$1");

  // E
  compressed = compressed.replaceAll("$,", "$");

  // F
  compressed = compressed.replace(/([a-z])\$/g, (_, c) => c.toUpperCase());

  return compressed;
}

function decompress(compressed) {
  let decompressed = compressed;

  // F
  decompressed = decompressed.replace(/([A-Z])/g, (c) => c.toLowerCase() + "$");

  // A
  decompressed = decompressed.replace(/([a-z])/g, '"$1":{');

  // D
  decompressed = decompressed.replace(/([0-9]+)/g, "$1,").slice(0, -1);

  // E
  decompressed = decompressed.replace(/\$([^0-9])/g, "$,$1");

  // C
  const getEndBrackets = (c) => "}".repeat(parseInt(c, 10));
  decompressed = decompressed.replace(/([0-9]+)/g, getEndBrackets);

  // B
  decompressed = decompressed.replaceAll("$", '"$":1');

  const words = makeWordsFrom(JSON.parse(decompressed));
  words.sort();
  return words;
}

const wordlist = fs.readFileSync(`./wordlists/${dict}.txt`, "utf-8");

const wordsArray = wordlist.split(/\r?\n/).sort();

const compressed = compress(wordsArray);
const decompressed = decompress(compressed);

const commaSeparatedOriginal = wordsArray.join(",");
const commaSeparatedDecompressed = decompressed.join(",");

if (commaSeparatedOriginal === commaSeparatedDecompressed) {
  const finalContents = `const compressedTrie = "${compressed}";`;
  fs.writeFileSync(`./generated/${dict}.js`, finalContents);
  const savings = wordlist.length - finalContents.length;
  const kSaved = Math.floor(savings / 1024);
  console.log(`Success! Produced ${dict}.js with a ${kSaved}k savings.`);
} else {
  console.log("Failed.");
}
