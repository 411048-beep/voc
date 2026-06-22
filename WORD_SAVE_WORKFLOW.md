# 管理者新增單字並儲存到 Google 試算表

## 目標
讓管理者在 `voc` 專案的管理頁面中，透過表單新增單字資料，並在按下「儲存單字」後，將資料送到後端 Google Apps Script，最後寫入 Google 試算表。

---

## 1. 前端表單欄位

表單包含以下欄位：

- 英文單字 (`wordInput`)
- 中文翻譯 (`translationInput`)
- 詞性 (`partOfSpeechInput`)
- 例句 (`exampleInput`)
- 字根分析 (`etymologyInput`)

目前表單已在 `index.html` 管理頁面中建立。提交按鈕為 `儲存單字`。

---

## 2. 前端邏輯更新

### 2.1 更新 submit 按鈕文字
已將 `index.html` 中的提交按鈕文字由「新增單字」改成「儲存單字」。

### 2.2 新增後端送出流程
已在 `app.js` 中加入以下功能：

- `GAS_ENDPOINT`：後端 Google Apps Script Web App URL
- `handleAddWord`：處理表單提交並送出資料
- `sendWordToBackend`：使用 `fetch` 呼叫 GAS endpoint

> 注意：`GAS_ENDPOINT` 必須使用 Google Apps Script 部署後的 Web App URL，不能使用 Google 試算表本身的網址。若使用試算表網址，前端會收到 `401` 或其他存取錯誤。

### 2.3 `handleAddWord` 流程

1. 取得表單欄位值。
2. 驗證 `word` 和 `translation` 是否有值。
3. 檢查單字是否重複。
4. 建立 `newWord` 物件。
5. 呼叫 `sendWordToBackend(newWord)`，將資料送到後端。 
6. 若後端成功回應，將單字加入本地資料並保存到 `localStorage`。
7. 更新管理清單、清空表單、更新首頁顯示。
8. 顯示成功提示 `alert('單字已儲存')`。

### 2.4 `sendWordToBackend` 行為

- 使用 `POST` 方法送出 JSON
- 標頭：`Content-Type: application/json`
- 失敗時拋出錯誤並提示
- 成功時回傳 JSON 結果

---

## 3. Google Apps Script 後端實作

### 3.1 建立 Google 試算表

1. 打開 Google 試算表。
2. 建立新的試算表。
3. 在第一列填入標題：
   - `A1`: `word`
   - `B1`: `translation`
   - `C1`: `partOfSpeech`
   - `D1`: `example`
   - `E1`: `etymology`
4. 複製試算表網址中的 `spreadsheetId`。

### 3.2 建立 Apps Script 專案

1. 打開 https://script.google.com/
2. 新增專案。
3. 將專案名稱改為 `voc-word-save` 或其他名稱。

### 3.3 Apps Script 程式碼
在 Apps Script 編輯器中貼上以下程式碼：

```js
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = '工作表1';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
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
      throw new Error(`找不到工作表: ${SHEET_NAME}`);
    }

    sheet.appendRow([word, translation, partOfSpeech, example, etymology]);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 3.4 部署為 Web 應用程式

1. 在 Apps Script 編輯器中，點選「部署」->「新建部署」。
2. 選擇「Web 應用程式」。
3. 設定：
   - `執行程式`: `我自己`
   - `應用程式能存取的人`: `任何人，包括匿名者`（或依實際需求調整）
4. 部署後複製 `Web 應用程式 URL`。
5. 將 `app.js` 中的 `GAS_ENDPOINT` 替換為該 URL。

> 注意：如果瀏覽器提示 `Failed to fetch`，常見原因是 CORS 或 preflight（OPTIONS）被擋下。解法：

- 在前端改用 `application/x-www-form-urlencoded`（已在 `app.js` 範例中採用），可避免瀏覽器發送 preflight 請求。
- 或在 Apps Script 端處理 preflight（不常見）；或部署 Web App 並設定「任何人，包括匿名者」。

下面是更新過的 `doPost` 範例，會同時支援 JSON 與表單編碼：

```js
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = '工作表1';

function doPost(e) {
  try {
    let data = {};

    // 優先嘗試解析 JSON
    if (e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
    } else {
      data = e.parameter || {};
    }

    const word = data.word || '';
    const translation = data.translation || '';
    const partOfSpeech = data.partOfSpeech || '';
    const example = data.example || '';
    const etymology = data.etymology || '';

    if (!word || !translation) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'word 或 translation 為空' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) { throw new Error(`找不到工作表: ${SHEET_NAME}`); }

    sheet.appendRow([word, translation, partOfSpeech, example, etymology]);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 4. 測試流程

1. 開啟 `index.html`。
2. 切換到「管理」頁面。
3. 輸入：英文單字、中文翻譯、詞性、例句、字根分析。
4. 按下 `儲存單字`。
5. 若成功，前端顯示 `單字已儲存`。
6. 打開 Google 試算表，確認資料是否新增在下一列。

---

## 5. 注意事項

- `GAS_ENDPOINT` 必須替換為部署後的 Apps Script Web App URL。
- `SPREADSHEET_ID` 必須替換為自己的試算表 ID。
- `SHEET_NAME` 需與實際工作表名稱一致，例如 `工作表1` 或 `Sheet1`。
- 若出現權限錯誤，可改為 `任何人，包括匿名者`，或檢查 Google 帳號權限。

---

## 6. 若要改進

- 可以在 Apps Script 中加入重複單字檢查。
- 可以將前端提交按鈕改成 loading 狀態。
- 可擴充後端 API 以支援讀取單字資料。
- 未來可改為 OAuth 或更嚴格的存取權限。
