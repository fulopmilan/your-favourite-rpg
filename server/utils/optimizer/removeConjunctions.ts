const conjunctions: string[] = [
    "and",
    "for",
    "of",
    "in",
    "a",
    "such",
    "as",
    "through",
    "but",
    "or",
    "nor",
    "yet",
    "so",
    "while",
    "although",
    "because",
    "since",
    "after",
    "before",
    "when",
    "if",
    "unless",
    "until",
    "while",
    "where",
    "whether",
    "either",
    "neither",
    "not only",
    "but also",
    "both",
    "and",
    "either",
    "or",
    "neither",
    "nor",
];

export function removeConjunctions(text: string) {
    const words = text.split(' ');
    const filteredWords = words.filter(word => !conjunctions.includes(word.toLowerCase()));
    //const savedWords = words.length - filteredWords.length;
    //console.log("saved " + savedWords + " words");
    return filteredWords.join(' ');
}