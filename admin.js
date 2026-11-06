// تخزين البيانات مؤقتًا في الذاكرة المحلية
let messages = [
    { id: 1, name: "مستخدم 1", email: "user1@example.com", message: "مرحبا! كيف حالك؟", type: "contact", date: "2026-11-06" },
    { id: 2, name: "مستخدم 2", email: "user2@example.com", message: "اقتراح جديد", type: "suggestion", date: "2026-11-05" }
];

let members = [
    { id: 1, name: "مستخدم 1", email: "user1@example.com", joined: "2026-11-01" },
    { id: 2, name: "مستخدم 2", email: "user2@example.com", joined: "2026-11-02" }
];

// حفظ الروابط
function saveLinks() {
    // هنا يمكنك حفظ الروابط في ملف أو قاعدة بيانات
    alert("تم حفظ الروابط بنجاح!");
}

// رفع الصور
function uploadImage() {
    // هنا يمكنك إضافة منطق لتخزين الصور على الخادم أو Firebase
    alert("تم رفع الصورة بنجاح!");
}

// تحميل الرسائل
function loadMessages() {
    // هنا يمكنك تحميل البيانات من قاعدة بيانات أو ملف
    loadMessagesFromLocal(); // استخدام تخزين مؤقت
}

// تحميل الأعضاء
function loadMembers() {
    // هنا يمكنك تحميل البيانات من قاعدة بيانات أو ملف
    loadMembersFromLocal(); // استخدام تخزين مؤقت
}

// إرسال الرسائل
function sendMessage() {
    // هنا يمكنك إرسال البيانات إلى قاعدة بيانات أو تخزين خارجي
    alert("تم إرسال الرسالة بنجاح!");
}

// تحميل البيانات من تخزين مؤقت
function loadMessagesFromLocal() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'card mb-2';
        messageElement.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${message.name}</h5>
                <p class="card-text">${message.message}</p>
                <p class="card-text"><small class="text-muted">${message.email}</small></p>
                <p class="card-text"><small class="text-muted">${message.type === 'contact' ? 'اتصال' : 'اقتراح'}</small></p>
                <p class="card-text"><small class="text-muted">${message.date}</small></p>
            </div>
        `;
        container.appendChild(messageElement);
    });
}

function loadMembersFromLocal() {
    const container = document.getElementById('membersContainer');
    container.innerHTML = '';
    members.forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'card mb-2';
        memberElement.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${member.name}</h5>
                <p class="card-text"><small class="text-muted">${member.email}</small></p>
                <p class="card-text"><small class="text-muted">تاريخ الانضمام: ${member.joined}</small></p>
            </div>
        `;
        container.appendChild(memberElement);
    });
}