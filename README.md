# EPUBTools - complete toolset for building, extracting and manipulating EPUB3 packages

The purposes for this package include:

* Generating an EPUB3 package from a directory structure containing files conforming to the EPUB3 standard
* Assisting with generating the metadata files required by EPUB3
* Extracting an EPUB3 to a directory

The EPUBTools package is meant to be used in a Node.js project comprising content files for an eBook that is to be formatted in the EPUB3 format.  As a Node.js project there must be a `package.json` file.

To get started you must have Node.js installed.  After creating a blank directory, then run these commands:

```
$ npm init -y
$ npm install epubtools --save
```

The first initializes a default `package.json` file.  The second installs EPUBTools as a command in that project directory.

EPUBTools is part of [AkashaCMS](https://akashacms.com).

It does not contain support for rendering the XHTML files that are to be included in the EPUB container.  You must generate the content files through some other means.  A companion project, [AkashaRenderEPUB](https://github.com/akashacms/akasharender-epub), fills this purpose.  It takes Markdown or AsciiDoc files, and produces content files suitable for use in an EPUB.  Between the AkashaRenderEPUB and EPUBTools, you have a full EPUB production toolchain.

For documentation see https://akashacms.github.io/epubtools
