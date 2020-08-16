#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { default: MsgReader } = require("@freiraum/msgreader/lib/MsgReader");
const { urlRegex } = require("./utils");
const pdf = require("html-pdf");

const msgPath = process.argv[2];

if (!fs.existsSync(msgPath)) {
  console.error(
    "Please specify a valid MSG file path, or a directory path containing MSG files"
  );
  process.exit(1);
}
if (require.main === module) {
  if (fs.lstatSync(msgPath).isDirectory()) {
    const files = fs.readdirSync(msgPath);
    const msgFiles = files
      .filter(Boolean)
      .filter((file) => file.endsWith(".msg"))
      .map((file) => path.join(msgPath, file));
    recurseDir(msgFiles);
  } else {
    convertToPDF(msgPath);
  }
}
else {
    module.exports = convertToPDF;
}

function recurseDir(files) {
  const msgFile = files[0];
  if (msgFile) {
    convertToPDF(msgFile).finally(() => {
      recurseDir(files.slice(1));
    });
  }
}

function convertToPDF(msgFilePath) {
  console.log(`Processing ${msgFilePath}`);
  const buffer = fs.readFileSync(msgFilePath);
  const reader = new MsgReader(buffer);
  const msg = reader.getFileData();

  const from = getFromAddress(msg.headers);
  const to = msg.recipients.map(({ name }) => name);
  const date = getDate(msg.headers);
  const subject = msg.subject;
  const body = msg.body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${renderWithLinks(line)}</p>`)
    .join("\n");

  const html = renderHTML({ from, to, date, subject, body });

  return new Promise((resolve, reject) => {
    pdf.create(html).toStream(function (err, stream) {
      if (err) {
        reject(err);
      } else {
        stream
          .pipe(fs.createWriteStream(`${msgFilePath}.pdf`))
          .on("finish", () => {
            console.log(`==> ${msgFilePath}.pdf`);
            resolve();
          });
      }
    });
  });
}

function getFromAddress(str) {
  const [line] = str.match(/From\: .+\r/) || [""];
  const [_, fromAddress] = line.match(/<(.+)>/) || ["", ""];
  return fromAddress;
}

function getDate(str) {
  const [_, date] = str.match(/Date\: (.+)\r/) || ["", ""];
  return date;
}

function renderHTML({ from, to, date, subject, body }) {
  const css = fs.readFileSync("./style.css", "utf8");
  return `
        <style>
            ${css}
        </style>
        <div class="bg-white body">
            <header>
                <p class="font-bold"><a href="mailto:${from}">${from}</a></p>
                <p class="text-xs text-gray">${date}</p>
                <p class="text-xs text-gray">To: <a href="mailto:${to}">${to}</a></p>
                <p class="text-xs font-bold">${subject}</p>
            </header>
            <hr />
            <main>
                ${body}
            </main>
        </div>
    `;
}

function renderWithLinks(line) {
  return line.replace(new RegExp(`<(.+)>`, "g"), `<a href="$1">$1</a>`);
}
