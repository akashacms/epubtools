
import { promises as fs } from 'node:fs';
import path from 'node:path';
// import util from 'node:util';

import xmldom from '@xmldom/xmldom';
import * as utils from './utils.js';

/**
 * Defines the data type holding `container.xml` data which
 * is returned from {@link readContainerXml}.
 * 
 * Note that `containerXml` is marked as `any`.  This is because
 * the `@xmldom/xmldom` does not export the internal class, `Document`,
 * which is returned by `parseFromString`.
 */
export type ContainerXMLData = {
    containerXmlText: string,
    containerXml: any
};

/**
 * Reads the `container.xml` file from the EPUB directory.
 * 
 * @param epubDir The path name of the directory
 * @returns A simple object ({@link ContainerXMLData}) describing the `container.xml` data
 */
export async function readContainerXml(epubDir: string): Promise<ContainerXMLData> {
    try {
        const data = await fs.readFile(
            path.join(epubDir, "META-INF", "container.xml"), 
            'utf8');
        return <ContainerXMLData>{
            containerXmlText: data,
            containerXml: new xmldom.DOMParser().parseFromString(data, 'text/xml')
        };
    } catch (e) {
        console.error(`readContainerXml WARNING ${e.stack}`);
        return undefined;
    }
}

export type RootFileData = {
    fullpath: string, mime: string
};

/**
 * From the `container.xml` file, look for any `rootfile` elements, returning
 * a descriptive object ({@link RootFileData}) for each.
 * 
 * @param containerXml The _Document_ of the `container.xml` file
 * @returns An array of {@link RootFileData} objects
 */
export function findRootfiles(containerXml) {
    const rootfiles = [];

    for (const rootfile of utils.nodeListIterator(
        containerXml.getElementsByTagName("rootfile")
    )) {
        rootfiles.push(<RootFileData>{
            fullpath: rootfile.getAttribute('full-path'),
            mime: rootfile.getAttribute('media-type')
        });
    }
    // console.log(util.inspect(rootfiles));
    return rootfiles;

}

// MOOT - finds a single OPF file name
export function findOpfFileName(containerXml) {
    const rootfiles = containerXml.getElementsByTagName("rootfile");
    // console.log(util.inspect(rootfile));
    let rootfile;
    for (let rfnum = 0; rfnum < rootfiles.length; rfnum++) {
        const elem = rootfiles.item(rfnum);
        if (elem.nodeName.toUpperCase() === 'rootfile'.toUpperCase()) rootfile = elem;
    }
    if (!rootfile) throw new Error('No rootfile element in container.xml');
    return rootfile.getAttribute('full-path');
}

type OPFData = {
    opfXmlText: string,
    opfXml: any
};

/**
 * Reads the OPF file from the EPUB, parsing it to an XML Document.
 * 
 * @param epubDir The directory where the EPUB files are stored
 * @param opfName The file name of the OPF file
 * @returns An object ({@link OPFData}) for the OPF file
 */
export async function readOPF(epubDir: string, opfName: string): Promise<OPFData> {
    const file2read = path.join(epubDir, opfName);
    try {
        // console.log(`readOPF ${file2read}`);
        const data = await fs.readFile(file2read, 'utf8');
        return <OPFData>{
            opfXmlText: data,
            opfXml: new xmldom.DOMParser().parseFromString(data, 'text/xml')
        };
    } catch (e) {
        console.log(`readOPF ${file2read} FAIL because ${e.stack}`);
        return <OPFData>{
            opfXmlText: undefined,
            opfXml: undefined
        };
    }
}

export type XHTMLData = {
    xhtmlText: string,
    xhtmlDOM: any
};

/**
 * Reads the XHTML file, returning an object ({@link XHTMLData}) containing
 * the text which was read, and the parsed XML Document.
 * 
 * @param epubDir The directory for the EPUB data
 * @param xhtmlName The file name for the file to read
 * @returns An object ({@link XHTMLData}) containing data read from the file
 */
export async function readXHTML(epubDir: string, xhtmlName: string): Promise<XHTMLData> {
    const file2read = path.join(epubDir, xhtmlName);
    // console.log(`readXHTML ${file2read}`);
    try {
        const data = await fs.readFile(file2read, 'utf8');
        return <XHTMLData>{
            xhtmlText: data,
            xhtmlDOM: new xmldom.DOMParser().parseFromString(data, 'application/xhtml+xml')
        };
    } catch (e) {
        console.error(`epubtools metadata readXHTML ${file2read} FAIL because ${e.stack}`);
        return undefined;
    }
}