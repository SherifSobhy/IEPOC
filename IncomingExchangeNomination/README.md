# Incoming Exchange nomination UI draft

This is a **local UI prototype**, not an implemented Power Pages multistep form or a React application. It shows the proposed custom-page experience with plain, commented JavaScript so the page and code volume are easy to inspect. No Dataverse table, API, sign-in, web role or Blob Storage is used. Sample records are saved in this browser's `localStorage`.

## Open it now

Open `index.html` in a browser. Try **Start a new Nomination**, **Save and Next**, return to **My Nominations**, then **Continue draft**. Open the submitted sample to see read-only mode. To reset sample data, clear this page's browser storage key `qub-nomination-ui-draft-v1` and refresh.

The files are:

| File | Purpose |
| --- | --- |
| `index.html` | Standalone local preview shell |
| `styles.css` | Responsive QUB-inspired layout |
| `app.js` | Mock record storage, section navigation, review and validation |
| `power-pages-template.html` | Page body to copy into a DEV Power Pages Web Template |

## Create a DEV Power Pages preview later

These are **instructions for a person to follow**, not a deployment performed by this prototype.

1. In the QUB Portal's Portal Management app, create a **Web Page** named `Exchange Nominations Preview` with partial URL `exchange-nominations-preview`. Keep its publishing state **Draft** until the page is ready for approved testers. Use an existing parent page appropriate for the portal.
2. Create two **Web Files** under that page: partial URL `nomination-preview.css` with the contents of `styles.css`, and `nomination-preview.js` with the contents of `app.js`. Set their content disposition to **Inline**. If the environment blocks JavaScript attachments, an administrator must review the environment's blocked file extensions before the JS file can be uploaded.
3. Create a **Web Template** named `EXC Nomination Preview` and paste the contents of `power-pages-template.html` into its Source field. Check the two Web File URLs against the actual page hierarchy.
4. Create a **Page Template** of type **Web Template**, select `EXC Nomination Preview`, and keep **Use Website Header and Footer** enabled. Assign it to the preview Web Page.
5. Preview as a portal content manager. For any other tester, configure a restricted preview web role and page permission first. Do not give the preview page to the default Authenticated Users role.

The current template uses sample records in the browser. It does not need a nomination table or Web API settings. The real feature will replace `loadRecords()` / `saveRecords()` with a data adapter, implement server-side submission rules, and configure Nominator page and table permissions. Uploads remain a separate future component. The exact fields and dropdown choices must be taken from story 19124's data dictionary; the illustrative values here are not the approved dictionary.

## What this helps decide

The prototype lets you judge the layout, copy, navigation and approximate amount of code for a **custom page**. A native multistep form is configured largely in Power Pages and cannot be fairly measured by this JavaScript line count. Its record binding, resume behaviour and future built-in attachments remain the key reasons to compare it in a separate DEV proof of concept once the table exists.
