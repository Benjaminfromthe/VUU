// ==========================================
// VUU Transport Live AI Chatbot Widget
// ==========================================
(function() {
    // Avoid double injection
    if (document.getElementById('vuu-ai-chatbot-root')) return;

    // Create Root Container
    const root = document.createElement('div');
    root.id = 'vuu-ai-chatbot-root';
    root.style.position = 'fixed';
    root.style.bottom = '20px';
    root.style.right = '20px';
    root.style.zIndex = '99999';
    root.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    document.body.appendChild(root);

    // CSS styles injection
    const style = document.createElement('style');
    style.innerHTML = `
        .vuu-chat-trigger {
            background: linear-gradient(135deg, #ffcc00 0%, #ffb300 100%);
            color: #111;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 2px solid #ffffff;
        }
        .vuu-chat-trigger:hover {
            transform: scale(1.1) rotate(10deg);
            box-shadow: 0 6px 20px rgba(255, 204, 0, 0.4);
        }
        .vuu-chat-window {
            display: none;
            flex-direction: column;
            width: 350px;
            height: 480px;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            border: 1px solid #eee;
            overflow: hidden;
            position: absolute;
            bottom: 70px;
            right: 0;
            animation: vuuSlideUp 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        @keyframes vuuSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .vuu-chat-header {
            background: #111111;
            color: #ffffff;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .vuu-chat-header-info {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .vuu-chat-header-title {
            font-weight: bold;
            font-size: 0.95rem;
            letter-spacing: 0.5px;
        }
        .vuu-chat-header-status {
            font-size: 0.7rem;
            color: #ffcc00;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .vuu-chat-header-pulse {
            width: 6px;
            height: 6px;
            background-color: #28a745;
            border-radius: 50%;
            display: inline-block;
            animation: pulse-dot 1.5s infinite;
        }
        @keyframes pulse-dot {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
        }
        .vuu-chat-close {
            background: transparent;
            border: none;
            color: #ccc;
            font-size: 1.3rem;
            cursor: pointer;
            padding: 4px;
            line-height: 1;
        }
        .vuu-chat-close:hover {
            color: #fff;
        }
        .vuu-chat-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f7f9fa;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .vuu-msg {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 0.85rem;
            line-height: 1.4;
            word-wrap: break-word;
        }
        .vuu-msg-ai {
            background: #ffffff;
            color: #222;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            border: 1px solid #eaeaea;
        }
        .vuu-msg-user {
            background: #ffcc00;
            color: #111;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
            font-weight: 500;
        }
        .vuu-chat-input-bar {
            display: flex;
            padding: 12px;
            background: #ffffff;
            border-top: 1px solid #eee;
            gap: 8px;
        }
        .vuu-chat-input {
            flex: 1;
            border: 1px solid #ddd;
            border-radius: 20px;
            padding: 8px 16px;
            font-size: 0.85rem;
            outline: none;
            background: #fafafa;
        }
        .vuu-chat-input:focus {
            border-color: #ffcc00;
            background: #ffffff;
        }
        .vuu-chat-send {
            background: #111111;
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 34px;
            height: 34px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .vuu-chat-send:hover {
            background: #ffcc00;
            color: #111;
        }
        .typing-indicator {
            display: flex;
            gap: 4px;
            align-items: center;
            padding: 8px 12px;
        }
        .typing-dot {
            width: 6px;
            height: 6px;
            background: #aaa;
            border-radius: 50%;
            animation: typingBounce 1s infinite alternate;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
            from { transform: translateY(0); }
            to { transform: translateY(-4px); }
        }
    `;
    document.head.appendChild(style);

    // Initial structure
    root.innerHTML = `
        <div class="vuu-chat-trigger" id="vuu-chat-trigger-btn" title="Ask VUU AI">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </div>
        <div class="vuu-chat-window" id="vuu-chat-window-panel">
            <div class="vuu-chat-header">
                <div class="vuu-chat-header-info">
                    <span class="vuu-chat-header-title">VUU AI assistant</span>
                    <span class="vuu-chat-header-status">
                        <span class="vuu-chat-header-pulse"></span> English / Kinyarwanda
                    </span>
                </div>
                <button class="vuu-chat-close" id="vuu-chat-close-btn">&times;</button>
            </div>
            <div class="vuu-chat-messages" id="vuu-chat-messages-container">
                <div class="vuu-msg vuu-msg-ai">
                    👋 <strong>Muraho / Hello!</strong><br>
                    I am VUU AI, your transit guide. You can ask me schedules, prices, or route bookings in English and Kinyarwanda!<br><br>
                    <em>E.g., "Mwakwaka bus igana i Musanze?" or "How much does Huye travel ticket cost?"</em>
                </div>
            </div>
            <form class="vuu-chat-input-bar" id="vuu-chat-form">
                <input type="text" class="vuu-chat-input" id="vuu-chat-input-field" placeholder="Ask VUU Assistant..." required autocomplete="off">
                <button type="submit" class="vuu-chat-send">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    `;

    // Interactive Node Queries
    const triggerBtn = document.getElementById('vuu-chat-trigger-btn');
    const windowPanel = document.getElementById('vuu-chat-window-panel');
    const closeBtn = document.getElementById('vuu-chat-close-btn');
    const formElement = document.getElementById('vuu-chat-form');
    const inputField = document.getElementById('vuu-chat-input-field');
    const msgsContainer = document.getElementById('vuu-chat-messages-container');

    let historyLog = [];

    // Toggles
    triggerBtn.addEventListener('click', () => {
        windowPanel.style.display = 'flex';
        triggerBtn.style.display = 'none';
        inputField.focus();
    });

    closeBtn.addEventListener('click', () => {
        windowPanel.style.display = 'none';
        triggerBtn.style.display = 'flex';
    });

    // Handle Submit
    formElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const queryText = inputField.value.trim();
        if (!queryText) return;

        // Clear input
        inputField.value = '';

        // Render User Message
        appendMessage(queryText, 'user');

        // Render AI Typing Indicator
        const typingIndicator = showTypingIndicator();

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: queryText,
                    history: historyLog
                })
            });

            const data = await res.json();
            
            // Remove indicator
            typingIndicator.remove();

            if (data.status === 'success' && data.reply) {
                appendMessage(data.reply, 'ai');
                historyLog.push({ role: 'user', text: queryText });
                historyLog.push({ role: 'ai', text: data.reply });
                
                // Keep history size sane
                if (historyLog.length > 20) {
                    historyLog.shift();
                    historyLog.shift();
                }
            } else {
                appendMessage("I ran into an issue contacting my AI brain. Please try again! 🙏", 'ai');
            }
        } catch (err) {
            typingIndicator.remove();
            appendMessage("Unable to reach VUU servers. Please ensure you are online.", 'ai');
        }
    });

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `vuu-msg vuu-msg-${sender}`;
        
        // Parse basic markdown formatting if returned
        // Escape raw HTML inside reply to prevent script injections
        const cleanText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        msgDiv.innerHTML = cleanText.replace(/\n/g, '<br>');
        
        msgsContainer.appendChild(msgDiv);
        msgsContainer.scrollTop = msgsContainer.scrollHeight;
    }

    function showTypingIndicator() {
        const ind = document.createElement('div');
        ind.className = 'vuu-msg vuu-msg-ai typing-indicator';
        ind.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        msgsContainer.appendChild(ind);
        msgsContainer.scrollTop = msgsContainer.scrollHeight;
        return ind;
    }
})();
