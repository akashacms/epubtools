
import { promises as fs } from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import url from 'node:url';

import glob from 'tiny-glob';
import * as mime from 'mime';
import cheerio from 'cheerio';
import xmldom from '@xmldom/xmldom';
// import * as metadata from './metadata.js';
import * as utils from './utils.js';
import { Configuration } from './Configuration.js';

export class Manifest extends Array {

    constructor(toimport) {
        super();
        if (toimport) {
            for (const item of toimport) {
                this.push(new exports.ManifestItem(item));
            }
        }
    }

    /**
     * Finds a {@link ManifestItem} 
     * 
     * @param id The ID code for a {@link ManifestItem}
     * @returns The matching {@link ManifestItem}
     */
    byID(id: string): ManifestItem {
        for (const item of this) {
            if (item.id === id) return item;
        }
        return undefined;
    }

    /**
     * Finds a {@link ManifestItem} 
     * 
     * @param path2find The file name for a {@link ManifestItem}
     * @returns The matching {@link ManifestItem}
     */
    byPath(path2find: string): ManifestItem {
        for (const item of this) {
            // console.log(`byPath ${item.path} === ${path2find}`);
            if (item.path === path2find) return item;
        }
        return undefined;
    }

    /**
     * Returns an array of {@link ManifestItem} items that are in the _spine_
     * 
     * @returns Array of matching items
     */
    get spine(): ManifestItem[] {
        const spine = this.filter(item => {
            if (item.in_spine) return true; // spine.push(item);
            else return false;
        });
        // spine.sort ...
        spine.sort((a, b) => {
            if (a.spine_order < b.spine_order) return -1;
            if (a.spine_order > b.spine_order) return 1;
            return 0;
        });
        return spine;
    }

    /**
     * Either updates a {@link ManifestItem} or adds a new one to the {@link Manifest}.
     * If the item already exists, it is updated, and otherwise it is
     * added.
     * 
     * @param newItem The new {@link ManifestItem} to add or update
     */
    addItem(newItem: ManifestItem): void {
        const mItem = this.byPath(newItem.path);
        if (mItem) {
            mItem.basedir = newItem.basedir;
            mItem.path = newItem.path;
            mItem.id = typeof newItem.id !== 'undefined' ? newItem.id : "";
            mItem.suppress
                = typeof newItem.suppress !== 'undefined' 
                    ? newItem.suppress : false;
            mItem.in_spine
                = typeof newItem.in_spine !== 'undefined' 
                    ? newItem.in_spine : false;
            mItem.spine_order
                = typeof newItem.spine_order !== 'undefined' 
                    ? newItem.spine_order : -1;
        } else {
            this.push(new ManifestItem(newItem));
        }
    }

    /**
     * Adds an array of items to the {@link Manifest}
     * 
     * @param items Array of {@link ManifestItem} items
     */
    addItems(items: ManifestItem[]): void {
        for (const f of items) {
            this.addItem(f);
        }
    }

    // It seems this function was never invoked, never tested.
    // The only execution is in a function in index.ts that is
    // itself not tested and commented-out

    /* checkItemsFromOPF(opfManifest) {

        // Maybe this does not belong here since it is presumed to be part of a process driven elsewhere
        // Maybe instead this belongs in that place

        // The assumption is config.opfManifest was built by using from_fs first and 
        // second to scan what is in an OPF file 

        // Ergo the from_fs stage cannot get a lot of the details which are in the OPF 

        for (let mItem of opfManifest) {
            // What did it mean to prefix this with "config."?
            // This doesn't make sense.
            let existing = /*config.*--/opfManifest.byPath(mItem.path);

            if (existing) {
                existing.seen_in_opf = true;
                if (typeof mItem.id !== 'undefined') existing.id = mItem.id;
                if (typeof mItem.mime !== 'undefined') existing.mime = mItem.mime;
                if (typeof mItem.mimeoverride !== 'undefined') existing.mimeoverride = mItem.mimeoverride;
                if (typeof mItem.is_nav !== 'undefined') existing.is_nav = mItem.is_nav;
                if (typeof mItem.nav_id !== 'undefined') existing.nav_id = mItem.nav_id;
                if (typeof mItem.nav_path !== 'undefined') existing.nav_path = mItem.nav_path;
                if (typeof mItem.properties !== 'undefined') existing.properties = mItem.properties;
                if (typeof mItem.is_cover_image !== 'undefined') existing.is_cover_image = mItem.is_cover_image;
                if (typeof mItem.cover_id !== 'undefined') existing.cover_id = mItem.cover_id;
                if (typeof mItem.cover_path !== 'undefined') existing.cover_path = mItem.cover_path;
                if (typeof mItem.is_mathml !== 'undefined') existing.is_mathml = mItem.is_mathml;
                if (typeof mItem.is_scripted !== 'undefined') existing.is_scripted = mItem.is_scripted;
                if (typeof mItem.is_svg !== 'undefined') existing.is_svg = mItem.is_svg;
                if (typeof mItem.is_remote_resources !== 'undefined') existing.is_remote_resources = mItem.is_remote_resources;
                if (typeof mItem.is_switch !== 'undefined') existing.is_switch = mItem.is_switch;
                if (typeof mItem.suppressOPF !== 'undefined') existing.suppressOPF = mItem.suppressOPF;
                if (typeof mItem.suppress !== 'undefined') existing.suppress = mItem.suppress;
                if (typeof mItem.in_spine !== 'undefined') existing.in_spine = mItem.in_spine;
                if (typeof mItem.spine_order !== 'undefined') existing.spine_order = mItem.spine_order;
                if (typeof mItem.linear !== 'undefined') existing.linear = mItem.linear;
            } else {
                console.log(`checkItemsFromOPF OPF has item not in file system ${util.inspect(mItem)}`);
            }
        }

    } */


    /**
     * First removes all existing {@link ManifestItem} objects from manifest,
     * then adds the new ones.
     * 
     * @param newItems Array of {@link ManifestItem} objects
     */
    replaceItems(newItems: ManifestItem[]): void {
        while (this.length > 0) {
            this.pop();
        }
        this.addItems(newItems);
    }

    /**
     * Remove a {@link ManifestItem} from the {@link Manifest}.
     * 
     * @param path2remove The path of the item to remove.
     */
    remove(path2remove: string): void {
        for (const item of this) {
            if (item.path === path2remove) {
                const i = this.indexOf(item);
                if (i !== -1) {
                    this.splice(i, 1);
                }
            }
        }
    }

}

export class ManifestItem {
    constructor(item) {
        this.id = typeof item.id !== 'undefined' ? item.id : "";
        this.basedir = typeof item.basedir !== 'undefined' ? item.basedir : "";
        this.path = typeof item.path !== 'undefined' ? item.path : "--unknown--";
        this.dirname = typeof item.dirname !== 'undefined' ? item.dirname : "";
        this.filename = typeof item.filename !== 'undefined' ? item.filename : "";
        this.mime = typeof item.mime !== 'undefined' ? item.mime : "";
        this.mimeoverride = typeof item.mimeoverride !== 'undefined' ? item.mimeoverride : "";
        if (typeof item.is_nav !== 'undefined' && item.is_nav) {
            this.nav_id = typeof item.id !== 'undefined' ? item.id : "";
            this.nav_path = typeof item.path !== 'undefined' ? item.path : "";
            this.is_nav = item.is_nav;
        } else {
            this.is_nav = false;
        }
        if (item.properties) this.properties = item.properties;
        if (typeof item.is_cover_image !== 'undefined' && item.is_cover_image) {
            this.cover_id = typeof item.id !== 'undefined' ? item.id : "";
            this.cover_path = typeof item.path !== 'undefined' ? item.path : "";
            this.is_cover_image = item.is_cover_image;
        } else {
            this.is_cover_image = false;
        }
        // TODO <meta name="cover" content="cover-img"/>
        this.is_mathml 
            = typeof item.is_mathml !== 'undefined' ? item.is_mathml : false;
        this.is_scripted 
            = typeof item.is_scripted !== 'undefined' ? item.is_scripted : false;
        this.is_svg 
            = typeof item.is_svg !== 'undefined' ? item.is_svg : false;
        this.is_remote_resources 
            = typeof item.is_remote_resources !== 'undefined' ? item.is_remote_resources : false;
        this.is_switch 
            = typeof item.is_switch !== 'undefined' ? item.is_switch : false;
        // TODO some additional item/itemref properties
        //     rendition:layout
        //     rendition:orientation
        //     rendition:spread
        //     rendition:page-spread-center
        this.suppressOPF 
            = typeof item.suppressOPF !== 'undefined' ? item.suppressOPF : false;
        this.suppress 
            = typeof item.suppress !== 'undefined' ? item.suppress : false;
        this.in_spine
            = typeof item.in_spine !== 'undefined' ? item.in_spine : false;
        this.spine_order
            = typeof item.spine_order !== 'undefined' ? item.spine_order : -1;
        if (typeof item.linear !== 'undefined') {
            this.linear = item.linear;
        }
        this.seen_in_opf = typeof item.seen_in_opf !== 'undefined' ? item.seen_in_opf : false;
        // console.log(util.inspect(this));
    }

    id: string;
    basedir: string;
    path: string;
    dirname: string;
    filename: string;
    mime: string;
    mimeoverride: string;
    nav_id: string;
    nav_path: string;
    is_nav: boolean;
    properties: string;
    cover_id: string;
    cover_path: string;
    is_cover_image: boolean;
    is_mathml: boolean;
    is_scripted: boolean;
    is_svg: boolean;
    is_remote_resources: boolean;
    is_switch: boolean;
    suppressOPF: boolean;
    suppress: boolean;
    in_spine: boolean;
    spine_order: number;
    linear: boolean;
    seen_in_opf: boolean;
}

/**
 * Returns an array of {@link ManifestItem} items that are in the _spine_
 * 
 * @param epubConfig The {@link Configuration} object
 * @returns An array of {@link ManifestItem} objects that are in the spine
 */
export function spineItems(epubConfig: Configuration): ManifestItem[] {
    if (!epubConfig || !epubConfig.opfManifest) return [];
    const spine = epubConfig.opfManifest.filter(item => {
        if (item.in_spine) return true;
        else return false;
    });
    // spine.sort ...
    spine.sort((a, b) => {
        if (a.spine_order < b.spine_order) return -1;
        if (a.spine_order > b.spine_order) return 1;
        return 0;
    });
    return spine;
}

/**
 * For {@link ManifestItem} objects that are in the spine, read the title
 * from the matching XHTML file, adding it as the _title_ field.
 * 
 * @param epubConfig The {@link Configuration} object
 */
export async function spineTitles(epubConfig: Configuration): Promise<void> {
    const epubdir = epubConfig.renderedFullPath;
    if (epubConfig.opfManifest) for (const item of epubConfig.opfManifest) {
        if (!item.in_spine) continue;
        // console.log(`spineTitles ${epubdir} ${item.path}`);
        const docpath = path.join(epubdir, item.path);
        const doctxt = await fs.readFile(docpath, 'utf8');
        const $ = cheerio.load(doctxt, {
            xmlMode: true,
            decodeEntities: true
        });
        const title = $('head title').text();
        // console.log(`spineTitles title ${title}`);
        item.title = title;
    }
}

let navolcount = 0;

function getNavOLChildrenXML(DOM, navol, tocdir) {
    const ret = [];
    const children = navol.childNodes;
    for (const child of utils.nodeListIterator(children)) {
        if (child.nodeType === 1 && child.tagName && child.tagName === 'li') { // ELEMENT_NODE
            const lichildren = child.childNodes;
            let item;
            let itemchildren;
            for (const lichild of utils.nodeListIterator(lichildren)) {
                if (lichild.nodeType === 1 && lichild.tagName && lichild.tagName === 'a') { // ELEMENT_NODE
                    const href = lichild.getAttribute('href');
                    let id;
                    const childid = child.getAttribute('id');
                    const liid = child.getAttribute('id');
                    // Get the ID value either from the <a>, or the containing <li>
                    // If neither have it, then concoct an ID.
                    if (childid && childid !== '') {
                        id = childid;
                    } else if (liid && liid !== '') {
                        id = liid;
                    } else {
                        id = `item${navolcount++}`;
                    }
                    item = {
                        text: lichild.textContent,
                        href: path.normalize(path.join(tocdir, href)),
                        id: id, //  lichild.getAttribute('id'),
                        children: []
                    };
                }
                if (lichild.nodeType === 1 && lichild.tagName && lichild.tagName === 'ol') { // ELEMENT_NODE
                    itemchildren = getNavOLChildrenXML(DOM, lichild, tocdir);
                }
            }
            if (itemchildren) item.children = itemchildren;
            // console.log(`getNavOLChildrenXML item ${util.inspect(item)}`);
            if (item) ret.push(item);
        }
    }
    return ret;
}

export async function tocData(epubConfig: Configuration) {

    // console.log(`tocData ${epubConfig.sourceBookTOCHREF} found ${util.inspect(found)}`);
    // console.log(`tocData ${epubConfig.sourceBookTOCHREF} renderer ${util.inspect(renderer)}`);

    const content = await fs.readFile(
                path.join(epubConfig.renderedFullPath, epubConfig.sourceBookTOCHREF), 
                'utf8');

    // console.log(`tocData ${epubConfig.sourceBookTOCHREF} content ${util.inspect(content)}`);

    const tocdom = new xmldom.DOMParser().parseFromString(content, 'application/xhtml+xml');
    if (!tocdom) {
        throw new Error(`epubtools tocData FAIL to read ${epubConfig.renderedFullPath} ${epubConfig.sourceBookTOCHREF}`);
    }
    // let tochtml = tocxhtml.xhtmlText;
    // let tocdom = tocxhtml.xhtmlDOM;
    const tocid   = epubConfig.sourceBookTOCID;
    const tocdir  = path.dirname(epubConfig.sourceBookTOCHREF);
    let tocnav;
    for (const nav of utils.nodeListIterator(
        tocdom.getElementsByTagName('nav')
    )) {
        // console.log(`tocData found nav epub:type ${nav.getAttribute('epub:type')} id ${nav.getAttribute('id')} tocid ${tocid}`);
        if (nav.getAttribute('epub:type') === 'toc' && nav.getAttribute('id') === tocid) {
            tocnav = nav;
            break;
        }
    }
    if (!tocnav) {
        throw new Error(`No nav epub:type===toc id===${tocid} in ${epubConfig.TOCpath}`);
    }
    const tocnavchildren = tocnav.childNodes;
    let tocnavrootol;
    for (const child of utils.nodeListIterator(tocnavchildren)) {
        if (child.nodeType === 1 && child.tagName && child.tagName === 'ol') { // ELEMENT_NODE
            tocnavrootol = child;
            break;
        }
    }
    if (!tocnavrootol) {
        throw new Error(`No root 'ol' node in nav epub:type===toc id===${tocid} in ${epubConfig.TOCpath}`);
    }
    navolcount = 0;
    const tocdata = getNavOLChildrenXML(tocdom, tocnavrootol, tocdir);
    return tocdata;
}

/**
 * Scans the file system, constructing {@link ManifestItem} items for each,
 * and ultimately constructing a {@link Manifest} object.
 * 
 * @param config The {@link Configuration} object
 * @returns Returns a {@link Manifest} object 
 */
export async function from_fs(config: Configuration): Promise<Manifest> {
    // console.log(`scanfiles epubdir ${epubdir}`);

    // TODO Should this scan the source directory or the rendered directory?
    // console.log(config.renderedFullPath);
    const filez = await glob('**', {
        cwd: config.renderedFullPath,
        dot: true,
        // absolute: true,
        filesOnly: true
    })

    // console.log(`files found in ${config.renderedFullPath}`, filez);

    // Remove directories
    const itemz = [];
    for (const filenm of filez) {
        // Do not include admin files
        if (filenm === 'mimetype') continue;
        if (filenm === 'META-INF/container.xml') continue;
        if (filenm === config.bookOPF) continue;
        let stats;
        // Only include files which can be stat'd and are not directories
        // console.log(item);
        const fullpath = path.join(config.renderedFullPath, filenm);
        try {
            stats = await fs.stat(fullpath);
        } catch (e) { continue; }
        if (!stats.isDirectory()) {
            // Modify the basedir to be renderedFullPath
            // Fill in other base ManifestItem fields
            const item = new ManifestItem({
                basedir: config.renderedPath,
                path: filenm,
                dirname: path.dirname(filenm),
                filename: path.basename(filenm),
                fullpath: fullpath,
                mime: mime.getType(filenm),
                // is_nav elsewhere
                mimeoverride: false,
                suppressOPF: false,
                suppress: false
            });
            if (item.mime === 'text/html') {
                item.mime = 'application/xhtml+xml';
            }
            item.in_spine = item.mime === 'text/html' || item.mime === 'application/xhtml+xml'
                ? true : false;
            item.seen_in_opf = false;
            if (config.sourceBookTOCHREF === item.path) {
                if (config.sourceBookTOCID) {
                    item.id = config.sourceBookTOCID;
                }
            }
            if (config.sourceBookCoverHTMLHREF === item.path) {
                if (config.sourceBookCoverHTMLID) {
                    item.id = config.sourceBookCoverHTMLID;
                }
            }
            if (config.sourceBookCoverHREF === item.path) {
                if (config.sourceBookCoverID) {
                    item.id = config.sourceBookCoverID;
                }
            }
            // console.log(`from_fs pushed  for ${filenm}`, item);
            itemz.push(item);
        }
    }
    let itemnum = 0;
    for (const item of itemz) {
        // console.log(`from_fs scan ${item.dirname} ${item.path} ${item.in_spine}`);
        if (!item.id) item.id = `item${itemnum++}`;
        if (item.in_spine) {
            try {
                const file2read = path.join(config.renderedFullPath, item.path);
                // console.log(`readXHTML ${file2read}`);
                const data = await fs.readFile(file2read, 'utf8');
                const $ = cheerio.load(data, {
                    xmlMode: true,
                    decodeEntities: true
                });
                $("nav").each((i, nav) => {
                    const navtype = $(nav).attr('epub:type');
                    // console.log(`from_fs scan ${item.path} has nav ${navtype}`);
                    if (navtype === 'toc') {
                        item.is_nav = true;
                        // item.id = config.sourceBookTOCID;
                        item.nav_path = item.path;
                        item.nav_id = item.id;
                    }
                });
                if (item.is_nav) {
                    let order = 0;
                    $("nav li > a").each((i, anchor) => {
                        const aHref = $(anchor).attr('href');
                        const aPath = path.normalize(
                            path.join(item.dirname, aHref)
                        );
                        // console.log(`from_fs scan ${item.path} toc entry ${aHref} ${aPath}`);
                        for (const reffed of itemz) {
                            if (reffed.path === aPath) {
                                reffed.spine_order = order++;
                                break;
                            }
                        }
                    });
                }
                $("math").each((/* i, mItem */) => {
                    item.is_mathml = true;
                });
                $("svg").each((/* i, mItem */) => {
                    item.is_svg = true;
                });
                const checkRemote = (i, link) => {
                    // console.log(link);
                    const href = $(link).attr('href');
                    const src = $(link).attr('src');
                    let theurl;
                    if (href) theurl = url.parse(href);
                    else if (src) theurl = url.parse(src);
                    if (theurl && (theurl.hostname || theurl.port)) {
                        console.log(`checkRemote found remote resource href ${href} src ${src} theurl ${util.inspect(theurl)}`);
                        item.is_remote_resources = true;
                    }
                };
                // Apparently we don't need to check <a> tags 
                // for a remote reference.
                // $("a").each(checkRemote);
                $("img").each(checkRemote);
                $("style").each(checkRemote);
                $("script").each(checkRemote);
                $("link").each(checkRemote);
                $("audio > source").each(checkRemote);
                $("video > source").each(checkRemote);

            } catch (e) {
                // ignore
                console.log(`Scanning files caught error ${e.stack}`);
            }
        }
    }

    // console.log(`from_fs `, filez);

    return new Manifest(itemz);
}

/*

This was the old plan, where the config file would hold a manifest of the files.
The code here may have some usefulness e.g. a command to list out the files
in the directory.

exports.scan = async function(config) {
    // console.log(`scanfiles renderedFullPath ${config.renderedFullPath}`);

    var filez = await globfs.findAsync(config.renderedFullPath, '**');

    // console.log(util.inspect(config.manifest));

    // Remove directories
    var _filez = [];
    for (let item of filez) {
        let stats;
        try {
            stats = await fs.stat(item.fullpath);
        } catch (e) { continue; }
        if (!stats.isDirectory()) {
            _filez.push(item);
        }
    }
    // Modify the basedir to be Bookroot
    filez = _filez.map(item => {
        item.basedir = config.renderedFullPath;
        return item;
    });

    // Look at existing manifest entries
    // If not in current set of files, then delete
    const todel = [];
    for (let mItem of config.manifest) {
        let found = false;
        for (let f of filez) {
            if (f.path === mItem.path) {
                found = true;
                break;
            }
        }
        if (!found) todel.push(mItem);
    }
    // Perform the deletions
    for (let mi of todel) {
        config.manifest.remove(mi.path);
    }
    // Then scan existing files
    // If it is in manifest, update the entry
    // Else add a new entry
    config.manifest.addItems(filez);
};
*/
