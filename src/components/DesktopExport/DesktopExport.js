import React from 'react';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import './DesktopExport.css';

function DesktopExport() {
  return (
    <Grid container spacing={0} align="left" justify="center">
      <Grid item>
        <Typography component="div" style={{ padding: 20 }}>
          <h2>Export unavailable</h2>
          <p>This Tableau Desktop version does not support downloading files from dashboard extensions.</p>
          <p>Use Tableau Desktop 2019.4 or later, or open the dashboard in Tableau Server or Tableau Cloud.</p>
          <p>Return to the dashboard and try again after upgrading.</p>
        </Typography>
      </Grid>
    </Grid>
  );
}

export default DesktopExport;
