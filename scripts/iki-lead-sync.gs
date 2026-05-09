/**
 * IKI Lead Sync — Google Apps Script
 *
 * Tự động đọc email từ FormSubmit (CC vào Gmail) và ghi vào Google Sheet.
 * Chạy mỗi 5 phút qua time-based trigger.
 *
 * SETUP — chỉ làm 1 lần:
 *  1. Tạo Google Sheet mới (sheets.new)
 *  2. Mở Extensions → Apps Script
 *  3. Xóa code mặc định, paste TOÀN BỘ file này
 *  4. Save (Ctrl+S / Cmd+S)
 *  5. Chọn hàm `setupOnce` trên thanh công cụ → click Run
 *  6. Authorize permissions (Gmail + Sheets) — click "Advanced" → "Go to project (unsafe)"
 *  7. Done — leads sẽ tự sync mỗi 5 phút
 *
 * VẬN HÀNH:
 *  - Mỗi 5 phút, hàm syncLeads() chạy tự động
 *  - Tìm email mới từ submissions@formsubmit.co
 *  - Parse table → ghi vào sheet "Leads"
 *  - Gắn label "IKI/Processed" để không xử lý lại
 */

const SHEET_NAME = 'Leads';
const PROCESSED_LABEL = 'IKI/Processed';
const SEARCH_QUERY = 'from:(submissions@formsubmit.co OR @formsubmit.co) -label:IKI/Processed';

const HEADERS = [
  'Ngày đăng ký',
  'Funnel',
  'Tên',
  'Email',
  'SĐT',
  'Nguồn',
  'Trạng thái',
  'Ghi chú',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'Landing page',
  'Referrer',
  'Email subject',
  'Gmail link'
];

const STATUS_OPTIONS = ['Chưa liên hệ', 'Đã gọi', 'Đang follow', 'Đã chốt', 'Từ chối', 'Spam'];

/* ================================================================
 * SETUP — chạy 1 lần khi cài đặt
 * ================================================================ */
function setupOnce() {
  const sheet = getOrCreateSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#A8D254');
    headerRange.setFontColor('#1f2922');
    sheet.setFrozenRows(1);

    sheet.setColumnWidth(1, 140);   // A Date
    sheet.setColumnWidth(2, 130);   // B Funnel
    sheet.setColumnWidth(3, 160);   // C Name
    sheet.setColumnWidth(4, 220);   // D Email
    sheet.setColumnWidth(5, 120);   // E Phone
    sheet.setColumnWidth(6, 90);    // F Source
    sheet.setColumnWidth(7, 130);   // G Status
    sheet.setColumnWidth(8, 240);   // H Notes
    sheet.setColumnWidth(9, 110);   // I utm_source
    sheet.setColumnWidth(10, 100);  // J utm_medium
    sheet.setColumnWidth(11, 130);  // K utm_campaign
    sheet.setColumnWidth(12, 130);  // L utm_content
    sheet.setColumnWidth(13, 100);  // M utm_term
    sheet.setColumnWidth(14, 160);  // N Landing page
    sheet.setColumnWidth(15, 200);  // O Referrer
    sheet.setColumnWidth(16, 280);  // P Email subject
    sheet.setColumnWidth(17, 100);  // Q Gmail link

    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(STATUS_OPTIONS, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('G2:G1000').setDataValidation(statusRule);

    const funnelRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['3 Ngày Reset', '7 Ngày Detox', 'Khác'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('B2:B1000').setDataValidation(funnelRule);
  }

  let label = GmailApp.getUserLabelByName(PROCESSED_LABEL);
  if (!label) {
    label = GmailApp.createLabel(PROCESSED_LABEL);
  }

  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'syncLeads') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('syncLeads')
    .timeBased()
    .everyMinutes(5)
    .create();

  syncLeads();

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Setup hoàn tất! Trigger 5 phút đã active. Leads sẽ tự sync.',
    'IKI Lead Sync',
    8
  );
  Logger.log('Setup OK — trigger every 5 minutes');
}

/* ================================================================
 * SYNC — chạy tự động mỗi 5 phút (cũng có thể chạy thủ công)
 * ================================================================ */
function syncLeads() {
  const sheet = getOrCreateSheet();
  const label = GmailApp.getUserLabelByName(PROCESSED_LABEL);
  if (!label) {
    Logger.log('Label not found. Run setupOnce first.');
    return;
  }

  const threads = GmailApp.search(SEARCH_QUERY, 0, 50);
  let added = 0;

  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      try {
        const lead = parseFormSubmitEmail(message);
        if (lead) {
          sheet.appendRow([
            lead.date,
            lead.funnel,
            lead.name,
            lead.email,
            lead.phone,
            'Web',
            'Chưa liên hệ',
            '',
            lead.utm_source,
            lead.utm_medium,
            lead.utm_campaign,
            lead.utm_content,
            lead.utm_term,
            lead.landing_page,
            lead.referrer,
            lead.subject,
            lead.gmailLink
          ]);
          added++;
        }
      } catch (e) {
        Logger.log('Error parsing message ' + message.getId() + ': ' + e);
      }
    });
    thread.addLabel(label);
  });

  if (added > 0) {
    Logger.log('Synced ' + added + ' new lead(s)');
  }
}

/* ================================================================
 * PARSER — đọc table HTML từ FormSubmit email
 * ================================================================ */
function parseFormSubmitEmail(message) {
  const subject = message.getSubject() || '';
  const body = message.getBody() || '';
  const date = message.getDate();

  const skipKeywords = ['activate', 'activation', 'confirm your email', 'verify your email'];
  const lowerSubject = subject.toLowerCase();
  for (let i = 0; i < skipKeywords.length; i++) {
    if (lowerSubject.indexOf(skipKeywords[i]) !== -1) return null;
  }

  let funnel = 'Khác';
  if (subject.indexOf('3 Ngày Reset') !== -1 || subject.indexOf('3 Ngay Reset') !== -1) {
    funnel = '3 Ngày Reset';
  } else if (subject.indexOf('7 Ngày Detox') !== -1 || subject.indexOf('7 Ngay Detox') !== -1) {
    funnel = '7 Ngày Detox';
  }

  const fields = {};
  const rowRegex = /<tr[^>]*>\s*<t[hd][^>]*>\s*([^<]+?)\s*<\/t[hd]>\s*<t[hd][^>]*>\s*([^<]*?)\s*<\/t[hd]>\s*<\/tr>/gi;
  let m;
  while ((m = rowRegex.exec(body)) !== null) {
    const key = m[1].trim().toLowerCase();
    const val = m[2].trim();
    fields[key] = val;
  }

  if (!fields.name && !fields.email) {
    const plain = message.getPlainBody() || '';
    const lines = plain.split(/\r?\n/);
    lines.forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        const val = line.slice(colonIdx + 1).trim();
        if (key && val) fields[key] = val;
      }
    });
  }

  const name = fields.name || fields['tên'] || fields['họ tên'] || '';
  const email = fields.email || '';
  const phone = fields.phone || fields['sđt'] || fields['số điện thoại'] || '';

  if (!email && !name && !phone) return null;

  return {
    date: Utilities.formatDate(date, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm'),
    funnel: funnel,
    name: name,
    email: email,
    phone: phone,
    utm_source:    fields.utm_source   || '',
    utm_medium:    fields.utm_medium   || '',
    utm_campaign:  fields.utm_campaign || '',
    utm_content:   fields.utm_content  || '',
    utm_term:      fields.utm_term     || '',
    landing_page:  fields.landing_page || '',
    referrer:      fields.referrer     || '',
    subject: subject,
    gmailLink: 'https://mail.google.com/mail/u/0/#inbox/' + message.getId()
  };
}

/* ================================================================
 * HELPERS
 * ================================================================ */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

/**
 * DEBUG — chạy thủ công để test parse 1 email
 */
function debugParseLatest() {
  const threads = GmailApp.search('from:(@formsubmit.co)', 0, 1);
  if (threads.length === 0) {
    Logger.log('No FormSubmit emails found');
    return;
  }
  const message = threads[0].getMessages()[0];
  const lead = parseFormSubmitEmail(message);
  Logger.log(JSON.stringify(lead, null, 2));
}

/**
 * RESET — xoá toàn bộ Processed label để re-sync (debug)
 */
function resetProcessedLabel() {
  const label = GmailApp.getUserLabelByName(PROCESSED_LABEL);
  if (!label) return;
  const threads = label.getThreads(0, 500);
  threads.forEach(t => t.removeLabel(label));
  Logger.log('Removed label from ' + threads.length + ' threads');
}
