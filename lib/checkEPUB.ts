
import * as path from 'path';
import { promises as fsp, default as fs } from 'fs';

export async function checkEPUBConfig(config) {

    for (let mItem of config.opfManifest) {
        if (!mItem.id || typeof mItem.id !== 'string' || mItem.id === '') {
            throw new Error(`Manifest item - path ${mItem.path} - does not have ID`);
        }
        let pathItem = path.join(config.renderedFullPath, mItem.path);
        try {
            await fsp.access(pathItem, fs.constants.R_OK);
        } catch (e) {
            throw new Error(`Manifest item is not readable or does not exist ${mItem.path} - ${pathItem} because ${e}`);
        }
    }
};