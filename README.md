# bc-app-count-report

Custom report that shows related Application Count to Business Capabilities, as a horizontal bar chart.

## Prerequisites
* [GIT](https://git-scm.com/)
* [NodeJS LTS or later](git@github.com:leanix-public/bc-app-count-report.git)
* A valid LeanIX Workspace API token for uploading the report
## Installation

1. Clone the project repository into your computer using the following command:
    ```git clone git@github.com:leanix-public/bc-app-count-report.git```
2. Switch into the project folder and install the dependencies with ```npm install```

3. Create a ```lxr.json``` file with the following content:
   ```json
   {
    "host": "your leanix workspace instance, e.g. app.leanix.net",
    "apitoken": "your api token"
   }
   ```
4. Upload the report into your workspace using the following command:
  ```npm run upload```
