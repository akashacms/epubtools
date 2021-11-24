---
title: Introduction to EPUBTools
layout: ebook-page.html.ejs
---

The core purpose of EPUBTools is taking XHTML, CSS and image files, bundling them into an EPUB, along with all EPUB v3 metadata.  It conforms to EPUB v3, and this tool has been successfully used to sell several eBooks through Kindle and other eBook marketplaces.

The project began in 2014, and since then has completely morphed several times.  It is completely incompatible with earlier versions of `epubtools`.

EPUBTools sits at the tail end of an eBook production process, where the files have been generated, and we need to produce a conformant EPUB 3 container.

An eBook production process using EPUBTools requires at least three steps:

1. Generating the XHTML, CSS and Image files required by the book.  You probably should not edit these files directly, but source them from somewhere.  EPUBTools has no feature for this purpose.
1. Generate the metadata files to be used in the EPUB.  This means running the `epubtools mkmeta` command.
1. Bundling the files as an EPUB container.  This means running the `epubtools package` command.



