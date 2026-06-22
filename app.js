// ===== 應用程式核心 =====

// Google Apps Script Web App URL（使用者提供 - 最新）
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwYAmsYSec-MrW4DHyh3nYYd64VK153o1BnjEciV46ce8xXNRJ5EqxuOLkmOwr3W2hG/exec';

class VocabMaster {
    constructor() {
        this.words = this.loadFromStorage();
        this.currentIndex = 0;
        this.isFlipped = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderWordsList();
        this.updateHomePageDisplay();
    }

    // ===== 事件監聽器設置 =====
    setupEventListeners() {
        // 導航按鈕
        document.getElementById('homeBtn').addEventListener('click', () => this.navigateTo('home'));
        document.getElementById('manageBtn').addEventListener('click', () => this.navigateTo('manage'));

        // 卡片翻頁
        document.getElementById('card').addEventListener('click', () => this.toggleCard());

        // 卡片導航
        document.getElementById('prevBtn').addEventListener('click', () => this.previousWord());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextWord());

        // 表單提交
        document.getElementById('addWordForm').addEventListener('submit', (e) => this.handleAddWord(e));

        // 自動填入按鈕
        document.getElementById('autoFillBtn').addEventListener('click', () => this.autoFillWord());
    }

    // ===== 導航功能 =====
    navigateTo(page) {
        // 隱藏所有頁面
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        // 顯示指定頁面
        if (page === 'home') {
            document.getElementById('homePage').classList.add('active');
            document.getElementById('homeBtn').classList.add('active');
            this.isFlipped = false;
            this.updateHomePageDisplay();
        } else if (page === 'manage') {
            document.getElementById('managePage').classList.add('active');
            document.getElementById('manageBtn').classList.add('active');
        }
    }

    // ===== 卡片翻頁功能 =====
    toggleCard() {
        const card = document.getElementById('card');
        this.isFlipped = !this.isFlipped;
        if (this.isFlipped) {
            card.classList.add('flipped');
        } else {
            card.classList.remove('flipped');
        }
    }

    // ===== 更新首頁顯示 =====
    updateHomePageDisplay() {
        const card = document.getElementById('card');
        card.classList.remove('flipped');
        this.isFlipped = false;

        if (this.words.length === 0) {
            document.getElementById('wordDisplay').textContent = 'No Words';
            document.getElementById('translationDisplay').textContent = '還沒有新增任何單字';
            document.getElementById('cardCounter').textContent = '0/0';
            document.getElementById('progressBar').style.width = '0%';
            document.getElementById('totalWords').textContent = '0';
            return;
        }

        const word = this.words[this.currentIndex];
        this.displayWord(word);

        // 更新計數器
        document.getElementById('cardCounter').textContent = 
            `${this.currentIndex + 1}/${this.words.length}`;

        // 更新進度條
        const progress = ((this.currentIndex + 1) / this.words.length) * 100;
        document.getElementById('progressBar').style.width = progress + '%';

        // 更新統計
        document.getElementById('totalWords').textContent = this.words.length;
    }

    // ===== 顯示單字 =====rtrfsdfsdfsdfdsf
    displayWord(word) {
        document.getElementById('wordDisplay').textContent = word.word;
        document.getElementById('translationDisplay').textContent = word.translation;
        document.getElementById('partOfSpeechDisplay').textContent = 
            word.partOfSpeech ? `詞性: ${word.partOfSpeech}` : '';
        document.getElementById('exampleDisplay').textContent = 
            word.example ? `例句: ${word.example}` : '';
        document.getElementById('etymologyDisplay').textContent = 
            word.etymology ? `字根: ${word.etymology}` : '';
    }

    // ===== 上一個單字 =====
    previousWord() {
        if (this.words.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.words.length) % this.words.length;
        this.updateHomePageDisplay();
    }

    // ===== 下一個單字 =====
    nextWord() {
        if (this.words.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.words.length;
        this.updateHomePageDisplay();
    }

    // ===== 新增單字 =====
    async handleAddWord(e) {
        e.preventDefault();

        const word = document.getElementById('wordInput').value.trim();
        const translation = document.getElementById('translationInput').value.trim();
        const partOfSpeech = document.getElementById('partOfSpeechInput').value;
        const example = document.getElementById('exampleInput').value.trim();
        const etymology = document.getElementById('etymologyInput').value.trim();

        if (!word || !translation) {
            alert('請輸入英文單字和中文翻譯');
            return;
        }

        // 檢查單字是否已存在
        if (this.words.some(w => w.word.toLowerCase() === word.toLowerCase())) {
            alert('此單字已存在');
            return;
        }

        const newWord = {
            word,
            translation,
            partOfSpeech,
            example,
            etymology
        };

        try {
            await this.sendWordToBackend(newWord);
        } catch (error) {
            alert(`儲存到後端失敗：${error.message}`);
            return;
        }

        // 新增單字
        this.words.push(newWord);
        this.saveToStorage();
        this.renderWordsList();
        this.resetForm();
        
        // 更新首頁
        this.updateHomePageDisplay();

        alert('單字已儲存');
    }

    // ===== 發送資料到後端 =====
    async sendWordToBackend(wordData) {
        // 使用 URL-encoded 表單格式來避免觸發瀏覽器的 CORS preflight（某些 Apps Script 部署對 OPTIONS 回應有限制）
        const body = new URLSearchParams(wordData).toString();

        const response = await fetch(GAS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`${response.status} ${response.statusText}: ${text}`);
        }

        // 某些情況 Apps Script 回傳空內容，保險起見嘗試解析 JSON
        const text = await response.text();
        try {
            return text ? JSON.parse(text) : { success: true };
        } catch (err) {
            return { success: true, raw: text };
        }
    }

    // ===== 自動填入API功能 =====
    async autoFillWord() {
        const word = document.getElementById('wordInput').value.trim();
        const statusEl = document.getElementById('autoFillStatus');

        if (!word) {
            statusEl.textContent = '請先輸入英文單字';
            statusEl.className = 'status-message error';
            return;
        }

        statusEl.textContent = '⏳ 正在查詢...';
        statusEl.className = 'status-message loading';

        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            
            if (!response.ok) {
                throw new Error('單字不存在');
            }

            const data = await response.json();
            const wordData = data[0];

            // 提取信息
            let translation = '';
            let partOfSpeech = '';
            let example = '';
            let etymology = '';

            // 解析詞性和定義
            if (wordData.meanings && wordData.meanings.length > 0) {
                const meaning = wordData.meanings[0];
                partOfSpeech = meaning.partOfSpeech || '';

                if (meaning.definitions && meaning.definitions.length > 0) {
                    translation = meaning.definitions[0].definition;
                    if (meaning.definitions[0].example) {
                        example = meaning.definitions[0].example;
                    }
                }
            }

            // 解析字根/詞源
            if (wordData.origin) {
                etymology = wordData.origin;
            }

            // 填入表單
            document.getElementById('translationInput').value = translation;
            document.getElementById('partOfSpeechInput').value = partOfSpeech;
            document.getElementById('exampleInput').value = example;
            document.getElementById('etymologyInput').value = etymology;

            statusEl.textContent = '✓ 查詢成功，信息已填入';
            statusEl.className = 'status-message success';

            // 3秒後清除狀態訊息
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = 'status-message';
            }, 3000);

        } catch (error) {
            statusEl.textContent = `✗ 錯誤: ${error.message}`;
            statusEl.className = 'status-message error';
        }
    }

    // ===== 刪除單字 =====
    deleteWord(index) {
        if (confirm('確定要刪除此單字嗎？')) {
            this.words.splice(index, 1);
            this.saveToStorage();
            this.renderWordsList();

            // 調整currentIndex
            if (this.currentIndex >= this.words.length && this.words.length > 0) {
                this.currentIndex = this.words.length - 1;
            }

            this.updateHomePageDisplay();
        }
    }

    // ===== 渲染單字列表 =====
    renderWordsList() {
        const wordsList = document.getElementById('wordsList');
        document.getElementById('wordCount').textContent = this.words.length;

        if (this.words.length === 0) {
            wordsList.innerHTML = '<p class="empty-message">還沒有新增任何單字</p>';
            return;
        }

        wordsList.innerHTML = this.words.map((word, index) => `
            <div class="word-item">
                <div class="word-item-header">
                    <div>
                        <div class="word-item-word">${this.escapeHtml(word.word)}</div>
                        ${word.partOfSpeech ? `<div class="word-item-pos">${this.escapeHtml(word.partOfSpeech)}</div>` : ''}
                    </div>
                    <button class="word-item-delete" onclick="vocabApp.deleteWord(${index})">刪除</button>
                </div>
                <div class="word-item-translation">${this.escapeHtml(word.translation)}</div>
                ${word.example ? `<div class="word-item-example"><strong>例句:</strong> ${this.escapeHtml(word.example)}</div>` : ''}
                ${word.etymology ? `<div class="word-item-etymology"><strong>字根:</strong> ${this.escapeHtml(word.etymology)}</div>` : ''}
            </div>
        `).join('');
    }

    // ===== 重置表單 =====
    resetForm() {
        document.getElementById('addWordForm').reset();
        document.getElementById('autoFillStatus').textContent = '';
        document.getElementById('autoFillStatus').className = 'status-message';
    }

    // ===== 本地存儲 =====
    loadFromStorage() {
        const data = localStorage.getItem('vocabWords');
        return data ? JSON.parse(data) : [];
    }

    saveToStorage() {
        localStorage.setItem('vocabWords', JSON.stringify(this.words));
    }

    // ===== 工具函數 =====
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// ===== 應用程式初始化 =====
let vocabApp;

document.addEventListener('DOMContentLoaded', () => {
    vocabApp = new VocabMaster();
});
