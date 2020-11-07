
// const path = require('path');
const util = require('util');
const fs = require('fs-extra');
const url = require('url');
const path = require('path');
const globfs = require('globfs');
const mime = require('mime');
const cheerio = require('cheerio');
const xmldom   = require('xmldom');
const metadata = require('./metadata');
const utils = require('./utils');
const akasha        = require('akasharender');
const akfilez       = require('akasharender/filez');

exports.Manifest = class Manifest extends Array {

    constructor(toimport) {
        super();
        if (toimport) {
            for (let item of toimport) {
                this.push(new exports.ManifestItem(item));
            }
        }
    }

    byID(id) {
        for (let item of this) {
            if (item.id === id) return item;
        }
        return undefined;
    }

    byPath(path2find) {
        for (let item of this) {
            if (item.path === path2find) return item;
        }
        return undefined;
    }

    get spine() {
        const spine = this.filter(item => {
            if (item.in_spine) spine.push(item);
        });
        // spine.sort ...
        spine.sort((a, b) => {
            if (a.spine_order < b.spine_order) return -1;
            if (a.spine_order > b.spine_order) return 1;
            return 0;
        });
        return spine;
    }

    addItem(newItem) {
        let mItem = this.byPath(newItem.path);
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
            this.push(new exports.ManifestItem(newItem));
        }
    }

    addItems(items) {
        for (let f of items) {
            this.addItem(f);
        }
    }

    checkItemsFromOPF(opfManifest) {

        // Maybe this does not belong here since it is presumed to be part of a process driven elsewhere
        // Maybe instead this belongs in that place

        // The assumption is config.opfManifest was built by using from_fs first and 
        // second to scan what is in an OPF file 

        // Ergo the from_fs stage cannot get a lot of the details which are in the OPF 

        for (let mItem of opfManifest) {
            let existing = config.opfManifest.byPath(mItem.path);

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

    }

    replaceItems(newItems) {
        while (this.length > 0) {
            this.pop();
        }
        this.addItems(newItems);
    }

    remove(path2remove) {
        for (let item of this) {
            if (item.path === path2remove) {
                const i = this.indexOf(item);
                if (i !== -1) {
                    this.splice(i, 1);
                }
            }
        }
    }

}

exports.ManifestItem = class ManifestItem {
    constructor(item) {
        this.id = typeof item.id !== 'undefined' ? item.id : "";
        this.basedir = typeof item.basedir !== 'undefined' ? item.basedir : "";
        this.path = typeof item.path !== 'undefined' ? item.path : "";
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
            = typeof item.is_mathml !== 'undefined' ? item.is_mathml : "";
        this.is_scripted 
            = typeof item.is_scripted !== 'undefined' ? item.is_scripted : "";
        this.is_svg 
            = typeof item.is_svg !== 'undefined' ? item.is_svg : "";
        this.is_remote_resources 
            = typeof item.is_remote_resources !== 'undefined' ? item.is_remote_resources : "";
        this.is_switch 
            = typeof item.is_switch !== 'undefined' ? item.is_switch : "";
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

};

exports.spineItems = function(epubConfig) {
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
};

exports.spineTitles = async function(epubConfig) {
    let epubdir = epubConfig.sourceBookFullPath;
    if (epubConfig.opfManifest) for (let item of epubConfig.opfManifest) {
        if (!item.in_spine) continue;
        let docpath = path.join(epubdir, item.path);
        let doctxt = await fs.readFile(docpath, 'utf8');
        const $ = cheerio.load(doctxt, {
            xmlMode: true,
            decodeEntities: true
        });
        let title = $('head title').text();
        // console.log(`spineTitles title ${title}`);
        item.title = title;
    }
};

let navolcount = 0;

function getNavOLChildrenXML(DOM, navol, tocdir) {
    let ret = [];
    let children = navol.childNodes;
    for (let child of utils.nodeListIterator(children)) {
        if (child.nodeType === 1 && child.tagName && child.tagName === 'li') { // ELEMENT_NODE
            let lichildren = child.childNodes;
            let item;
            let itemchildren;
            for (let lichild of utils.nodeListIterator(lichildren)) {
                if (lichild.nodeType === 1 && lichild.tagName && lichild.tagName === 'a') { // ELEMENT_NODE
                    let href = lichild.getAttribute('href');
                    let id = child.getAttribute('id');
                    if (!id || id === '') {
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

exports.tocData = async function(epubConfig) {

    // console.log(`tocData ${epubConfig.sourceBookTOCHREF} found ${util.inspect(found)}`);
    // console.log(`tocData ${epubConfig.sourceBookTOCHREF} renderer ${util.inspect(renderer)}`);

    var content = await fs.readFile(
                path.join(epubConfig.renderedFullPath, epubConfig.sourceBookTOCHREF), 
                'utf8');

    // console.log(`tocData ${epubConfig.sourceBookTOCHREF} content ${util.inspect(content)}`);

    let tocdom = new xmldom.DOMParser().parseFromString(content, 'application/xhtml+xml');
    if (!tocdom) {
        throw new Error(`epubtools tocData FAIL to read ${epubdir} ${epubConfig.sourceBookTOCHREF}`);
    }
    // let tochtml = tocxhtml.xhtmlText;
    // let tocdom = tocxhtml.xhtmlDOM;
    let tocid   = epubConfig.sourceBookTOCID;
    let tocdir  = path.dirname(epubConfig.sourceBookTOCHREF);
    let tocnav;
    for (let nav of utils.nodeListIterator(
        tocdom.getElementsByTagName('nav')
    )) {
        console.log(`tocData found nav epub:type ${nav.getAttribute('epub:type')} id ${nav.getAttribute('id')} tocid ${tocid}`);
        if (nav.getAttribute('epub:type') === 'toc' && nav.getAttribute('id') === tocid) {
            tocnav = nav;
            break;
        }
    }
    if (!tocnav) {
        throw new Error(`No nav epub:type===toc id===${tocid} in ${epubConfig.TOCpath}`);
    }
    let tocnavchildren = tocnav.childNodes;
    let tocnavrootol;
    for (let child of utils.nodeListIterator(tocnavchildren)) {
        if (child.nodeType === 1 && child.tagName && child.tagName === 'ol') { // ELEMENT_NODE
            tocnavrootol = child;
            break;
        }
    }
    if (!tocnavrootol) {
        throw new Error(`No root 'ol' node in nav epub:type===toc id===${tocid} in ${epubConfig.TOCpath}`);
    }
    navolcount = 0;
    let tocdata = getNavOLChildrenXML(tocdom, tocnavrootol, tocdir);
    return tocdata;
};

exports.from_fs = async function(config) {
    // console.log(`scanfiles epubdir ${epubdir}`);

    // TODO Should this scan the source directory or the rendered directory?
    // console.log(config.renderedFullPath);
    let filez = await globfs.findAsync(config.renderedFullPath, '**');

    // console.log(filez);

    // Remove directories
    let _filez = [];
    for (let item of filez) {
        // Do not include admin files
        if (item.path === 'mimetype') continue;
        if (item.path === 'META-INF/container.xml') continue;
        if (item.path === config.bookOPF) continue;
        let stats;
        // Only include files which can be stat'd and are not directories
        // console.log(item);
        try {
            stats = await fs.stat(item.fullpath);
        } catch (e) { continue; }
        if (!stats.isDirectory()) {
            _filez.push(item);
        }
    }
    filez = _filez;
    // Modify the basedir to be renderedFullPath
    // Fill in other base ManifestItem fields
    for (let item of filez) {
        item.basedir = config.renderedPath;
        item.dirname = path.dirname(item.path);
        item.filename = path.basename(item.path);
        item.mime = mime.getType(item.path);
        if (item.mime === 'text/html') {
            item.mime = 'application/xhtml+xml';
        }
        item.mimeoverride = false;
        // is_nav elsewhere
        item.suppressOPF  = false;
        item.suppress = false;
        item.in_spine = item.mime === 'text/html' || item.mime === 'application/xhtml+xml'
                ? true : false;

        item.seen_in_opf = false;

        // console.log(`item.basedir ${item.basedir} item.dirname ${item.dirname} item.filename ${item.filename}`)

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
    }
    let itemnum = 0;
    for (let item of filez) {
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
                    let navtype = $(nav).attr('epub:type');
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
                        let aHref = $(anchor).attr('href');
                        let aPath = path.normalize(
                            path.join(item.dirname, aHref)
                        );
                        // console.log(`from_fs scan ${item.path} toc entry ${aHref} ${aPath}`);
                        for (let reffed of filez) {
                            if (reffed.path === aPath) {
                                reffed.spine_order = order++;
                                break;
                            }
                        }
                    });
                }
                $("math").each((i, mItem) => {
                    item.is_mathml = true;
                });
                $("svg").each((i, mItem) => {
                    item.is_svg = true;
                });
                const checkRemote = (i, link) => {
                    // console.log(link);
                    let href = $(link).attr('href');
                    let src = $(link).attr('src');
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

    return new exports.Manifest(filez);
};

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
