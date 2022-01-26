
import xmldom from '@xmldom/xmldom';
import { promises as fs } from 'fs';
import path from 'path';
import util from 'util';
import * as utils from './utils.js';


export async function readContainerXml(epubDir) {
    try {
        const data = await fs.readFile(
            path.join(epubDir, "META-INF", "container.xml"), 
            'utf8');
        return {
            containerXmlText: data,
            containerXml: new xmldom.DOMParser().parseFromString(data, 'text/xml')
        };
    } catch (e) {
        console.error(`readContainerXml WARNING ${e.stack}`);
        return undefined;
    }
};

export function findRootfiles(containerXml) {
    var rootfiles = [];

    for (let rootfile of utils.nodeListIterator(
        containerXml.getElementsByTagName("rootfile")
    )) {
        rootfiles.push({
            fullpath: rootfile.getAttribute('full-path'),
            mime: rootfile.getAttribute('media-type')
        });
    }
    // console.log(util.inspect(rootfiles));
    return rootfiles;

};

// MOOT - finds a single OPF file name
export function findOpfFileName(containerXml) {
    var rootfiles = containerXml.getElementsByTagName("rootfile");
    // console.log(util.inspect(rootfile));
    var rootfile;
    for (var rfnum = 0; rfnum < rootfiles.length; rfnum++) {
        var elem = rootfiles.item(rfnum);
        if (elem.nodeName.toUpperCase() === 'rootfile'.toUpperCase()) rootfile = elem;
    }
    if (!rootfile) throw new Error('No rootfile element in container.xml');
    return rootfile.getAttribute('full-path');
};

export async function readOPF(epubDir, opfName) {
    const file2read = path.join(epubDir, opfName);
    try {
        // console.log(`readOPF ${file2read}`);
        const data = await fs.readFile(file2read, 'utf8');
        return {
            opfXmlText: data,
            opfXml: new xmldom.DOMParser().parseFromString(data, 'text/xml')
        };
    } catch (e) {
        console.log(`readOPF ${file2read} FAIL because ${e.stack}`);
        return {
            opfXmlText: undefined,
            opfXml: undefined
        };
    }
};

export async function readXHTML(epubDir, opfName) {
    const file2read = path.join(epubDir, opfName);
    // console.log(`readXHTML ${file2read}`);
    try {
        const data = await fs.readFile(file2read, 'utf8');
        return {
            xhtmlText: data,
            xhtmlDOM: new xmldom.DOMParser().parseFromString(data, 'application/xhtml+xml')
        };
    } catch (e) {
        console.error(`epubtools metadata readXHTML ${file2read} FAIL because ${e.stack}`);
        return undefined;
    }
};