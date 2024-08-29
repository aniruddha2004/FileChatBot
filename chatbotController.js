const express = require('express');
const router = express.Router();
const axios = require('axios');
const fileParser = require('./fileParser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Set up multer to handle file uploads
const storage = multer.diskStorage({
    destination: 'temp/',
    filename: function (req, file, cb) {
        cb(null, "tempFile" + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// Route for file upload and text extraction
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        // Use the appropriate parser based on the file type
        let sessionText = '';
        if (filePath.endsWith('.pdf')) {
            sessionText = await fileParser.parsePDF(filePath);
        }
        else if (filePath.endsWith('.docx')) {
            sessionText = await fileParser.parseDOC(filePath);
        }
        else if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            sessionText = await fileParser.parseIMG(filePath);
        }
        else {
            // Handle other file types as needed
            throw new Error('Unsupported file type');
        }

        // Create the testFiles directory if it doesn't exist
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        // Write the extracted text to the temp.txt file inside the testFiles directory
        const tempFilePath = path.join(tempDir, 'temp.txt');
        fs.writeFileSync(tempFilePath, sessionText);
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'File processing failed' });
    }
    res.redirect("/chat");
});


// Route for chatbot queries
router.post('/chat', async (req, res) => {
    // res.send("Chat route is working");
    const userQuestion = req.body.question;
    const tempFilePath = path.join(__dirname, 'temp', 'temp.txt');
    let content = "";
    try {
        // Read the contents of the file synchronously (you can also use asynchronous methods if needed)
        content = fs.readFileSync(tempFilePath, 'utf-8');
    } catch (error) {
        console.error('Error reading temp.txt:', error);
        throw new Error('Error reading temp.txt file');
    }

    try {
        // Call the external Chatbot API using Axios
        const chatbotResponse = await callChatbotAPI(userQuestion, content);

        //Write the content to the "temp.txt" file without erasing the previous content
        fs.appendFile(tempFilePath, '\nPAQ' + userQuestion, function (err) {
            if (err) throw err;
            console.log('Saved!');
          });

        res.json({ message: chatbotResponse }); // Send the chatbot's answer as the response
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route for deleting temporary files
router.post('/finish', (req, res) => {
    try {
        const tempDir = path.join(__dirname, 'temp');

        // Read all files in the temp directory
        const files = fs.readdirSync(tempDir);

        // Delete each file
        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            fs.unlinkSync(filePath);
            console.log(`Deleted ${filePath}`);
        });

        // Optionally, remove the temp directory itself
        // fs.rmdirSync(tempDir);
        res.redirect('/');

    } catch (error) {
        console.error('Error deleting files:', error);
        res.status(500).json({ error: 'Failed to delete temporary files' });
    }
});

//Function to call the external Chatbot API
async function callChatbotAPI(question, text) {
    // const apiKey = process.env.chatGPT_API;
    const apiKey = ''
    const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

    // let message = `${text} After going through the above text give a response to the question ${question} from the provided text without adding any information from outside the given text. The answer must not contain more than 75 tokens.`;
    let message = `${text} After going through the above text give a response to the question ${question} only in not more than 70 tokens from the provided text without adding any information from outside the given text. And in the above text if a line starts with PAQ, it means that it was a question asked to you previously. So remember those previous questions and answer the latest one to continue the conversation accordingly like in a chat in chatgpt. And dont give PAQ in the answer.`;

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
    };

    const data = {
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: 'You are' },
            { role: 'user', content: message },
        ],
    };

    try {
        const response = await axios.post(apiEndpoint, data, { headers });
        const content = response.data.choices[0].message.content;
        return content;
    } catch (error) {
        return `Error: ${error.message}`;
    }
}


module.exports = router;
