let lastQuestion = ''; // Store the last question asked
let controller = null; // AbortController for stopping the request

// Function to handle the Enter key press
function handleKeyDown(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default form submission behavior
        sendMessage(); // Call the sendMessage function
    }
}

async function sendMessage() {
    const input = document.getElementById('userInput').value;
    const responseDiv = document.getElementById('response');
    const questionDisplay = document.getElementById('questionDisplay');
    const questionText = document.getElementById('questionText');
    const askButton = document.getElementById('askButton');

    if (!input) {
        responseDiv.innerHTML = 'Please enter a message.';
        return;
    }

    lastQuestion = input; // Save the question
    responseDiv.innerHTML = 'Loading...';

    // Display the question at the top
    questionText.innerText = input;
    questionDisplay.style.display = 'block';

    // Clear the input field after sending
    document.getElementById('userInput').value = '';

    // Hide the askButton after sending the question
    askButton.style.display = 'none';

    // Enable the Stop button and show the Retry and Rewrite buttons
    document.getElementById('stopButton').disabled = false;
    document.getElementById('retryButton').style.display = 'inline-block';
    document.getElementById('rewriteButton').style.display = 'inline-block';
    document.getElementById('stopButton').style.display = 'inline-block';

    // Create an AbortController to allow stopping the request
    controller = new AbortController();

    try {
        const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer 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',
                    'HTTP-Referer': 'https://www.sitename.com',
                    'X-Title': 'SiteName',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-r1:free',
                    messages: [{ role: 'user', content: input }],
                }),
                signal: controller.signal, // Attach the AbortController signal
            },
        );
        const data = await response.json();
        console.log(data);
        const markdownText =
            data.choices?.[0]?.message?.content || 'No response received.';

        // Parse Markdown and highlight code blocks
        const parsedHtml = marked.parse(markdownText);
        responseDiv.innerHTML = parsedHtml;

        // Highlight code blocks using Highlight.js
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });

        // Add copy buttons to code blocks
        addCopyCodeButtons(responseDiv);
    } catch (error) {
        if (error.name === 'AbortError') {
            responseDiv.innerHTML = 'Request stopped by the user.';
        } else {
            responseDiv.innerHTML = 'Error: ' + error.message;
        }
    } finally {
        // Disable the Stop button after the request is complete or stopped
        document.getElementById('stopButton').disabled = true;
        controller = null; // Reset the AbortController
    }
}

function rewriteQuestion() {
    if (!lastQuestion) {
        alert('No question to rewrite.');
        return;
    }
    document.getElementById('userInput').value = lastQuestion; // Populate the input field with the last question
}

function stopRequest() {
    if (controller) {
        controller.abort(); // Abort the ongoing fetch request
    }
}

function retryQuestion() {
    if (!lastQuestion) {
        alert('No question to retry.');
        return;
    }
    document.getElementById('userInput').value = lastQuestion; // Populate the input field with the last question
    sendMessage(); // Resend the last question
}

function addCopyCodeButtons(container) {
    // Find all code blocks in the response
    const codeBlocks = container.querySelectorAll('pre');

    codeBlocks.forEach((block) => {
        // Create a copy button
        const copyButton = document.createElement('button');
        copyButton.innerText = 'Copy Code';
        copyButton.classList.add('copy-code-button');

        // Add click event to copy the code block content
        copyButton.onclick = () => {
            const codeContent = block.querySelector('code').innerText;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(codeContent).then(() => {
                    alert('Code copied to clipboard!');
                });
            } else {
                alert('Clipboard access is not supported in your browser.');
            }
        };

        // Append the copy button to the code block
        block.appendChild(copyButton);
    });
}
