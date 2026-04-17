// Initialize Lucide icons
lucide.createIcons();

// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatForm = document.getElementById('chatForm');
const messagesContainer = document.getElementById('messagesContainer');
const usageCount = document.getElementById('usageCount');
const usageFill = document.getElementById('usageFill');
const newChatBtn = document.getElementById('newChatBtn');
const currentChatTitle = document.getElementById('currentChatTitle');

// File Attachments
const attachmentBtn = document.getElementById('attachmentBtn');
const fileInput = document.getElementById('fileInput');
const fileAttachmentPreview = document.getElementById('fileAttachmentPreview');
const attachedFileName = document.getElementById('attachedFileName');
const removeAttachmentBtn = document.getElementById('removeAttachmentBtn');

// Modals & Sidebar
const pricingModal = document.getElementById('pricingModal');
const openPricingBtn = document.getElementById('openPricingBtn');
const closePricingBtn = document.getElementById('closePricingBtn');
const pricingView = document.getElementById('pricingView');
const checkoutView = document.getElementById('checkoutView');
const showCheckoutBtn = document.getElementById('showCheckoutBtn');
const cancelCheckoutBtn = document.getElementById('cancelCheckoutBtn');
const checkoutForm = document.getElementById('checkoutForm');
const submitPaymentBtn = document.getElementById('submitPaymentBtn');

const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('openSidebarBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');

// State - Persisted via localStorage
let messageCount = parseInt(localStorage.getItem('study_bot_message_count') || '0', 10);
const MAX_FREE_MESSAGES = 50;
let isPro = localStorage.getItem('study_bot_is_pro') === 'true';

let sessions = JSON.parse(localStorage.getItem('study_bot_sessions')) || [];

let currentAttachedFile = null;

function saveCurrentSession() {
    if (messagesContainer.querySelectorAll('.user-message').length > 0) {
        sessions.push({
            id: Date.now(),
            title: currentChatTitle.textContent,
            html: messagesContainer.innerHTML
        });
        localStorage.setItem('study_bot_sessions', JSON.stringify(sessions));
    }
}

function renderSidebar() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<p class="section-title">Recent Chats</p>';
    
    // Add current session (active)
    const currentDiv = document.createElement('div');
    currentDiv.className = 'history-item active';
    currentDiv.innerHTML = `<i data-lucide="message-square"></i><span>${currentChatTitle.textContent}</span>`;
    historyList.appendChild(currentDiv);

    // Add past sessions
    [...sessions].reverse().forEach(session => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'history-item-content';
        contentDiv.innerHTML = `<i data-lucide="message-square"></i><span>${session.title}</span>`;
        contentDiv.onclick = () => {
            saveCurrentSession(); // Save current before switching
            messagesContainer.innerHTML = session.html;
            currentChatTitle.textContent = session.title;
            // Remove it from sessions array so it becomes the active one
            sessions = sessions.filter(s => s.id !== session.id);
            localStorage.setItem('study_bot_sessions', JSON.stringify(sessions));
            renderSidebar();
            if(window.innerWidth <= 768) sidebar.classList.remove('open');
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-chat-btn';
        deleteBtn.innerHTML = `<i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>`;
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            sessions = sessions.filter(s => s.id !== session.id);
            localStorage.setItem('study_bot_sessions', JSON.stringify(sessions));
            renderSidebar();
        };

        div.appendChild(contentDiv);
        div.appendChild(deleteBtn);
        historyList.appendChild(div);
    });
    lucide.createIcons();
}

// File Attachment Logic
attachmentBtn.addEventListener('click', () => {
    if (!isPro) {
        pricingModal.classList.add('active');
        return;
    }
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Only accept text files for client-side processing
        if (file.size > 1024 * 500) { // Limit to 500kb
            alert("File is too large! Please upload text documents under 500KB.");
            fileInput.value = '';
            return;
        }
        currentAttachedFile = file;
        attachedFileName.textContent = file.name;
        fileAttachmentPreview.style.display = 'flex';
        lucide.createIcons();
        sendBtn.removeAttribute('disabled');
    }
});

removeAttachmentBtn.addEventListener('click', () => {
    currentAttachedFile = null;
    fileInput.value = '';
    fileAttachmentPreview.style.display = 'none';
    if (messageInput.value.trim() === '') {
        sendBtn.setAttribute('disabled', 'true');
    }
});

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (this.value.trim() !== '') {
        sendBtn.removeAttribute('disabled');
    } else {
        sendBtn.setAttribute('disabled', 'true');
    }
});

messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (this.value.trim() !== '') {
            chatForm.dispatchEvent(new Event('submit'));
        }
    }
});

function updateUsage() {
    localStorage.setItem('study_bot_message_count', messageCount);
    localStorage.setItem('study_bot_is_pro', isPro);

    if (isPro) {
        usageCount.textContent = 'Unlimited';
        usageFill.style.width = '100%';
        usageFill.style.background = 'var(--success)';
        messageInput.removeAttribute('disabled');
        messageInput.placeholder = "Ask a question (e.g. 'powerhouse of the cell')...";
        openPricingBtn.style.display = 'none';
        return;
    }
    
    usageCount.textContent = `${messageCount} / ${MAX_FREE_MESSAGES}`;
    const percentage = (messageCount / MAX_FREE_MESSAGES) * 100;
    usageFill.style.width = `${percentage}%`;
    
    if (percentage > 80) {
        usageFill.style.background = 'var(--danger)';
    } else {
        usageFill.style.background = 'var(--primary)';
    }

    if (messageCount >= MAX_FREE_MESSAGES) {
        messageInput.setAttribute('disabled', 'true');
        messageInput.placeholder = "Free messages exhausted. Upgrade to Pro.";
        pricingModal.classList.add('active');
    } else {
        messageInput.removeAttribute('disabled');
        messageInput.placeholder = "Ask a question (e.g. 'powerhouse of the cell')...";
    }
}

function addMessage(content, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`;
    
    if (isUser) {
        avatarDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
    } else {
        avatarDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>';
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    if (typeof marked !== 'undefined') {
        contentDiv.innerHTML = marked.parse(content);
    } else {
        contentDiv.innerHTML = `<p>${content.replace(/\n/g, '<br>')}</p>`;
    }
    
    msgDiv.appendChild(avatarDiv);
    msgDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai-message typing-msg';
    msgDiv.id = 'typingIndicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar ai-avatar';
    avatarDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    msgDiv.appendChild(avatarDiv);
    msgDiv.appendChild(contentDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const text = messageInput.value.trim();
    if (!text && !currentAttachedFile) return;
    
    if (!isPro && messageCount >= MAX_FREE_MESSAGES) {
        pricingModal.classList.add('active');
        return;
    }
    
    if (messagesContainer.querySelectorAll('.user-message').length === 0 && text.length > 5) {
        currentChatTitle.textContent = text.substring(0, 20) + (text.length > 20 ? '...' : '');
        renderSidebar();
    }

    let finalPrompt = text;
    let displayMessage = text;

    if (currentAttachedFile) {
        try {
            const fileContent = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsText(currentAttachedFile);
            });
            // Truncate to prevent breaking the URL length limit (Pollinations uses GET requests)
            finalPrompt = `Document Name: ${currentAttachedFile.name}\nDocument Content:\n"""\n${fileContent.substring(0, 1500)}\n"""\n\nUser Question: ${text}`;
            displayMessage = `*(Attached File: ${currentAttachedFile.name})*\n\n${text}`;
        } catch (err) {
            console.error("Could not read file", err);
        }
        
        currentAttachedFile = null;
        fileInput.value = '';
        fileAttachmentPreview.style.display = 'none';
    }

    addMessage(displayMessage, true);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendBtn.setAttribute('disabled', 'true');
    
    if (!isPro) {
        messageCount++;
        updateUsage();
    }
    
    showTypingIndicator();

    try {
        const prompt = `You are a concise and intelligent study tutor. Provide a clear, accurate, and direct answer to: ${finalPrompt}. Format your response nicely using markdown, but avoid unnecessary overly verbose steps unless asked. DO NOT use LaTeX formatting, brackets, or curly braces for math. Write math simply and normally like 3+4=7.`;
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);

        if (!response.ok) throw new Error('Pollinations API Request Failed');

        const aiText = await response.text();
        removeTypingIndicator();
        
        if (aiText && aiText.length > 0) {
            addMessage(aiText, false);
        } else {
            throw new Error('Empty response from Pollinations');
        }
        
    } catch (error) {
        try {
            const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=5&explaintext=1&generator=search&gsrsearch=${encodeURIComponent(text || "general")}&gsrlimit=1&format=json&origin=*`);
            const data = await wikiRes.json();
            
            removeTypingIndicator();
            if (data.query && data.query.pages) {
                const pages = data.query.pages;
                const topPageId = Object.keys(pages)[0];
                const topResult = pages[topPageId];
                
                if (topResult.extract) {
                    addMessage(`**${topResult.title}**\n\n${topResult.extract}`, false);
                } else {
                    addMessage(`I found a topic on **${topResult.title}**, but it didn't have a clear summary. Try asking a more specific question.`, false);
                }
            } else {
                addMessage("Hmm, I couldn't find a factual answer for that in my study database. Could you try asking in a different way?", false);
            }
        } catch (wikiError) {
            removeTypingIndicator();
            console.error(error);
            addMessage("Sorry, I had trouble connecting to my knowledge base. Please try again later.", false);
        }
    }
});

// New Chat Logic
newChatBtn.addEventListener('click', () => {
    saveCurrentSession();
    messagesContainer.innerHTML = `
        <div class="message ai-message">
            <div class="avatar ai-avatar"><i data-lucide="bot"></i></div>
            <div class="message-content">
                <p>Hello! I'm your Study Tutor. I'm connected to the world's largest open knowledge base. Ask me any factual study questions!</p>
            </div>
        </div>
    `;
    currentChatTitle.textContent = "New Study Session";
    renderSidebar();
    if(window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
});

// Modal & Checkout Logic
openPricingBtn.addEventListener('click', () => {
    pricingView.style.display = 'block';
    checkoutView.style.display = 'none';
    pricingModal.classList.add('active');
});

closePricingBtn.addEventListener('click', () => {
    pricingModal.classList.remove('active');
});

pricingModal.addEventListener('click', (e) => {
    if (e.target === pricingModal) pricingModal.classList.remove('active');
});

showCheckoutBtn.addEventListener('click', () => {
    pricingView.style.display = 'none';
    checkoutView.style.display = 'block';
});

cancelCheckoutBtn.addEventListener('click', () => {
    checkoutView.style.display = 'none';
    pricingView.style.display = 'block';
});

checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitPaymentBtn.textContent = 'Processing Payment...';
    submitPaymentBtn.setAttribute('disabled', 'true');
    
    setTimeout(() => {
        isPro = true;
        updateUsage();
        submitPaymentBtn.textContent = 'Payment Successful! Redirecting...';
        submitPaymentBtn.style.background = 'var(--success)';
        
        setTimeout(() => {
            pricingModal.classList.remove('active');
            addMessage("Thank you for subscribing to Pro! You now have unlimited study queries.", false);
        }, 1500);
    }, 2000);
});

// Mobile Sidebar
openSidebarBtn.addEventListener('click', () => sidebar.classList.add('open'));
closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));

// Initial Setup
renderSidebar();
updateUsage();
