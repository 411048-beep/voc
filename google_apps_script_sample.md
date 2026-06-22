# Google Apps Script 後端範例

此文件提供一個可直接貼入 Google Apps Script 的 `doPost` 範例，供你的前端 `voc` 應用程式使用。

## 1. 建立試算表

1. 在 Google 試算表建立新試算表。
2. 第一列填入欄位標題：
   - A1: `word`
   - B1: `translation`
   - C1: `partOfSpeech`
   - D1: `example`
   - E1: `etymology`
3. 複製試算表網址中的 `spreadsheetId`。

## 2. Apps Script 程式碼範例

```js
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = '工作表1';

function doPost(e) {
  try {
    let data = {};

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

## 3. 備註

- 請確認 `SPREADSHEET_ID` 已正確替換為你的試算表 ID。
- 若 Apps Script 部署後仍出現錯誤，請移除所有 `document` / `window` / DOM 相關程式，後端只能使用伺服器端 API。
- 部署時選擇「任何人，包括匿名者」以便前端直接呼叫。
