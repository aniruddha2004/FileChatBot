document.addEventListener("DOMContentLoaded", function () {
    // Get DOM elements
    const chatMessages = document.getElementById("chat-messages");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const finishButton = document.getElementById("finish-button");
    const loadingSymbol = document.getElementById("loading-symbol");
    const confirmationPopup = document.getElementById("confirmation-popup");
    const yesButton = document.getElementById("yes-button");
    const noButton = document.getElementById("no-button");

    // Function to toggle send button state based on input content
    function toggleSendButtonState() {
        const isInputEmpty = messageInput.value.trim() === "";
        sendButton.disabled = isInputEmpty;
        if (isInputEmpty) {
            sendButton.classList.add("disabled-button");
        } else {
            sendButton.classList.remove("disabled-button");
        }
    }

    // Function to add message to the chat container
    function addMessageToChat(message, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.className = "message";
        messageDiv.classList.add(sender === "You" ? "user-message" : "chatbot-message");
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to handle sending messages
    function sendMessage() {
        const question = messageInput.value.trim();
        if (question !== "") {
            addMessageToChat(question, "You");
            messageInput.value = "";

            // Show loading symbol
            loadingSymbol.style.display = "flex";

            // Send user message to the backend server
            fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ question })
            })
            .then(response => response.json())
            .then(data => {
                // Hide loading symbol
                loadingSymbol.style.display = "none";
                addMessageToChat(data.message, "Chatbot");
            })
            .catch(error => {
                console.error("Error sending message:", error);
                // Hide loading symbol in case of an error
                loadingSymbol.style.display = "none";
            });
        }
        // Disable send button and enter key after sending message
        toggleSendButtonState();
    }

    // Display the initial chatbot message (welcome message)
    const welcomeMessage = "Welcome! How can I help you?";
    addMessageToChat(welcomeMessage, "Chatbot");

    // Enable send button and enter key when user starts typing
    messageInput.addEventListener("input", toggleSendButtonState);

    // Send message when send button is clicked
    sendButton.addEventListener("click", sendMessage);

    // Send message when enter key is pressed
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter" && !sendButton.disabled) {
            sendMessage();
        }
    });

    // Show confirmation pop-up
    finishButton.addEventListener("click", function () {
        confirmationPopup.style.display = "flex";
    });

    // Hide confirmation pop-up when "No" is clicked
    noButton.addEventListener("click", function () {
        confirmationPopup.style.display = "none";
    });

    // Handle "Yes" button click
    yesButton.addEventListener("click", function () {
        // Make a call to /api/finish
        fetch("/api/finish", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (response.redirected) {
                // If the server sends a redirect, manually navigate to the new location
                window.location.href = response.url;
            } else {
                return response.json();
            }
        })
        .then(data => {
            // Handle response if needed
            console.log("Chat finished:", data);
        })
        .catch(error => {
            console.error("Error finishing chat:", error);
        });
    
        // Close the pop-up
        confirmationPopup.style.display = "none";
    });
    
});
