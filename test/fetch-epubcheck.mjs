
import fs   from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import stream from 'stream';
import util from 'util';
import fetch from 'node-fetch';
import tempy from 'tempy';
import Zip from 'adm-zip';

const epubcheckVersion = process.argv[2];

const streamPipeline = util.promisify(stream.pipeline);

const checkerURL = `https://github.com/IDPF/epubcheck/releases/download/v${epubcheckVersion}/epubcheck-${epubcheckVersion}.zip`;
const saveToDir = '.'; // `epubcheck-${epubcheckVersion}`;

await fsp.mkdir(saveToDir, { recursive: true });

const ZIP_FILE = tempy.file({ extension: 'zip' });

const response = await fetch(checkerURL);

if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);

await streamPipeline(response.body, 
        fs.createWriteStream(ZIP_FILE));

let zip = new Zip(ZIP_FILE);
zip.extractAllTo(saveToDir);

await fsp.unlink(ZIP_FILE);
