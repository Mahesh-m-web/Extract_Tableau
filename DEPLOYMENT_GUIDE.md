# Tableau extension setup and deployment

This project is a static Tableau dashboard extension. It reads worksheet summary data through Tableau's Extensions API and creates the Excel workbook in the user's browser. It does not need a separate application server or database.

## Use the hosted extension

The production site URL is:

```text
https://mahesh-m-web.github.io/Extract_Tableau/
```

Use the production manifest [`DashboardDataExport.trex`](DashboardDataExport.trex) in Tableau Public 2025.1 or Tableau Desktop:

1. Add an **Extension** object to a dashboard.
2. Choose **My Extensions** and select `DashboardDataExport.trex`.
3. Approve the extension only if you trust it and its requested data access.
4. Open the extension's configuration, select at least one worksheet, then select **Save Changes**.
5. Export the selected worksheet data.

The production manifest points to GitHub Pages, not localhost. GitHub Pages project sites are served below the repository name, so the app build sets `/Extract_Tableau` as its asset and router base. The Pages workflow deploys the complete `build/` directory.

## Local development prerequisites

- Install Node.js. npm is bundled with Node.js.
- Have Tableau Public or Tableau Desktop available for testing.
- You do not need Node.js installed on each Tableau user's computer to use the hosted extension.

Check installation in Command Prompt or PowerShell:

```text
node --version
npm --version
```

Open a terminal in the project folder, install dependencies, and start the development server:

```text
npm install
npm start
```

Keep that terminal open. For local testing, add [`DashboardDataExport.local.trex`](DashboardDataExport.local.trex) in Tableau; it points to `http://localhost:3000`. The production manifest is `DashboardDataExport.trex` and points to GitHub Pages. Use the correct manifest for the environment.

If `npm start` reports port 3000 is already in use, the server may already be running. Stop the other server with Ctrl+C in its terminal, or continue using it if it serves this project. If you change the development port, update the local `.trex` source URL to match.

## GitHub Pages publishing

The workflow at `.github/workflows/deploy-pages.yml` runs on pushes to `main` and manual dispatch. It installs the locked npm dependencies, builds the app with the correct project-site base path, and deploys the full static output. After a successful GitHub Actions run, the site is available at:

```text
https://mahesh-m-web.github.io/Extract_Tableau/
```

For a change to appear on the site, commit and push it to `main`, then wait for the **Build and deploy Tableau extension** workflow to finish successfully. In GitHub repository **Settings → Pages**, the publishing source should be **GitHub Actions**. The repository must allow Pages and Actions to deploy. GitHub Pages serves public websites; do not put credentials, private data, or secrets in the repository or build.

To produce a local build, run:

```text
npm run release
```

The output is in `build/`. The automated GitHub Pages workflow applies `PUBLIC_URL=/Extract_Tableau` and `REACT_APP_ROUTER_BASENAME=/Extract_Tableau` during the production build. Keep these values aligned with the repository name if the repository is renamed.

## Manifest URLs and hosting elsewhere

The production URL is recorded in both `DashboardDataExport.trex` and `public/DashboardDataExport.trex`. Keep them in sync. If hosting on a different HTTPS server, update the `<source-location><url>` and author website in both manifests to the final HTTPS URL, and update the build asset base and router basename to match the hosted path. Rebuild and deploy the complete `build/` directory. Remote Tableau extension hosts should use HTTPS with a valid certificate. Local development is the `http://localhost` exception.

For the GitHub Pages deployment in this repository, the author website and source URL are set to `https://mahesh-m-web.github.io/Extract_Tableau/`.

## Permissions and data handling

The manifest requests Tableau's **full data** permission because the extension reads summary data from worksheets. Tableau may show a permission prompt, and Tableau Public or Desktop security settings can restrict extensions. The user must trust/allow the extension for the workbook. The generated Excel file is downloaded locally in the user's browser; worksheet data is not uploaded by this app to GitHub Pages.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `node` or `npm` is not recognized | Install Node.js, reopen the terminal, then check `node --version` and `npm --version`. |
| Tableau cannot open the hosted app | Check the GitHub Actions run, confirm Pages is enabled with **GitHub Actions** as source, and open the production site URL in a browser. |
| The page is blank or assets fail to load | Confirm the repository is still named `Extract_Tableau`, the workflow uses `/Extract_Tableau`, and Pages deployment completed successfully. |
| Export says to select a worksheet | Open Configure → Select Sheets, check a worksheet, and save changes. |
| You need the Tableau embedded browser console | Launch Tableau with `--webEngineArgs --remote-debugging-port=8696` after the quoted executable path. Find that path from the Tableau shortcut's **Properties → Target**. Open `http://localhost:8696` in Chrome while Tableau and the extension are running. Keep the debugging port local; do not expose it to a network. |
