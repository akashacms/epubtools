
// const path = require('path');
const util = require('util');
const fs = require('fs-extra');
const globfs = require('globfs');

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
        this.basedir
            = typeof item.basedir !== 'undefined' ? item.basedir : "";
        this.path
            = typeof item.path !== 'undefined' ? item.path : "";
        this.id 
            = typeof item.id !== 'undefined' ? item.id : "";
        this.suppress 
            = typeof item.suppress !== 'undefined' ? item.suppress : false;
        this.in_spine
            = typeof item.in_spine !== 'undefined' ? item.in_spine : false;
        this.spine_order
            = typeof item.spine_order !== 'undefined' ? item.spine_order : -1;
        // console.log(util.inspect(this));
    }

}

exports.scan = async function(config) {
    console.log(`scanfiles bookroot ${config.sourceBookFullPath}`);

    var filez = await globfs.findAsync(config.sourceBookFullPath, '**');

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
        item.basedir = config.sourceBookroot;
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
}
