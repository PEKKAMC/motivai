const categorySelection = document.getElementById('category-selection');
const goalSetting = document.getElementById('goal-setting');
const chatInterface = document.getElementById('chat-interface');
const selectedCategoryTitle = document.getElementById('selected-category-title');
const suggestedGoalsContainer = document.getElementById('suggested-goals');
const premiumBanner = document.getElementById('premium-banner');

let currentCategory = 0;
let currentCategoryName = "";

// Return to home
function returnToHome() {
    goalSetting.classList.add('hidden');
    chatInterface.classList.add('hidden');

    categorySelection.classList.remove('hidden');

    premiumBanner.classList.remove('hidden');
}

// Sample goals for demonstration
const goalData = {
    1: ["Bỏ thuốc lá", "Giảm thời gian dùng mạng xã hội", "Ngừng ăn vặt sau 21h"], // Cai nghiện vật lý
    2: ["Tập thể dục 30 phút/ngày", "Uống đủ 4 cốc nước", "Tự học chuyên môn 1 giờ/ngày"], // Xây dựng thói quen
    3: ["Nói chuyện với người lạ 1 lần/tuần", "Kiểm soát cơn giận 5s trước khi phản ứng", "Viết nhật ký biết ơn"], // Thay đổi tâm trí
    4: ["Chỉ cần lắng nghe tớ thôi", "Tớ đang rất buồn", "Tớ muốn thoát khỏi cảm giác này"], // Hỗ trợ tinh thần
};

function selectCategory(categoryId, categoryName) {
    currentCategory = categoryId;
    currentCategoryName = categoryName;

    // Update UI elements
    selectedCategoryTitle.textContent = `${categoryId}. ${categoryName}`;

    // Clear previous goals
    suggestedGoalsContainer.innerHTML = '';

    // Populate suggested goals
    const goals = goalData[categoryId] || [];
    goals.forEach(goal => {
        const button = document.createElement('button');
        button.className = 'goal-button p-3 text-sm rounded-xl font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition shadow-sm';
        button.textContent = goal;
        suggestedGoalsContainer.appendChild(button);
    });

    // Add 'Other' option
    const otherButton = document.createElement('button');
    otherButton.className = 'p-3 text-sm rounded-xl font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition shadow-sm';
    otherButton.textContent = 'Khác (Tự điền)';
    suggestedGoalsContainer.appendChild(otherButton);


    // Transition to Goal Setting Screen
    categorySelection.classList.add('hidden');
    goalSetting.classList.remove('hidden');

    // Hide Premium Banner
    premiumBanner.classList.add('hidden');
}

function startChat() {
    // This function simulates starting the actual chat interface
    goalSetting.classList.add('hidden');
    chatInterface.classList.remove('hidden');

    // Hide Premium Banner
    premiumBanner.classList.add('hidden');
}

// Initialize the view state
window.onload = () => {
     // Ensure initial focus is on the category selection
     categorySelection.classList.remove('hidden');
     goalSetting.classList.add('hidden');
     chatInterface.classList.add('hidden');
}