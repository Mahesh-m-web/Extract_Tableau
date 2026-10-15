import XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Declare this so our linter knows that tableau is a global object
/* global tableau */


//array_move function from stackoverflow solution:
//https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
function array_move(arr, old_index, new_index) {
  if (new_index >= arr.length) {
      var k = new_index - arr.length + 1;
      while (k--) {
          arr.push(undefined);
      }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr; // for testing
};

const saveSettings = () => new Promise((resolve, reject) => {
  console.log('[func.js] Saving settings');
  tableau.extensions.settings.set('metaVersion', 2);
  console.log('[func.js] Authoring mode', tableau.extensions.environment.mode);
  if (tableau.extensions.environment.mode === "authoring") {
    tableau.extensions.settings.saveAsync()
    .then(newSavedSettings => {
      //console.log('[func.js] newSavedSettings', newSavedSettings);
      resolve(newSavedSettings);
    }).catch(reject);
  } else {
    resolve();
  }
  
});

const setSettings = (type, value) => new Promise((resolve, reject) => {
  console.log('[func.js] Set settings', type, value);
  let settingKey = '';
  switch(type) {
    case 'sheets':
      settingKey = 'selectedSheets';
      break;
    case 'label':
      settingKey = 'buttonLabel';
      break;
    case 'style':
      settingKey = 'buttonStyle';
      break;
    case 'filename':
      settingKey = 'filename';
      break;
    case 'version':
      settingKey = 'metaVersion';
      break;
    default:
      settingKey = 'unknown';
  }
  tableau.extensions.settings.set(settingKey, JSON.stringify(value));
  resolve();
});

const getSheetColumns = (sheet, existingCols, modified) => new Promise((resolve, reject) => {
  sheet.getSummaryDataAsync({ignoreSelection: true}).then((data) => {
    //console.log('[func.js] Sheet Summary Data', data);
    console.log('[func.js] getSheetColumns existingCols', JSON.stringify(existingCols));
    const columns = data.columns;
    let cols = [];
    const existingIdx = [];
    if (modified) {
      for (var j = 0; j < columns.length; j++) {
        //console.log(columns[j]);
        var col = {};
        col.index = columns[j].index;
        col.name = columns[j].fieldName;
        col.dataType = columns[j].dataType;
        col.changeName = null;
        col.selected = false;
        cols.push(col);
      }
      for (var i = 0; i < existingCols.length; i++) {
        if (existingCols[i] && existingCols[i].hasOwnProperty("name")) {
          existingIdx.push(existingCols[i].name);
        }
      }
      console.log('[func.js] getSheetColumns existingIdx', existingIdx);
      let maxPos = existingIdx.length;
      cols = cols.map((col, idx) => {
        //console.log('[func.js] getSheetColumns Looking for col', col);
        const eIdx = existingIdx.indexOf(col.name);
        const ret = {...col};
        if (eIdx > -1) {
          ret.selected = existingCols[eIdx].selected;
          ret.changeName = existingCols[eIdx].changeName;
          ret.order = eIdx;
        } else {
          ret.order = maxPos;
          maxPos += 1;
        }
        return ret;
      });
    } else {
      for (var k = 0; k < columns.length; k++) {
        var newCol = {};
        newCol.index = columns[k].index;
        newCol.name = columns[k].fieldName;
        newCol.dataType = columns[k].dataType;
        newCol.selected = true;
        newCol.order = k + 1;
        cols.push(newCol);
      }
    }
    cols = cols.sort((a, b) => (a.order > b.order) ? 1 : -1)
    resolve(cols);
  })
  .catch(error => {
    console.error('[func.js] Error with getSummaryDataAsync', error);
    reject(error);
  });
});

const initializeMeta = () => new Promise((resolve, reject) => {
  console.log('[func.js] Initialise Meta');
  var promises = [];
  const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  //console.log('[func.js] Worksheets in dashboard', worksheets);
  var meta = worksheets.map(worksheet => {
    var sheet = worksheet;
    var item = {};
    item.sheetName = sheet.name;
    item.selected = false;
    item.changeName = null;
    item.customCols = false;
    promises.push(getSheetColumns(sheet, null, false));
    return item;
  });

  console.log(`[func.js] Found ${meta.length} sheets`, meta);

  Promise.all(promises).then((sheetArr) => {
    for (var i = 0; i < sheetArr.length; i++) {
      var sheetMeta = meta[i];
      sheetMeta.columns = sheetArr[i];
      meta[i] = sheetMeta;
      console.log(`[func.js] Added ${sheetArr[i].length} columns to ${sheetMeta.sheetName}`, meta);
    }
    //console.log(`[func.js] Meta initialised`, meta);
    resolve(meta);
  }).catch(reject);
});

const revalidateMeta = (existing) => new Promise((resolve, reject) => {
  console.log('[func.js] Revalidate Meta');
  var promises = [];
  const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  //console.log('[func.js] Worksheets in dashboard', worksheets);
  var meta = worksheets.map(worksheet => {
    var sheet = worksheet;
    const sheetIdx = existing.findIndex((e) => {
      return e.sheetName === sheet.name;
    });
    if (sheetIdx > -1) {
      console.log(`[func.js] Existing sheet ${sheet.name} columns`, JSON.stringify(existing[sheetIdx].columns));
      promises.push(getSheetColumns(sheet, existing[sheetIdx].columns, true));
      existing[sheetIdx].existed = true;
      return existing[sheetIdx];
    } else {
      var item = {};
      item.sheetName = sheet.name;
      item.selected = false;
      item.changeName = null;
      item.customCols = false;
      item.existed = false;
      promises.push(getSheetColumns(sheet, null, false));
      return item;
    }
  });

  console.log(`[func.js] Found ${meta.length} sheets`, meta);

  Promise.all(promises).then((sheetArr) => {

    for (var i = 0; i < sheetArr.length; i++) {
      var sheetMeta = meta[i];
      sheetMeta.columns = sheetArr[i];
      meta[i] = sheetMeta;
      //console.log(`[func.js] Added ${sheetArr[i].length} columns to ${sheetMeta.sheetName}`, meta);
    }
    meta.forEach((sheet, idx) => {
      if (sheet && sheet.sheetName) {
        const eIdx = existing.findIndex((e) => {
          return e.sheetName === sheet.sheetName;
        });
        meta = array_move(meta, idx, eIdx);
      } else {
        console.log('[func.js] Sheet ordering issue. No sheet defined in idx', idx);
      }
    })
    console.log(`[func.js] Meta revalidated`, JSON.stringify(meta));
    resolve(meta);
  }).catch(reject);
});

const exportToExcel = async (meta, env, filename) => {
  const selectedSheets = (meta || []).filter(sheet => sheet && sheet.selected);
  if (selectedSheets.length === 0) {
    throw new Error('Select at least one worksheet before exporting.');
  }

  const workbook = XLSX.utils.book_new();
  const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  const usedNames = new Set();

  const safeSheetName = (value) => {
    const base = (value || 'Worksheet').replace(/[\\/*?:]/g, '').replace(/\[/g, '').replace(/\]/g, '').trim().slice(0, 31) || 'Worksheet';
    let candidate = base;
    let suffix = 2;
    while (usedNames.has(candidate.toLowerCase())) {
      const ending = ` (${suffix})`;
      candidate = `${base.slice(0, 31 - ending.length)}${ending}`;
      suffix += 1;
    }
    usedNames.add(candidate.toLowerCase());
    return candidate;
  };

  for (const sheetMeta of selectedSheets) {
    const sheet = worksheets.find(item => item.name === sheetMeta.sheetName);
    if (!sheet) continue;

    const data = await sheet.getSummaryDataAsync({ ignoreSelection: true });
    const selectedColumns = (sheetMeta.columns || [])
      .filter(column => column && column.selected)
      .sort((left, right) => (left.order || 0) - (right.order || 0));
    const columns = selectedColumns
      .map(columnMeta => ({
        columnMeta,
        columnIndex: data.columns.findIndex(column => column.fieldName === columnMeta.name),
      }))
      .filter(item => item.columnIndex >= 0);
    const headers = columns.map(({ columnMeta }) => columnMeta.changeName || columnMeta.name);
    const rows = data.data.map(row => columns.map(({ columnMeta, columnIndex }) => {
      const cell = row[columnIndex];
      if (!cell || (cell.value === '%null%' && cell.nativeValue === null)) return null;
      const sourceColumn = data.columns[columnIndex];
      switch (sourceColumn._dataType) {
        case 'int':
        case 'float': {
          const numericValue = Number(cell.value);
          return Number.isFinite(numericValue) ? numericValue : cell.formattedValue;
        }
        case 'bool':
          return cell.value;
        case 'date':
        case 'date-time':
        default:
          return cell.formattedValue;
      }
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(sheetMeta.changeName || sheetMeta.sheetName));
  }

  if (workbook.SheetNames.length === 0) {
    throw new Error('No selected worksheets are available to export.');
  }

  const outputName = (filename || 'DashboardData').replace(/\.xlsx$/i, '').trim() || 'DashboardData';
  const workbookBytes = XLSX.write(workbook, {
    bookType: 'xlsx',
    bookSST: false,
    type: 'array',
    ignoreEC: false,
  });
  saveAs(new Blob([workbookBytes], { type: 'application/octet-stream' }), `${outputName}.xlsx`);
};

export {
  initializeMeta,
  revalidateMeta,
  saveSettings,
  setSettings,
  exportToExcel,
}




