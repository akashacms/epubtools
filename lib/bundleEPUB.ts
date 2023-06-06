
import { promises as fsp, default as fs } from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import xmldom from '@xmldom/xmldom';
import * as utils from './utils.js';
// import util from 'util';
// import * as metadata from './metadata';
import * as manifest from './manifest';
import * as opf from './opf';
import * as checkEPUB from './checkEPUB';
import * as configurator from './Configuration.js';
import { Configuration } from './Configuration.js';

/**
 * Package the book described by the configuration.
 * @param config The {@link Configuration} object
 */
export async function bundleEPUB(config: Configuration): Promise<void> {
    // read container.xml -- extract OPF file name
    // read OPF file
    // write mimetype file
    // write container.xml
    // write OPF file
    // for each entry in OPF - write that file
    // when done, finalize

    config.opfManifest = await manifest.from_fs(config);
    await checkEPUB.checkEPUBConfig(config);
    await archiveFiles(config);
}

/**
 * Handle the `package` command from `cli.js`.
 * @param configFN The file name for the {@link Configuration} file
 */
export async function doPackageCommand(configFN: string): Promise<void> {
    const bookConfig = await configurator.readConfig(configFN);
    await bookConfig.readTOCData();
    await bundleEPUB(bookConfig);
}

/**
 * Constructs the EPUB file from the files and data held in the {@link Configuration}
 * @param config THe {@link Configuration} object
 */
async function archiveFiles(config: Configuration): Promise<void> {

    // console.log(`archiveFiles`);
    const rendered = config.renderedFullPath;
    const epubFileName = path.join(config.configDirPath, config.epubFileName);
    const opfFileName = config.bookOPF;
    // console.log(`archiveFiles reading OPF config.renderedFullPath ${config.renderedFullPath} opfFileName ${opfFileName}`);

    // Don't readOPF but instead use the constructed OPFXML object below.
    /* const { 
        opfXmlText, opfXml 
    } = await metadata.readOPF(config.renderedFullPath, opfFileName);  */
    
    // console.log(`archiveFiles rendered ${rendered} epubFileName ${epubFileName} opfFileName ${opfFileName}`);

    const opfDirName = path.dirname(opfFileName);

    return new Promise(async (resolve, reject) => {
        try {
            const archive = archiver('zip');
            
            const output = fs.createWriteStream(epubFileName);
                    
            output.on('close', () => {
                // logger.info(archive.pointer() + ' total bytes');
                // logger.info('archiver has been finalized and the output file descriptor has closed.');
                resolve(undefined);
            });
            
            archive.on('error', err => {
                // logger.info('*********** BundleEPUB ERROR '+ err);
                reject(err);
            });
            
            archive.pipe(output);

            // The mimetype file must be the first entry, it must have the
            // textual content shown here, and it must not be compressed
            // console.log(`reading ${path.join(rendered, "mimetype")} into archive`);
            archive.append(
                "application/epub+zip",
                { name: "mimetype", store: true });

            // Previously this function ran the functions to regenerate these
            // meta files.  It was decided it made more sense for this function
            // to simply package the files, and to provide a different command to
            // generate the meta files.
            //
            // The reasoning is that another tool might be generating correct meta files
            // and how can the archive function have a clearer ide of what should
            // be in the meta files?

            const container_xml = path.join("META-INF", "container.xml");

            archive.append(
                fs.createReadStream(path.join(rendered, container_xml)),
                { name: container_xml }
            );

            archive.append(
                fs.createReadStream(path.join(rendered, opfFileName)),
                { name: opfFileName }
            );

            if (config.doGenerateNCX) {
                archive.append(
                    fs.createReadStream(path.join(rendered, config.sourceBookNCXHREF)),
                    { name: config.sourceBookNCXHREF }
                );
            }

            const OPFXML = await opf.readOpf(path.join(rendered, opfFileName));

            const manifests = OPFXML.getElementsByTagName("manifest");
            let manifest;
            for (const elem of utils.nodeListIterator(manifests)) {
                if (elem.nodeName.toUpperCase() === 'manifest'.toUpperCase()) manifest = elem;
            }
            if (manifest) {
                const items = manifest.getElementsByTagName('item');
                for (const item of utils.nodeListIterator(items)) {
                    if (item.nodeName.toUpperCase() === 'item'.toUpperCase()) {
                        const itemHref = item.getAttribute('href');
                        
                        // Don't archive these files because they've already
                        // been added earlier
                        const normalizedPath = path.normalize(path.join(opfDirName, itemHref));
                        if (itemHref === "mimetype"
                         || itemHref === opfFileName
                         || itemHref === container_xml
                         || (config.doGenerateNCX && normalizedPath === config.sourceBookNCXHREF)) {
                            // Skip these special files
                            // console.log(`skipping ${itemHref}`);
                            continue;
                        }

                        // console.log(`packaging ${itemHref} - ${normalizedPath}`);
                        
                        archive.append(
                            fs.createReadStream(path.join(rendered, opfDirName, itemHref)),
                            { name: normalizedPath }
                        );
                    }
                }
            }
            
            archive.finalize();

        } catch(e) { reject(e); }
    });

}

/**
 * Creates text to be stured as `container.xml` in the EPUB
 * @param config The {@link Configuration} object
 * @returns The text of the `container.xml` file
 */
async function mkContainerXmlFile(config: Configuration): Promise<string> {
    
    // util.log('createContainerXmlFile '+ rendered +' '+ util.inspect(bookYaml));
    
    if (!config.bookOPF && config.bookOPF === '' && !config.containerRootfiles) {
        throw new Error(`No OPF file specified in ${config.projectName}`);
    }

    const containerXml = new xmldom.DOMParser().parseFromString(
        `<?xml 
                version="1.0" 
                encoding="utf-8" 
                standalone="no"?>
        <container 
                xmlns="urn:oasis:names:tc:opendocument:xmlns:container" 
                version="1.0">
    	<rootfiles> </rootfiles>
        </container>
    `, 'text/xml');

    //	<%
    //    rootfiles.forEach(function(rf) {
    //    %>
    //    <rootfile full-path="<%= rf.path %>" media-type="<%= rf.type %>"/><%
    //    });
    //    %>

    const rootfiles = containerXml.getElementsByTagName("rootfiles");
    let rfs;
    // util.log(util.inspect(rootfile));
    for (let rfnum = 0; rfnum < rootfiles.length; rfnum++) {
        const elem = rootfiles.item(rfnum);
        if (elem.nodeName.toUpperCase() === 'rootfiles'.toUpperCase()) rfs = elem;
    }

    const addElem = (rfs, path, _mime) => {
        const elem = containerXml.createElement('rootfile');
        const mime = _mime ? _mime : 'application/oebps-package+xml';
        // ??? if (mime === 'application/oebps-package+xml') addedOPF = true;
        elem.setAttribute('full-path', path);
        elem.setAttribute('media-type', mime);
        rfs.appendChild(elem);
    }

    if (rfs) {
        if (config.bookOPF && config.bookOPF !== '') {
            addElem(rfs, config.bookOPF, undefined);
        }
        if (config.containerRootfiles) {
            for (const rootfile of config.containerRootfiles) {
                if (config.bookOPF 
                && config.bookOPF !== '' 
                && config.bookOPF !== rootfile.fullpath) {
                    addElem(rfs, rootfile.fullpath, rootfile.mime);
                }
            }
        }
    }

    return new xmldom.XMLSerializer().serializeToString(containerXml);
}

// DONE First, test the mkmeta function to make sure the meta files are created correctly
// DONE Second, in archiveFiles the functions should only read files rather than create them
// TODO Third, in akasharender-epub remove the doMeta function and command
// TODO Fourth, is it possible to organize these around Classes that have Methods?

/**
 * Creates the metadata files, `container.xml`, the OPF file and the NCX file.
 * @param config The {@link Configuration} object
 */
export async function doMeta(config: Configuration): Promise<void> {
    // console.log(`doMeta renderedFullPath ${config.renderedFullPath}`);
    // await fs.mkdirs(config.renderedFullPath);
    await fsp.mkdir(config.renderedFullPath, { recursive: true });

    await fsp.writeFile(path.join(config.renderedFullPath, "mimetype"),
                                    "application/epub+zip", 'utf8');

    const container_xml = path.join("META-INF", "container.xml");
    const container_xml_full = path.join(config.renderedFullPath, container_xml);
    // await fs.mkdirs(path.dirname(container_xml_full));
    await fsp.mkdir(path.dirname(container_xml_full), { recursive: true });
    const CONTAINERXML = await mkContainerXmlFile(config);
    await fsp.writeFile(container_xml_full, CONTAINERXML, 'utf8');

    const OPFXML = await opf.makeOpfXml(config);
    const OPFTXT = new xmldom.XMLSerializer().serializeToString(OPFXML);
    await fsp.writeFile(path.join(config.renderedFullPath, config.bookOPF), OPFTXT, 'utf8');

    if (config.doGenerateNCX) {
        const NCXXML = await opf.makeNCXXML(config);
        const ncx = new xmldom.XMLSerializer().serializeToString(NCXXML);
        await fsp.writeFile(path.join(config.renderedFullPath, config.sourceBookNCXHREF), ncx, 'utf8');
    }
}

/**
 * Handles the `mkmeta` command from `cli.js`
 * @param configFN The name of the {@link Configuration} file
 */
export async function doMkMetaCommand(configFN: string): Promise<void> {
    const bookConfig = await configurator.readConfig(configFN);
    await bookConfig.check();
    bookConfig.opfManifest = await manifest.from_fs(bookConfig);
    await doMeta(bookConfig);
}
