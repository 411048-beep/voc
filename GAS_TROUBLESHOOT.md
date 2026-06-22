# Google Apps Script 連接排查清單

## ✅ 步驟 1：檢查 Google 試算表

1. 打開你的 Google 試算表
2. **複製試算表 ID**（在 URL 中）
   - 例如：`https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit`
3. 檢查第一列標題是否正確：
   - `A1: word`
   - `B1: translation`
   - `C1: partOfSpeech`
   - `D1: example`
   - `E1: etymology`
4. **記住工作表名稱**（預設為「工作表1」或「Sheet1」）

---

## ✅ 步驟 2：設置 Google Apps Script

1. 打開 https://script.google.com/
2. 找到你的 `voc-word-save` 專案（或建立新專案）
3. **清空所有代碼**，貼入以下完整代碼：

```js
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';  // 在這裡填入試算表 ID
const SHEET_NAME = '工作表1';                    // 如果你的工作表名稱不同，在這裡改

function doPost(e) {
  try {
    let data = {};

    // 優先解析 JSON，失敗時使用 URLSearchParams
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }

    const word = data.word || '';
    const translation = data.translation || '';
    const partOfSpeech = data.partOfSpeech || '';
    const example = data.example || '';
    const etymology = data.etymology || '';

    if (!word || !translation) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: 'word 或 translation 為空' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`找不到工作表: ${SHEET_NAME}，請檢查工作表名稱是否正確`);
    }

    sheet.appendRow([word, translation, partOfSpeech, example, etymology]);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: '資料已儲存' })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// 測試函數（方便本地測試）
function testPost() {
  const e = {
    parameter: {
      word: 'hello',
      translation: '你好',
      partOfSpeech: 'noun',
      example: 'Hello, world!',
      etymology: 'English'
    }
  };
  const result = doPost(e);
  Logger.log(result.getContent());
}
```

---

## ✅ 步驟 3：部署 Apps Script

1. 在 Apps Script 編輯器頂部，點擊 **「部署」** → **「新建部署」**
2. 選擇類型：**「Web 應用程式」**
3. 設定：
   - 執行程式：`我自己`
   - 應用程式能存取的人：`任何人，包括匿名者` ⚠️ **重要**
4. 點擊 **「部署」**
5. **複製 Web 應用程式 URL**（看起來像：`https://script.google.com/a/macros/...`)

> ⚠️ 注意：如果之前已經部署過，點擊「部署」後會顯示「新版本已部署」，確認並複製新 URL。

---

## ✅ 步驟 4：測試 Apps Script

1. 在 Apps Script 編輯器中，選擇 `testPost` 函數
2. 點擊 **「執行」** 按鈕
3. 授予權限（如果提示）
4. 檢查 **「執行紀錄」** 看是否有錯誤
5. 打開你的 Google 試算表，檢查第 2 列是否有測試資料：
   - `hello | 你好 | noun | Hello, world! | English`

---

## ✅ 步驟 5：更新前端 `app.js`

確保 `app.js` 第 4 行的 `GAS_ENDPOINT` 是你剛才複製的 URL：

```js
const GAS_ENDPOINT = 'https://script.google.com/a/macros/stu.nknush.kh.edu.tw/s/AKfycbwzW95Rwl138CvwUirL6iGVJIPOL8NrCANF3bZLoPq2xnvn02lljSn-Y8NXYw5FsWud/exec';
```

---

## ✅ 步驟 6：測試前端

1. 打開 `index.html`
2. 進入 **「管理」** 頁面
3. 輸入：
   - 英文單字：`test`
   - 中文翻譯：`測試`
   - 詞性：`verb`
   - 例句：`This is a test`
   - 字根：`Latin`
4. 點擊 **「儲存單字」**
5. 檢查：
   - ✅ 瀏覽器顯示 `單字已儲存` 提示
   - ✅ 打開 Google 試算表，第 3 列應該有新資料

---

## 🔍 常見錯誤排查

| 症狀 | 可能原因 | 解決方案 |
|------|--------|--------|
| `Failed to fetch` | CORS 錯誤 | 確保 Apps Script 部署時選擇「任何人，包括匿名者」 |
| `找不到工作表` | 工作表名稱錯誤 | 檢查 `SHEET_NAME` 是否與實際工作表名稱一致 |
| 試算表沒有新資料 | SPREADSHEET_ID 錯誤 | 複製試算表 URL 中的 ID，重新填入代碼 |
| 前端提示「錯誤訊息」 | 後端拋出異常 | 檢查瀏覽器開發者工具的 Network 標籤，查看後端回應 |
| 沒有任何錯誤但沒有保存 | 部署未更新 | 部署新版本時務必點擊「部署」按鈕確認 |

---

## 📝 檢查清單總結

- [ ] Google 試算表已建立，標題正確
- [ ] Google 試算表 ID 已複製
- [ ] 工作表名稱已確認（工作表1 或 Sheet1）
- [ ] Apps Script 代碼已貼入，SPREADSHEET_ID 已填入
- [ ] Apps Script 已部署為 Web 應用程式
- [ ] 部署時選擇「任何人，包括匿名者」
- [ ] Web 應用程式 URL 已複製到 `app.js` 的 `GAS_ENDPOINT`
- [ ] 測試函數 `testPost()` 執行成功
- [ ] Google 試算表出現測試資料
- [ ] 前端新增單字測試成功

完成這些步驟後，應該能夠正常連接！
