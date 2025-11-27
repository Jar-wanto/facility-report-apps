// Code.gs - Backend Google Apps Script

// Spreadsheet IDs - UPDATE THESE WITH YOUR ACTUAL SPREADSHEET IDs
const USER_SHEET_ID = 'YOUR_USER_SPREADSHEET_ID';
const FACILITY_SHEET_ID = 'YOUR_FACILITY_SPREADSHEET_ID';
const REPORT_SHEET_ID = 'YOUR_REPORT_SPREADSHEET_ID';

// Folder ID for storing uploaded photos
const PHOTOS_FOLDER_ID = 'YOUR_PHOTOS_FOLDER_ID';

// Code.gs - Backend Google Apps Script
function doGet(e) {
  const page = e.parameter.page || 'index';
  
  if (page === 'admin') {
    return HtmlService.createTemplateFromFile('AdminDashboard')
      .evaluate()
      .setTitle('Admin Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (page === 'reporter') {
    return HtmlService.createTemplateFromFile('ReporterForm')
      .evaluate()
      .setTitle('Report Problem')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (page === 'viewer') {
    return HtmlService.createTemplateFromFile('ProgressViewer')
      .evaluate()
      .setTitle('View Progress')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Facility Problem Reporting')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Authentication
function authenticateUser(username, password) {
  try {
    const ss = SpreadsheetApp.openById(USER_SHEET_ID);
    const sheet = ss.getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username && data[i][1] === password) {
        return {
          success: true,
          role: data[i][2],
          username: username
        };
      }
    }
    
    return { success: false, message: 'Invalid username or password' };
  } catch (error) {
    return { success: false, message: 'Authentication error: ' + error.message };
  }
}

// Facility lookup by QR code
function getFacilityByQRCode(qrCode) {
  try {
    const ss = SpreadsheetApp.openById(FACILITY_SHEET_ID);
    const sheet = ss.getSheetByName('Facilities');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === qrCode) {
        return {
          success: true,
          facilityId: data[i][0],
          facilityName: data[i][1],
          location: data[i][2]
        };
      }
    }
    
    return { success: false, message: 'Facility not found' };
  } catch (error) {
    return { success: false, message: 'Lookup error: ' + error.message };
  }
}

// Save report
function saveReport(reportData) {
  try {
    const ss = SpreadsheetApp.openById(REPORT_SHEET_ID);
    const sheet = ss.getSheetByName('Reports');
    
    if (!sheet) {
      throw new Error('Reports sheet not found');
    }
    
    const timestamp = new Date();
    const photoUrls = reportData.photoUrls || '';
    
    sheet.appendRow([
      timestamp,
      reportData.facilityId,
      reportData.facilityName,
      reportData.location,
      reportData.problem,
      reportData.expectedCondition,
      photoUrls,
      'Pending'
    ]);
    
    return { success: true, message: 'Report submitted successfully' };
  } catch (error) {
    return { success: false, message: 'Save error: ' + error.message };
  }
}

// Upload photo to Google Drive
function uploadPhoto(base64Data, filename, mimeType) {
  try {
    const folder = DriveApp.getFolderById(PHOTOS_FOLDER_ID);
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      mimeType,
      filename
    );
    
    const file = folder.createFile(blob);
    
    // Make file publicly accessible
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Also try to make it publicly viewable without login
    try {
      file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log('Could not set ANYONE access: ' + e.message);
    }
    
    // Get direct image URL
    const fileId = file.getId();
    const directUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
    
    Logger.log('Uploaded file with direct URL: ' + directUrl);
    
    return {
      success: true,
      url: directUrl,
      id: fileId,
      viewUrl: file.getUrl()
    };
  } catch (error) {
    Logger.log('Upload error: ' + error.message);
    return { success: false, message: 'Upload error: ' + error.message };
  }
}

// Get all reports for admin - NO DEFAULT PARAMETERS
function getAllReports(filter) {
  try {
    Logger.log('=== getAllReports START ===');
    
    // Handle undefined filter - CRITICAL: Must handle explicitly, no default params
    if (typeof filter === 'undefined' || filter === null) {
      filter = {};
      Logger.log('Filter was undefined/null, using empty object');
    }
    
    Logger.log('Filter: ' + JSON.stringify(filter));
    Logger.log('REPORT_SHEET_ID: ' + REPORT_SHEET_ID);
    
    const ss = SpreadsheetApp.openById(REPORT_SHEET_ID);
    Logger.log('Spreadsheet opened');
    
    const sheet = ss.getSheetByName('Reports');
    
    if (!sheet) {
      Logger.log('ERROR: Sheet not found');
      const allSheets = ss.getSheets().map(function(s) { return s.getName(); });
      Logger.log('Available sheets: ' + allSheets.join(', '));
      const errorResult = { success: false, message: 'Sheet "Reports" not found. Available: ' + allSheets.join(', ') };
      return errorResult;
    }
    
    Logger.log('Sheet found');
    
    const lastRow = sheet.getLastRow();
    Logger.log('Last row: ' + lastRow);
    
    if (lastRow <= 1) {
      Logger.log('No data rows');
      const emptyResult = { success: true, reports: [], totalRows: lastRow };
      return emptyResult;
    }
    
    const lastCol = Math.max(sheet.getLastColumn(), 8);
    Logger.log('Reading ' + lastRow + ' rows, ' + lastCol + ' cols');
    
    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    Logger.log('Data retrieved');
    
    const reports = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) {
        continue;
      }
      
      const report = {
        rowIndex: i + 1,
        timestamp: data[i][0].toString(),
        facilityId: String(data[i][1] || ''),
        facilityName: String(data[i][2] || ''),
        location: String(data[i][3] || ''),
        problem: String(data[i][4] || ''),
        expectedCondition: String(data[i][5] || ''),
        photoUrls: String(data[i][6] || ''),
        status: String(data[i][7] || 'Pending')
      };
      
      // Apply filters
      let include = true;
      
      if (filter.status && report.status !== filter.status) {
        include = false;
      }
      if (filter.facilityName && report.facilityName.toLowerCase().indexOf(filter.facilityName.toLowerCase()) === -1) {
        include = false;
      }
      
      if (include) {
        reports.push(report);
      }
    }
    
    Logger.log('Found ' + reports.length + ' reports');
    
    // Reverse the array
    const reversed = [];
    for (let i = reports.length - 1; i >= 0; i--) {
      reversed.push(reports[i]);
    }
    
    const finalResult = { 
      success: true, 
      reports: reversed, 
      totalRows: lastRow 
    };
    
    Logger.log('=== getAllReports END - Returning result ===');
    
    return finalResult;
    
  } catch (error) {
    Logger.log('=== ERROR ===');
    Logger.log('Error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    
    const errorResult = { 
      success: false, 
      message: error.message,
      stack: error.stack
    };
    
    return errorResult;
  }
}

// Update report status
function updateReportStatus(rowIndex, newStatus) {
  try {
    const ss = SpreadsheetApp.openById(REPORT_SHEET_ID);
    const sheet = ss.getSheetByName('Reports');
    
    sheet.getRange(rowIndex, 8).setValue(newStatus);
    
    return { success: true, message: 'Status updated successfully' };
  } catch (error) {
    return { success: false, message: 'Update error: ' + error.message };
  }
}

// Debug function to check spreadsheet structure
function debugReportsSheet() {
  try {
    const ss = SpreadsheetApp.openById(REPORT_SHEET_ID);
    const sheet = ss.getSheetByName('Reports');
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    Logger.log('Sheet Name: ' + sheet.getName());
    Logger.log('Last Row: ' + lastRow);
    Logger.log('Last Column: ' + lastCol);
    
    if (lastRow > 0) {
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      Logger.log('Headers: ' + JSON.stringify(headers));
      
      if (lastRow > 1) {
        const sampleData = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
        Logger.log('Sample Data: ' + JSON.stringify(sampleData));
      }
    }
    
    return {
      success: true,
      sheetName: sheet.getName(),
      lastRow: lastRow,
      lastColumn: lastCol,
      message: 'Check Logs for details'
    };
  } catch (error) {
    Logger.log('Debug Error: ' + error.message);
    return { success: false, message: error.message };
  }
}

// Fix missing status column
function fixStatusColumn() {
  try {
    const ss = SpreadsheetApp.openById(REPORT_SHEET_ID);
    const sheet = ss.getSheetByName('Reports');
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    // Check if status column exists
    if (lastCol < 8) {
      Logger.log('Adding status column...');
      sheet.getRange(1, 8).setValue('status');
      
      // Add 'Pending' status to all existing rows
      if (lastRow > 1) {
        for (let i = 2; i <= lastRow; i++) {
          sheet.getRange(i, 8).setValue('Pending');
        }
      }
      
      return { success: true, message: 'Status column added successfully!' };
    } else {
      return { success: true, message: 'Status column already exists' };
    }
  } catch (error) {
    Logger.log('Fix Error: ' + error.message);
    return { success: false, message: error.message };
  }
}

// Simple test function
function testConnection() {
  return { 
    success: true, 
    message: 'Connection successful!',
    timestamp: new Date().toString()
  };
}

// Test getAllReports directly in Apps Script editor
function testGetAllReportsManually() {
  Logger.log('Starting manual test...');
  
  const result = getAllReports({});
  
  Logger.log('Result type: ' + typeof result);
  Logger.log('Result is null? ' + (result === null));
  Logger.log('Result is undefined? ' + (result === undefined));
  
  if (result) {
    Logger.log('Result: ' + JSON.stringify(result));
  } else {
    Logger.log('ERROR: Result is null or undefined!');
  }
  
  return result;
}

// Helper function to convert Drive URL to direct image URL
function convertDriveUrlToDirectUrl(url) {
  if (!url) return '';
  
  // If already a direct URL, return as is
  if (url.indexOf('drive.google.com/uc?') !== -1) {
    return url;
  }
  
  // Extract file ID from various Drive URL formats
  let fileId = '';
  
  if (url.indexOf('/file/d/') !== -1) {
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const matches = url.match(/\/file\/d\/([^\/]+)/);
    if (matches && matches[1]) {
      fileId = matches[1];
    }
  } else if (url.indexOf('id=') !== -1) {
    // Format: https://drive.google.com/open?id=FILE_ID
    const matches = url.match(/id=([^&]+)/);
    if (matches && matches[1]) {
      fileId = matches[1];
    }
  }
  
  if (fileId) {
    return 'https://drive.google.com/uc?export=view&id=' + fileId;
  }
  
  return url;
}

// Get all reports with converted image URLs
function getAllReportsForViewer() {
  try {
    const result = getAllReports({});
    
    if (result.success && result.reports) {
      // Convert all photo URLs to direct URLs
      for (let i = 0; i < result.reports.length; i++) {
        if (result.reports[i].photoUrls) {
          const urls = result.reports[i].photoUrls.split(', ');
          const convertedUrls = [];
          
          for (let j = 0; j < urls.length; j++) {
            if (urls[j].trim()) {
              convertedUrls.push(convertDriveUrlToDirectUrl(urls[j].trim()));
            }
          }
          
          result.reports[i].photoUrls = convertedUrls.join(', ');
        }
      }
    }
    
    return result;
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// Fix permissions for existing photos in the spreadsheet
function fixExistingPhotoPermissions() {
  try {
    const ss = SpreadsheetApp.openById(REPORT_SHEET_ID);
    const sheet = ss.getSheetByName('Reports');
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return { success: true, message: 'No reports to fix' };
    }
    
    const data = sheet.getRange(2, 7, lastRow - 1, 1).getValues(); // Column G (photoUrls)
    let fixedCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0]) {
        const urls = String(data[i][0]).split(', ');
        
        for (let j = 0; j < urls.length; j++) {
          const url = urls[j].trim();
          if (url) {
            // Extract file ID
            let fileId = '';
            if (url.indexOf('/file/d/') !== -1) {
              const matches = url.match(/\/file\/d\/([^\/\?]+)/);
              if (matches && matches[1]) {
                fileId = matches[1];
              }
            } else if (url.indexOf('id=') !== -1) {
              const matches = url.match(/id=([^&]+)/);
              if (matches && matches[1]) {
                fileId = matches[1];
              }
            }
            
            if (fileId) {
              try {
                const file = DriveApp.getFileById(fileId);
                file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                
                try {
                  file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
                } catch (e) {
                  Logger.log('Could not set ANYONE for file: ' + fileId);
                }
                
                fixedCount++;
                Logger.log('Fixed permissions for file: ' + fileId);
              } catch (e) {
                Logger.log('Could not access file: ' + fileId + ' - ' + e.message);
              }
            }
          }
        }
      }
    }
    
    return { 
      success: true, 
      message: 'Fixed permissions for ' + fixedCount + ' photos',
      count: fixedCount
    };
    
  } catch (e) {
    Logger.log('Error fixing permissions: ' + e.message);
    return { success: false, message: e.toString() };
  }
}

// Alternative simpler version for testing
function getAllReportsSimple() {
  try {
    Logger.log('getAllReportsSimple called');
    
    const ss = SpreadsheetApp.openById(REPORT_SHEET_ID);
    const sheet = ss.getSheetByName('Reports');
    
    if (!sheet) {
      return { success: false, message: 'Sheet not found' };
    }
    
    const lastRow = sheet.getLastRow();
    Logger.log('Last row: ' + lastRow);
    
    if (lastRow <= 1) {
      return { success: true, reports: [], totalRows: 0 };
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    const reports = [];
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0]) {
        const report = {
          rowIndex: i + 2,
          timestamp: data[i][0].toString(),
          facilityId: String(data[i][1]),
          facilityName: String(data[i][2]),
          location: String(data[i][3]),
          problem: String(data[i][4]),
          expectedCondition: String(data[i][5]),
          photoUrls: String(data[i][6]),
          status: String(data[i][7] || 'Pending')
        };
        reports.push(report);
      }
    }
    
    // Reverse array
    const reversed = [];
    for (let i = reports.length - 1; i >= 0; i--) {
      reversed.push(reports[i]);
    }
    
    Logger.log('Returning ' + reversed.length + ' reports');
    
    return { 
      success: true, 
      reports: reversed, 
      totalRows: reversed.length 
    };
    
  } catch (e) {
    Logger.log('Error: ' + e.message);
    return { 
      success: false, 
      message: e.toString() 
    };
  }
}