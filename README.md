# Dashboard Data Export

A Tableau dashboard extension that exports summary data from selected worksheets into an Excel workbook (`.xlsx`). Configure worksheet and column selection, rename and reorder fields, and set the export button label and filename.

## Use the hosted extension

The production manifest is [`DashboardDataExport.trex`](DashboardDataExport.trex). It points to the GitHub Pages site:

**https://mahesh-m-web.github.io/Extract_Tableau/**

In Tableau Public or Tableau Desktop, add an **Extension** object to a dashboard, choose **My Extensions**, and select the production `.trex` manifest. Approve the extension only if you trust the source and the workbook data access it requests. In the Configure dialog, select one or more worksheets and save changes before exporting.

This is a project site under the repository path `/Extract_Tableau`. Its static files and app routes are built with that base path in mind.

## Local development

Install Node.js (npm is included), then in a terminal at the project folder run:

```text
npm install
npm start
```

Keep the server terminal open. In Tableau, use [`DashboardDataExport.local.trex`](DashboardDataExport.local.trex), which points to `http://localhost:3000`. Do not use that local manifest when distributing the hosted extension.

## Build and deployment

GitHub Actions builds the static app and deploys it to GitHub Pages on pushes to `main` and when manually run from the Actions tab. The production manifest is copied into the build output. For local production builds, run `npm run release`.

See [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) for prerequisites, GitHub Pages setup, hosting details, and troubleshooting.

## Data handling

The extension reads worksheet summary data through the Tableau Extensions API. It generates and downloads the workbook in the user's browser; the project does not upload workbook data to the hosting site. The manifest requests Tableau's full data permission.
