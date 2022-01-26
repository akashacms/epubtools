
import { promises as fs } from 'fs';
import { default as chokidar } from 'chokidar';
import * as util from 'util';
import * as path from 'path';

import bundleEPUB from './bundleEPUB.js';

let watcher;

export function setup(config) {
    const rendered = config.renderedFullPath;
    const renderedPath = path.normalize(path.join(config.configDirPath, config.renderedPath));
    watcher = chokidar.watch(renderedPath, {
        persistent: true,
        ignoreInitial: false,
        awaitWriteFinish: true
    })
    // This didn't seem to cause it to ignore files
    .unwatch([
        path.join(renderedPath, 'mimetype'),
        path.join(renderedPath, 'META-INF', 'container.xml'),
        path.join(renderedPath, config.bookOPF),
        path.join(renderedPath, config.sourceBookNCXHREF)
    ]);
    watcher
        .on('add', path => { doRebuild(config, path); })
        .on('change', path => { doRebuild(config, path); })
        .on('unlink', path => { doRebuild(config, path); });
    console.log(`setup DONE ${renderedPath}`);
}

async function doRebuild(config, eventpath) {
    try {
        const renderedPath = path.normalize(path.join(config.configDirPath, config.renderedPath));
        // Since unwatch didn't work we had to do this
        //
        // The purpose is that these specific files are rebuilt by
        // the doMeta function.  Because this program rebuilds those
        // files, the rebuilt file becomes a change event.  If we went
        // ahead with the rebuild, then it would simply trigger the event
        // again.  Hence, ignoring events on these files breaks the loop.
        if ((eventpath === path.join(renderedPath, 'mimetype'))
          || (eventpath === path.join(renderedPath, 'META-INF', 'container.xml'))
          || (eventpath === path.join(renderedPath, config.bookOPF))
          || (eventpath === path.join(renderedPath, config.sourceBookNCXHREF))) {
            // console.log(`doRebuild IGNORE ${eventpath}`);
            return;
        }
        // console.log(`doRebuild for ${eventpath} before doMeta`);
        await bundleEPUB.doMeta(config);
        // console.log(`doRebuild for ${eventpath} before readTOCData`);
        await config.readTOCData();
        // console.log(`doRebuild for ${eventpath} before bundleEPUB`);
        await bundleEPUB.bundleEPUB(config);
        console.log(`rebuild ${config.epubFileName} for ${eventpath}`);
    } catch (e) {
        console.error(`doRebuild `, e);
    }
}

export async function close() {
    if (watcher) {
        await watcher.close();
        watcher = undefined;
    }
}
