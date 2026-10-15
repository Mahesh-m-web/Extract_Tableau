import React, { useState, useEffect } from 'react';
import SelectSheets from './SelectSheets/SelectSheets';
import SelectColumns from './SelectColumns/SelectColumns';
import ActionButtons from './ActionButtons/ActionButtons';
import ConfigureTab from './ConfigureTab/ConfigureTab';
import { saveSettings, setSettings, initializeMeta, revalidateMeta } from '../func/func';
import './Configure.css';

// Declare this so our linter knows that tableau is a global object
/* global tableau */

const configBody = {
  height: 'calc(100vh - 170px)',
}

const tabButtonStyle = (active) => ({
  flex: 1,
  minHeight: 42,
  border: 0,
  borderBottom: active ? '3px solid #2b8ec6' : '3px solid transparent',
  background: active ? '#f5f5f5' : '#fff',
  color: active ? '#333' : '#666',
  font: 'inherit',
  cursor: 'pointer',
});


function Configure(props) {
  const [tab, switchTab] = useState(0);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    console.log('[Configure.js] useEffect');
    //Initialise Extension
    tableau.extensions.initializeDialogAsync().then(() => {

      console.log('[Configure.js] Initialise Dialog');

      let sheetSettings = tableau.extensions.settings.get('selectedSheets');

      if (sheetSettings && sheetSettings != null) {
        const existingSettings = JSON.parse(sheetSettings);
        console.log('[Configure.js] Existing Sheet Settings Found', sheetSettings);
        revalidateMeta(existingSettings)
          .then(meta => {
            props.updateMeta(meta);
          })
          .catch(error => {
            console.error('[Configure.js] Failed to load saved worksheet settings', error);
            setLoadError(error && error.message ? error.message : 'Could not load worksheets from this dashboard.');
          });
      } else {
        initializeMeta()
          .then(meta => props.updateMeta(meta))
          .catch(error => {
            console.error('[Configure.js] Failed to load worksheet metadata', error);
            setLoadError(error && error.message ? error.message : 'Could not load worksheets from this dashboard.');
          });
      }

      let labelSettings = tableau.extensions.settings.get('buttonLabel');

      if (labelSettings && labelSettings != null) {
        labelSettings = labelSettings.replace(/"/g,'');
        console.log('[Configure.js] initializeDialogAsync Existing Label Settings Found', labelSettings);
        props.updateLabel(labelSettings);
      }

      let styleSettings = tableau.extensions.settings.get('buttonStyle');

      if (styleSettings && styleSettings != null) {
        console.log('[Configure.js] initializeDialogAsync Existing Label Style Found', styleSettings);
        props.updateButtonStyle(styleSettings);
      }

      let filenameSettings = tableau.extensions.settings.get('filename');

      if (filenameSettings && filenameSettings != null) {
        console.log('[Configure.js] initializeDialogAsync Existing Filename Found', filenameSettings);
        props.updateFilename(filenameSettings);
      }

    }).catch(error => {
      console.error('[Configure.js] Failed to initialize configuration', error);
      setLoadError(error && error.message ? error.message : 'Could not load worksheets from this dashboard.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectSheetHandler(i) {
    console.log('[Configure.js] selectSheetHandler', i);
    const meta = props.meta;
    meta[i].selected = !meta[i].selected;
    props.updateMeta(meta);
    props.changeSettings(true);
  }

  function selectColumnHandler(sheetIdx, colIdx) {
    console.log('[Configure.js] selectColumnHandler', sheetIdx, colIdx);
    const meta = props.meta;
    const sheet = meta[sheetIdx];
    sheet.columns[colIdx].selected = !sheet.columns[colIdx].selected;
    meta[sheetIdx] = sheet;
    props.updateMeta(meta);
    props.changeSettings(true);
  }

  function changeSheetNameHandler(i, name) {
    console.log('[Configure.js] changeSheetNameHandler', i, name);
    const meta = props.meta;
    meta[i].changeName = name;
    props.updateMeta(meta);
    props.changeSettings(true);
  }

  function changeColumnNameHandler(sheetIdx, colIdx, name) {
    console.log('[Configure.js] changeColumnNameHandler', sheetIdx, colIdx, name);
    const meta = props.meta;
    const sheet = meta[sheetIdx];
    sheet.columns[colIdx].changeName = name;
    meta[sheetIdx] = sheet;
    props.updateMeta(meta);
    props.changeSettings(true);
  }

  function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
  };

  function changeSheetOrderHandler(i, newPos) {
    console.log('[Configure.js] changeSheetOrderHandler', i, newPos);
    if (newPos > 0) {
      const meta = array_move(props.meta, i, newPos - 1);
      props.updateMeta(meta);
      props.changeSettings(true);
    }
  }

  function changeColumnOrderHandler(sheetIdx, colIdx, newPos) {
    console.log('[Configure.js] changeColumnOrderHandler', sheetIdx, colIdx, newPos);
    if (newPos > 0) {
      const meta = props.meta;
      const sheet = meta[sheetIdx];
      const columns = array_move(sheet.columns, colIdx, newPos - 1);
      columns.map((col, idx) => {
        col.order = idx;
        return col;
      });
      meta[sheetIdx].columns = columns;
      props.updateMeta(meta);
      props.changeSettings(true);
    }
  }

  function updateLabelHandler(label) {
    console.log('[Configure.js] changeUpdateLabelHandler', label);
    props.updateLabel(label);
    props.changeSettings(true);
  }

  function updateButtonStyleHandler(style) {
    console.log('[Configure.js] changeLabelStyleHandler', style);
    props.updateButtonStyle(style);
    props.changeSettings(true);
  }

  function updateFilenameHandler(filename) {
    console.log('[Configure.js] updateFilenameHandler', filename);
    props.updateFilename(filename);
    props.changeSettings(true);
  }

  function saveSettingsHandler() {
    console.log('[Configure.js] saveSettingsHandler - Saving Settings', props);
    const meta = props.meta;
    const label = props.label;
    const style = props.style;
    const filename = props.filename;
    props.disableButton(false);
    console.log('[Configure.js] saveSettingsHandler - sheets', meta);
    setSettings('sheets', meta)
      .then(setSettings('label', label))
      .then(setSettings('style', style))
      .then(setSettings('filename', filename))
      .then(saveSettings())
      .then((savedSettings) => {
        console.log('[Configure.js] Saved Settings', savedSettings);
        props.changeSettings(false);
        let sheetSettings = tableau.extensions.settings.get('selectedSheets');
        if (sheetSettings && sheetSettings != null) {
          const existingSettings = JSON.parse(sheetSettings);
          console.log('[Configure.js] Sheet Settings Updated', existingSettings);
        }
      })
  }

  function resetSettingsHandler() {
    console.log('[Configure.js] resetSettingsHandler - Reset Settings');
    initializeMeta()
      .then(meta => {
        props.updateMeta(meta);
      });
  }

  return (
      <div>
      <div className='configHeader'>Dashboard Data Export</div>
      <div role="tablist" aria-label="Export settings" style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
        {['Select Sheets', 'Select Columns', 'Configure'].map((label, index) => (
          <button key={label} type="button" role="tab" aria-selected={tab === index}
            style={tabButtonStyle(tab === index)} onClick={() => switchTab(index)}>{label}</button>
        ))}
      </div>
      <div role="tabpanel" style={configBody}>
          {loadError ? <div role="alert" style={{ padding: 16, color: '#a12622' }}>{loadError}</div> : null}
          { tab === 0 ? <SelectSheets sheets={props.meta} selectSheet={selectSheetHandler} changeOrder={changeSheetOrderHandler} changeName={changeSheetNameHandler} /> : null }
          { tab === 1 ? <SelectColumns sheets={props.meta} colSelect={selectColumnHandler} changeName={changeColumnNameHandler} changeOrder={changeColumnOrderHandler}/> : null }
          { tab === 2 ? <ConfigureTab label={props.label} filename={props.filename} style={props.style} updateLabel={updateLabelHandler} updateButtonStyle={updateButtonStyleHandler} updateFilename={updateFilenameHandler}/> : null }
      </div>
      <ActionButtons enableButton={props.enableSave} save={saveSettingsHandler} resetSettings={resetSettingsHandler} />
      </div>
  );
}

export default Configure;

