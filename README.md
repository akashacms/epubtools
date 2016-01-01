# EPUBTools - tools to aid building and manipulating EPUB3 packages

Installation:

```
$ npm install epubtools --save
```

Usage - API:

```
var epubtools = require('epubtools');
...
epubtools.bundleEPUB('path/to/directory', 'document-name.epub', function(err) {
  if (err) throw err;
});
```

Usage - Grunt:

```
module.exports = function(grunt) {
    grunt.initConfig({
        epubBundle: {
            dirName: 'path/to/directory',
            epubFileName: 'document-name.epub'
        }
    });
    ...
    grunt.loadNpmTasks('epubtools');
    ...
    grunt.registerTask("build", [
        ...
        'epubBundle',
    ] );
    
};
```


