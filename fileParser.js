const pdf = require('pdf-parse');
const { extractText } = require('doxtract');
const fs = require('fs');
const tesseract = require("tesseract.js");

async function parsePDF(filePath) {
    return pdf(fs.readFileSync(filePath)).then(function (data) {
        // PDF text
        return data.text;
    })
        .catch(function (err) {
            return err;
        });
}

async function parseDOC(filePath) {
    return new Promise((resolve, reject) => {
        extractText(filePath)
            .then((extractedText) => {
                resolve(extractedText);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

async function parseIMG(filePath) {
    return new Promise((resolve, reject) => {
        tesseract.recognize(filePath, 'eng', {logger : e => console.log(e) })
            .then((extractedText) => {
                resolve(extractedText.data.text);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

// Export both parsing functions
module.exports = {
    parsePDF,
    parseDOC,
    parseIMG
};