---
layout: default.html.ejs
title: 'AskashaEPUB @akashacms/epubtools documentation'
publicationDate: February 13, 2021
---

EPUBTools handles generating EPUB 3 metadata files, and bundling EPUB v3 containers.  This means you must generate the content files using other tools.

There is a companion tool, [AkashaRenderEPUB](https://github.com/akashacms/akasharender-epub), that takes Markdown or AsciiDoc files, and produces content files suitable for use in an EPUB.  It is meant to be used with EPUBTools.  But, you are free to use EPUBTools with any other application that can produce suitable XHTML, CSS and Image files.

A YAML-formatted configuration file describes the EPUB3 metadata and other important parameters.

```
$ epubtools --help
Usage: epubtools [options] [command]

Options:
  -V, --version                 output the version number
  -h, --help                    display help for command

Commands:
  package <configFN>            Package an EPUB3 file from a directory
  mkmeta <configFN>             Create metafiles (OPF, NCX, etc) for an EPUB3 directory structure
  watch <configFN>              Watch for changes and rebuild EPUB
  manifest <configFN>           Run manifest.from_fs
  unpack <epubFN> <unpackTo>    Unpack an EPUB file into destination directory
  import <epubDir> <projectFN>  Generate an ".epubtools" configuration file from an EPUB
  toc <configFN>                Read the Table Of Contents for the book described in the config
  stats <configFN>              Print text statistics for the EPUB
  words <configFN>              Print word count statistics for rendered HTML file in a directory
  help [command]                display help for command
  ```

  For further documentation [see the EPUBTools Users Guide](/guide/index.html)
