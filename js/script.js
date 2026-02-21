// js/script.js

// --- Mock Database ---
let users = JSON.parse(localStorage.getItem('mhd_users')) || [];
let tweets = JSON.parse(localStorage.getItem('mhd_tweets')) || [];

// Depression/Anxiety related keywords for detection
const negativeKeywords = ["sad", "depressed", "hopeless", "anxiety", "lonely", "suicide", "kill myself", "unhappy", "crying", "pain", "hurt", "dying", "tired", "worthless"];

// --- Utility Functions ---
function saveData() {
    localStorage.setItem('mhd_users', JSON.stringify(users));
    localStorage.setItem('mhd_tweets', JSON.stringify(tweets));
}

function analyzeContent(text) {
    const lowerText = text.toLowerCase();
    const found = negativeKeywords.filter(keyword => lowerText.includes(keyword));
    return {
        isAbnormal: found.length > 0,
        keywordsFound: found
    };
}

function generateAvatar(name) {
    return name ? name.charAt(0).toUpperCase() : 'U';
}

// --- Page Logic ---

// 1. Registration
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const gender = document.getElementById('gender').value;
        const country = document.getElementById('country').value;

        if (users.find(u => u.email === email)) {
            alert("User already exists!");
            return;
        }

        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            gender,
            country,
            status: "normal"
        };

        users.push(newUser);
        saveData();
        alert("Registration Successful! Please login.");
        window.location.href = "index.html";
    });
}

// 2. Login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        if (role === 'admin') {
            if (email === "admin@gmail.com" && password === "admin") {
                window.location.href = "admin-panel.html";
            } else {
                alert("Invalid Admin Credentials");
            }
        } else {
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                localStorage.setItem('mhd_current_user', JSON.stringify(user));
                window.location.href = `user-home.html`;
            } else {
                alert("Invalid User Credentials");
            }
        }
    });
}

// 3. User Dashboard
if (document.getElementById('tweetForm')) {
    const currentUser = JSON.parse(localStorage.getItem('mhd_current_user'));
    
    if (!currentUser) {
        window.location.href = "index.html";
    } else {
        // Profile Setup
        document.getElementById('userName').innerText = currentUser.name;
        document.getElementById('userAvatar').innerText = generateAvatar(currentUser.name);
        
        const statusBadge = document.getElementById('statusBadge');
        if(currentUser.status === 'abnormal') {
            statusBadge.innerText = "Needs Attention";
            statusBadge.className = "status-badge status-abnormal";
        } else {
            statusBadge.innerText = "Stable";
            statusBadge.className = "status-badge status-normal";
        }

        // Post Tweet
        document.getElementById('tweetForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const content = document.getElementById('tweetContent').value;
            if (!content.trim()) return;

            const analysis = analyzeContent(content);

            const newTweet = {
                id: Date.now(),
                userId: currentUser.id,
                userName: currentUser.name,
                content: content,
                date: new Date().toLocaleString(),
                status: analysis.isAbnormal ? "abnormal" : "normal"
            };

            tweets.push(newTweet);
            
            if (analysis.isAbnormal) {
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) {
                    users[userIndex].status = "abnormal";
                    currentUser.status = "abnormal";
                    localStorage.setItem('mhd_current_user', JSON.stringify(currentUser));
                    statusBadge.innerText = "Needs Attention";
                    statusBadge.className = "status-badge status-abnormal";
                }
            }
            
            saveData();
            document.getElementById('tweetContent').value = '';
            loadTweets();
        });

        function loadTweets() {
            const feed = document.getElementById('tweetFeed');
            const userTweets = tweets.filter(t => t.userId === currentUser.id).reverse();
            
            let html = '';
            userTweets.forEach(t => {
                const cardClass = t.status === 'abnormal' ? 'tweet-card abnormal' : 'tweet-card';
                html += `
                    <div class="${cardClass}">
                        <div class="tweet-header">
                            <div class="avatar-sm">${generateAvatar(t.userName)}</div>
                            <div class="tweet-meta">
                                <div class="tweet-author">${t.userName}</div>
                                <div class="tweet-time">${t.date}</div>
                            </div>
                            <span class="analysis-tag ${t.status === 'abnormal' ? 'tag-danger' : 'tag-success'}">
                                ${t.status}
                            </span>
                        </div>
                        <div class="tweet-body">
                            <p>${t.content}</p>
                        </div>
                    </div>
                `;
            });
            feed.innerHTML = html;
        }
        
        loadTweets();
    }
}

// 4. Admin Panel
if (document.getElementById('adminUserTable')) {
    
    // Stats Calculation
    const totalUsers = users.length;
    const totalTweets = tweets.length;
    const abnormalTweets = tweets.filter(t => t.status === 'abnormal').length;
    const normalTweets = totalTweets - abnormalTweets;

    document.getElementById('statUsers').innerText = totalUsers;
    document.getElementById('statTweets').innerText = totalTweets;
    document.getElementById('statAbnormal').innerText = abnormalTweets;

    // User Table
    const userTableBody = document.getElementById('adminUserTable');
    let userHtml = '';
    users.forEach(u => {
        const statusClass = u.status === 'abnormal' ? 'tag-danger' : 'tag-success';
        userHtml += `
            <tr>
                <td>#${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.country}</td>
                <td><span class="analysis-tag ${statusClass}">${u.status}</span></td>
            </tr>
        `;
    });
    userTableBody.innerHTML = userHtml;

    // Tweet Table
    const tweetTableBody = document.getElementById('adminTweetTable');
    let tweetHtml = '';
    tweets.slice().reverse().forEach(t => {
        const statusClass = t.status === 'abnormal' ? 'tag-danger' : 'tag-success';
        tweetHtml += `
            <tr>
                <td>#${t.id}</td>
                <td>${t.userName}</td>
                <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.content}</td>
                <td>${t.date}</td>
                <td><span class="analysis-tag ${statusClass}">${t.status}</span></td>
            </tr>
        `;
    });
    tweetTableBody.innerHTML = tweetHtml;

    // Simple Chart Drawing (using CSS/JS)
    const chartCanvas = document.getElementById('mentalHealthChart');
    if(chartCanvas && totalTweets > 0){
        const ctx = chartCanvas.getContext('2d');
        const width = chartCanvas.width;
        const height = chartCanvas.height;
        
        // Clear
        ctx.clearRect(0, 0, width, height);
        
        // Draw Normal Bar
        const normalHeight = (normalTweets / totalTweets) * (height - 40);
        ctx.fillStyle = "#1cc88a";
        ctx.fillRect(50, height - normalHeight - 40, 100, normalHeight);
        ctx.fillStyle = "#5a5c69";
        ctx.font = "12px Poppins";
        ctx.fillText("Normal", 70, height - 20);
        ctx.fillText(normalTweets, 80, height - normalHeight - 50);

        // Draw Abnormal Bar
        const abnormalHeight = (abnormalTweets / totalTweets) * (height - 40);
        ctx.fillStyle = "#e74a3b";
        ctx.fillRect(200, height - abnormalHeight - 40, 100, abnormalHeight);
        ctx.fillStyle = "#5a5c69";
        ctx.fillText("Abnormal", 210, height - 20);
        ctx.fillText(abnormalTweets, 235, height - abnormalHeight - 50);
    }
}