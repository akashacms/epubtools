---
title: Generating EPUB metafiles
layout: ebook-page.html.ejs
---

The `epubtools mkmeta` command builds, or rebuilds, the metadata files in the directory named `rendered` in the configuration file.  In other words, it is rebuilding the metafiles for your EPUB.

There are three process steps for generating an EPUB:

1. Rendering the content into XHTML, CSS and Images, into a directory that's organized to meet the needs of an EPUB v3
1. Build or rebuild the EPUB v3 metafiles
1. Bundle the content into an EPUB container

Put that way, the `mkmeta` command handles the middle step.  The command-line for this command is as so:

```
$ epubtools mkmeta --help
Usage: epubtools mkmeta [options] <configFN>

Create metafiles (OPF, NCX, etc) for an EPUB3 directory structure

Options:
  -h, --help  display help for command
```

In other words, the only option you give is the file name for the configuration file.  For details on the configuration file, see [](config.html)

The EPUB v3 specification has several metadata files which can appear in an EPUB container.  EPUBTools generates these:

1. The `mimetype` file - this is to appear as the first file in the ZIP archive, and serves as a marker that this is an EPUB
1. The `META-INF/container.xml` file - This file contains a reference to the OPF file.  If you need additional `<rootfiles>` entries, add a `container.rootfiles` array in your configuration file.
1. The OPF file, in the file name given in `opf.fileName`.  The OPF file contains lots of metadata about the EPUB, as well as a manifest of the files.
1. If you've put an `ncx` item in your configuration file, an NCX XML file will be generated in the file name in `ncx.href` in your configuration file.  Like the OPF file, this file contains metadata and a list of the files in the EPUB.

Before generating these files, EPUBTools reads every HTML file in the `rendered` directory.  This is to generate the data required for the manifest in the OPF and NCX files.

