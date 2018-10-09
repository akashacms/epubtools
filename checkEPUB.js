
const path = require('path');
const fs   = require('fs-extra');
const util = require('util');

exports.checkEPUBConfig = async function(config) {

    for (let mItem of config.opfManifest) {
        if (!mItem.id || typeof mItem.id !== 'string' || mItem.id === '') {
            throw new Error(`Manifest item does not have ID ${mItem.path}`);
        }
        let pathItem = path.join(config.sourceBookFullPath, mItem.path);
        try {
            await fs.access(pathItem, fs.constants.R_OK);
        } catch (e) {
            throw new Error(`Manifest item is not readable or does not exist ${mItem.path}`);
        }
    }
};