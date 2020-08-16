# MSG to PDF

Convert MSG Outlook files to PDF.

## Installation

Install via NPM either globally as:

```sh
npm i -g msg-to-pdf
```

or in your project with:

```sh
npm i msg-to-pdf
```

## Usage

To use as a global module, 

```sh
msg-to-pdf <path-to-msg-file>
```

or

```sh
msg-to-pdf <path-to-directory-containing-msg-files>
```

To use within your project,

```js
const convertToPdf = require("msg-to-pdf");

convertToPdf("path-to-msg-file")
    .then(() => {
        // do something
    });
```