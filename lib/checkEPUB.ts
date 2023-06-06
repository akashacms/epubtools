
import * as path from 'node:path';
import { promises as fsp, default as fs } from 'node:fs';

import { Configuration } from './Configuration.js';

/**
 * Run some checks against the {@link Configuration}.  Currently that means verifying
 * that files in the {@link Manifest} exist.
 * @param config The {@link Configuration} object
 */
export async function checkEPUBConfig(config: Configuration): Promise<void> {

    for (const mItem of config.opfManifest) {
        if (!mItem.id || typeof mItem.id !== 'string' || mItem.id === '') {
            throw new Error(`Manifest item - path ${mItem.path} - does not have ID`);
        }
        const pathItem = path.join(config.renderedFullPath, mItem.path);
        try {
            await fsp.access(pathItem, fs.constants.R_OK);
        } catch (e) {
            throw new Error(`Manifest item is not readable or does not exist ${mItem.path} - ${pathItem} because ${e}`);
        }
    }
}
