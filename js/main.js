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

// --- Configuration ---
// Map ID to the string key expected by Flask (habit, study, emotion)
const CATEGORY_MAP = {
    1: 'habit',   // Cai Nghiện Vật Lý (treat as 'habit' for tiny steps)
    2: 'habit',   // Xây Dựng Thói Quen
    3: 'emotion', // Thay đổi Tâm Trí/Hành vi (closest to 'emotion' or 'study')
    4: 'emotion'  // Hỗ trợ Tinh thần Khẩn cấp
    // Note: The backend uses 'habit', 'study', 'emotion'. We'll use 'habit' and 'emotion' here.
};
const BACKEND_URL = "http://localhost:8000"; // 🛑 CHANGE THIS if your backend is on a different host/port!

// --- State ---
let currentCategoryId = 0;
let currentCategoryName = "";
let currentCategoryKey = ""; // The key sent to the backend (e.g., 'habit')

// --- Utility Functions ---

function displayMessage(text, isUser) {
    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
    const messageBox = document.createElement('div');
    messageBox.className = isUser
        ? 'bg-blue-500 text-white p-4 rounded-3xl rounded-br-none max-w-xs shadow-md'
        : 'bg-indigo-100 text-indigo-800 p-4 rounded-3xl rounded-bl-none max-w-xs shadow-sm';

    messageBox.innerHTML = `<p class="font-medium">${text}</p>`;
    if (!isUser) {
        messageBox.innerHTML += `<p class="text-xs mt-2 text-indigo-600">MOTIVAI</p>`;
    }

    div.appendChild(messageBox);
    chatMessagesContainer.appendChild(div);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll to bottom
}

function showLoading(show) {
    if (show) {
        // Find or create a loading indicator
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
    // Disable input while loading
    chatInput.disabled = show;
    sendButton.disabled = show;
}

// --- API Call Function (The Fix) ---

async function sendMessage(userMessage) {
    if (!userMessage.trim()) return;

    displayMessage(userMessage, true);
    showLoading(true);

    chatInput.value = ''; // Clear input field

    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, { // ✅ FIX 1: Corrected URL path
            method: 'POST', // ✅ FIX 2: Corrected HTTP Method
            headers: {
                'Content-Type': 'application/json' // ✅ FIX 3: Required Header
            },
            body: JSON.stringify({
                message: userMessage,
                // Use the string key expected by the backend
                category: currentCategoryKey // ✅ FIX 4: Send the correct category key
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error ${response.status}: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();

        // Handle successful reply
        displayMessage(data.reply, false);

    } catch (error) {
        console.error("Lỗi khi gọi API:", error);
        displayMessage("Xin lỗi, mình đang gặp sự cố kỹ thuật. Vui lòng thử lại sau!", false);
    } finally {
        showLoading(false);
    }
}


// --- UI Transition Functions ---

function returnToHome() {
    goalSetting.classList.add('hidden');
    chatInterface.classList.add('hidden');
    categorySelection.classList.remove('hidden');
    premiumBanner.classList.remove('hidden');
}

const goalData = { /* ... (Your existing goalData object) ... */
    1: ["Bỏ thuốc lá", "Giảm thời gian dùng mạng xã hội", "Ngừng ăn vặt sau 21h"],
    2: ["Tập thể dục 30 phút/ngày", "Uống đủ 4 cốc nước", "Tự học chuyên môn 1 giờ/ngày"],
    3: ["Nói chuyện với người lạ 1 lần/tuần", "Kiểm soát cơn giận 5s trước khi phản ứng", "Viết nhật ký biết ơn"],
    4: ["Chỉ cần lắng nghe tớ thôi", "Tớ đang rất buồn", "Tớ muốn thoát khỏi cảm giác này"],
};

function selectCategory(categoryId, categoryName) {
    currentCategoryId = categoryId;
    currentCategoryName = categoryName;
    currentCategoryKey = CATEGORY_MAP[categoryId]; // Set the key for API call

    // Clear and populate goals (Your existing logic)
    selectedCategoryTitle.textContent = `${categoryId}. ${categoryName}`;
    suggestedGoalsContainer.innerHTML = '';
    const goals = goalData[categoryId] || [];
    goals.forEach(goal => {
        const button = document.createElement('button');
        button.className = 'goal-button p-3 text-sm rounded-xl font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition shadow-sm';
        button.textContent = goal;
        button.onclick = () => { customGoalTextarea.value = goal; }; // Set goal on click
        suggestedGoalsContainer.appendChild(button);
    });
    const otherButton = document.createElement('button');
    otherButton.className = 'p-3 text-sm rounded-xl font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition shadow-sm';
    otherButton.textContent = 'Khác (Tự điền)';
    suggestedGoalsContainer.appendChild(otherButton);

    // Transition to Goal Setting Screen
    categorySelection.classList.add('hidden');
    goalSetting.classList.remove('hidden');
    premiumBanner.classList.add('hidden');
}

function showChatInterface() {
    // Check if the user has entered a goal from the textarea
    const goalMessage = customGoalTextarea.value.trim();

    if (goalMessage === "") {
        alert("Vui lòng nhập mục tiêu của bạn để bắt đầu.");
        return;
    }

    // Clear initial messages and display the user's first message
    chatMessagesContainer.innerHTML = '';
    displayMessage(`Chào bạn! Tớ là MOTIVAI. Vấn đề mà bạn đang muốn giải quyết là gì? Tớ ở đây để lắng nghe và đồng hành cùng bạn. (Chủ đề: ${currentCategoryName})`, false);

    // Call API with the initial goal message
    sendMessage(goalMessage);

    // UI transition
    goalSetting.classList.add('hidden');
    chatInterface.classList.remove('hidden');
    premiumBanner.classList.add('hidden');
}

// Attach event listeners after the DOM is loaded
window.onload = () => {
    // Existing initial view state logic
    categorySelection.classList.remove('hidden');
    goalSetting.classList.add('hidden');
    chatInterface.classList.add('hidden');

    // Attach listener to the main "Start Chat" button on the Goal Setting screen
    document.querySelector('#goal-setting button').onclick = showChatInterface;

    // Attach listener to the send button inside the chat interface
    sendButton.addEventListener('click', () => {
        const message = chatInput.value;
        if (message) {
            sendMessage(message);
        }
    });

    // Allow sending message by pressing Enter
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value;
            if (message) {
                sendMessage(message);
            }
        }
    });

    // Make functions globally accessible (since they are referenced in HTML onclick)
    window.returnToHome = returnToHome;
    window.selectCategory = selectCategory;
    window.showChatInterface = showChatInterface; // Renamed from startChat
}