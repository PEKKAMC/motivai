const user = localStorage.getItem("loggedInUser");

if (!user) {
    // User is NOT logged in. Redirect to login page.
    window.location.href = "../login";
}

const categorySelection = document.getElementById('category-selection');
const goalSetting = document.getElementById('goal-setting');
const chatInterface = document.getElementById('chat-interface');
const selectedCategoryTitle = document.getElementById('selected-category-title');
const suggestedGoalsContainer = document.getElementById('suggested-goals');
const premiumBanner = document.getElementById('premium-banner');
const chatMessagesContainer = document.querySelector('#chat-interface .flex-1.overflow-y-auto');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const customGoalTextarea = document.getElementById('custom-goal');
const menuToggleButton = document.getElementById('menu-toggle-button');
const menuOverlay = document.getElementById('menu-overlay');
const slideMenu = document.getElementById('slide-menu');
const menuCloseButton = document.getElementById('menu-close-button');

// Configuration
const CATEGORY_MAP = {
    1: 'habit',
    2: 'habit',
    3: 'emotion'
};
const BACKEND_URL = "http://localhost:8000";

// State
let currentCategoryId = 0;
let currentCategoryName = "";
let currentCategoryKey = "";
let chatHistory = [];

function displayMessage(text, isUser) {
    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
    const messageBox = document.createElement('div');
    messageBox.className = isUser
        ? 'bg-blue-500 text-white p-4 rounded-3xl rounded-br-none max-w-xs shadow-md'
        : 'bg-indigo-100 text-indigo-800 p-4 rounded-3xl rounded-bl-none max-w-xs shadow-sm';

    const formattedText = text.replace(/\n/g, '<br>');

    messageBox.innerHTML = `<p class="font-medium">${formattedText}</p>`;
    if (!isUser) {
        messageBox.innerHTML += `<p class="text-xs mt-2 text-indigo-600">MOTIVAI</p>`;
    }

    div.appendChild(messageBox);
    chatMessagesContainer.appendChild(div);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function showLoading(show) {
    if (show) {
        let loader = document.getElementById('loader-motivai');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loader-motivai';
            loader.className = 'flex justify-start';
            loader.innerHTML = `
                <div class="bg-indigo-100 text-indigo-800 p-4 rounded-3xl rounded-bl-none max-w-xs shadow-sm">
                    <p>MOTIVAI đang nghĩ... ⏳</p>
                </div>
            `;
            chatMessagesContainer.appendChild(loader);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    } else {
        const loader = document.getElementById('loader-motivai');
        if (loader) {
            loader.remove();
        }
    }
    chatInput.disabled = show;
    sendButton.disabled = show;
}

// API Call Function

async function sendMessage(userMessage) {
    if (!userMessage.trim()) return;

    displayMessage(userMessage, true);
    showLoading(true);

    chatInput.value = '';

    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMessage,
                category: currentCategoryKey,
                history: chatHistory // Send previous history
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error ${response.status}: ${errorData.error || 'Unknown error'}`);
        }
        const data = await response.json();
        chatHistory.push({ role: "user", parts: [userMessage] });
        chatHistory.push({ role: "model", parts: [data.reply] });

        displayMessage(data.reply, false);

    } catch (error) {
        console.error("Lỗi khi gọi API:", error);
        displayMessage("Xin lỗi, mình đang gặp sự cố kỹ thuật. Vui lòng thử lại sau!", false);
    } finally {
        showLoading(false);
    }
}


// UI Transition Functions

function returnToHome() {
    goalSetting.classList.add('hidden');
    chatInterface.classList.add('hidden');
    categorySelection.classList.remove('hidden');
    premiumBanner.classList.remove('hidden');
}

const goalData = {
    1: ["Giảm nước ngọt có ga", "Giảm thời gian dùng mạng xã hội", "Ngừng ăn vặt sau 21h", "Ăn hoa quả hằng ngày"],
    2: ["Tập thể dục 30 phút/ngày", "Uống đủ 4 cốc nước", "Tự học chuyên môn 1 giờ/ngày", "Thiền mỗi ngày"],
    3: ["Nói chuyện với người lạ 1 lần/tuần", "Kiểm soát cơn giận 5s trước khi phản ứng", "Viết nhật ký biết ơn", "Ra ngoài giao lưu thể thao mỗi tuần"]
};

function selectCategory(categoryId, categoryName) {
    currentCategoryId = categoryId;
    currentCategoryName = categoryName;
    currentCategoryKey = CATEGORY_MAP[categoryId];
    chatHistory = [];


    selectedCategoryTitle.textContent = `${categoryId}. ${categoryName}`;
    suggestedGoalsContainer.innerHTML = '';
    const goals = goalData[categoryId] || [];
    goals.forEach(goal => {
        const button = document.createElement('button');
        button.className = 'goal-button p-3 text-sm rounded-xl font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition shadow-sm';
        button.textContent = goal;

        button.onclick = () => {
            customGoalTextarea.value = goal;
            showChatInterface();
        };

        suggestedGoalsContainer.appendChild(button);
    });

    categorySelection.classList.add('hidden');
    goalSetting.classList.remove('hidden');
    premiumBanner.classList.add('hidden');
}

function showChatInterface() {
    const goalMessage = customGoalTextarea.value.trim();

    if (goalMessage === "") {
        alert("Vui lòng nhập mục tiêu của bạn để bắt đầu.");
        return;
    }

    chatMessagesContainer.innerHTML = '';
    displayMessage(`Chào bạn! Tớ là MOTIVAI. Vấn đề mà bạn đang muốn giải quyết là gì? Tớ ở đây để lắng nghe và đồng hành cùng bạn. (Chủ đề: ${currentCategoryName})`, false);

    sendMessage(goalMessage);

    goalSetting.classList.add('hidden');
    chatInterface.classList.remove('hidden');
    premiumBanner.classList.add('hidden');
}

function openMenu() {
    if (menuOverlay) menuOverlay.classList.remove('hidden');
    if (slideMenu) {
        slideMenu.classList.remove('hidden');
        requestAnimationFrame(() => {
            slideMenu.classList.remove('-translate-x-full');
            slideMenu.classList.add('translate-x-0');
        });
    }
}

function closeMenu() {
    if (menuOverlay) menuOverlay.classList.add('hidden');
    if (slideMenu) {
        slideMenu.classList.add('-translate-x-full');
        slideMenu.classList.remove('translate-x-0');
        setTimeout(() => {
            slideMenu.classList.add('hidden');
        }, 300);
    }
}

function logout() {
    localStorage.removeItem("loggedInUser");
}

window.onload = () => {
    categorySelection.classList.remove('hidden');
    goalSetting.classList.add('hidden');
    chatInterface.classList.add('hidden');

    sendButton.addEventListener('click', () => {
        const message = chatInput.value;
        if (message) {
            sendMessage(message);
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value;
            if (message) {
                sendMessage(message);
            }
        }
    });

    if (menuToggleButton) {
        menuToggleButton.addEventListener('click', openMenu);
    }
    if (menuCloseButton) {
        menuCloseButton.addEventListener('click', closeMenu);
    }
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }

    window.returnToHome = returnToHome;
    window.selectCategory = selectCategory;
    window.showChatInterface = showChatInterface;
}