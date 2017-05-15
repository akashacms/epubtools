---
title: Setting up an eBook project with epubtools
layout: ebook-page.html.ejs
---

**epubtools** doesn't have a fixed-set-in-stone way of being used.  Instead it's designed as an open system you can integrate with other tools to create the workflow you need.

At a minimum you need four things:

* A directory structure whose contents are EPUB3-compatible HTML, CSS, and other assets
* An npm-style `package.json` file
    * This is used for importing any required Node.js packages, and as a means to implement ones workflow
    * other tools, like Grunt, are available within the Node.js ecosystem which can implement the workflow
* A YAML file describing the EPUB3 metadata
* A process for creating the EPUB3-compatible directory structure
    * This could be no process - You could use an HTML editor to directly edit files in this directory

# Setting up a directory to contain the book

Using **epubtools** requires a work area with at least the following directories:

* Asset files (CSS, JavaScript, images, etc)
* Source version of the documents comprising our book
* A destination directory into which the EPUB3 files are generated - this will be thrown away and rebuilt every time the book is rebuilt

It's very simple, **epubtools** takes the input files, plus metadata, and produces an output directory structured as EPUB3, and it then compresses it as an EPUB3 container.

The recommended directory names are: `assets`, `documents` and `out` (or `build`), which is constructed as so:

```
$ mkdir directory-name
$ cd directory-name
$ mkdir assets documents
```

Because **epubtools** is written in Node.js, we have available a symphony of Node.js software packages many of which focus on processing files for websites.  It also means we need a `package.json` file to leverage npm to access those packages for the processing workflow.  Installation of **epubtools**, its dependencies, and any other tools you like, is facilitated by dependency information put into `package.json`.

Run this:

```
$ npm init
.. answer the dialog to describe your book package
```

This sets up the initial `package.json` skeleton.  Now we add epubtools.

```
$ npm install epubtools@stable --save
```

This automatically installs all epubtools dependencies, and adds an epubtools reference to your `package.json`.  This creates a `node_modules` directory containing epubtools and its dependencies.  You can delete that directory, then re-run `npm install` at a later time, and it'll re-install everything.

It's recommended that you edit `package.json` and make one change.  The `--save` flag saved the current version of epubtools in the dependencies.  It's better to use the `stable` tag instead so that when epubtools is updated, and we change the "stable" version, you'll be able to update (using `npm update`) to the latest version.  

```
"dependencies": {
  ..
  "epubtools": "stable",
  ..
}
```

# Workflow overview

We can use npm and `package.json` not just to record tool dependencies, but the steps to build a book.  In `package.json` we can write scripts, one script for each step of the process, resulting in a simple command-line tool for building eBooks.  The next few sections will give a high-level view.

## Assets files, and the assets directory

The assets are files that are not part of the readable content, and probably don't require processing.  Generally assets files can be copied directly into the build directory.  Maybe you'll want to resize or compress images, or use a CSS processor (like LESS or SASS) to generate the CSS files.  Whether you do this for your book(s) is up to you.

Therefore, the first step to build a book is copying assets to the build directory.  Since we recommend using npm scripts to control the workflow, that can be written as so:

```
  "scripts": {
    "clean": "rm -rf out",
    "prebuild": "mkdir out && npm run copyassets",
    "copyassets": "globfs copy assets out",
  ..
  }
```

The `clean` script deletes the build directory, as we said earlier it's meant to be thrown away and rebuilt at any time.

The `prebuild` step is automatically run prior to the `build` step, which in turn calls the `copyassets` step.  This uses `globfs` to copy the files.  It could also be "cp -r assets/* out" but the globfs command is portable across platforms.

## Documents files, and the documents directory

Documents are files that are part of the readable content.  You probably want to process these files, converting them from an easy-to-edit format into the HTML dialect required by EPUB3.

For example, you might want to use a WYSIWYG editor like Google Docs or Libre Office.  Or, maybe Markdown is your preference.  In cases like this, a conversion step is required to produce EPUB-compliant-HTML from the original document.

```
  "scripts": {
  ..
    "build": " .. command to render documents to build directory .. ",
  ..
  }
```

## EPUB3 Packaging and metadata files

An EPUB3 eBook is a ZIP archive, constructed in a specific way, containing a few XML files with metadata, plus HTML containing readable content, plus other files like CSS or fonts.  This is where **epubtools** is focused, on constructing the directory structure, the metadata files, and bundling the resulting container.

The recommended workflow steps are these

```
  "scripts": {
  ..
    "postbuild": "epubtools mimetype out && epubtools containerxml out book.yml && epubtools makemeta out book.yml",
    "bundle": "epubtools package out book.yml",
    "rebuild": "npm run clean && npm run build && npm run bundle",
  ..
  }
```

## A simple eBook build process

With this npm configuration building the book is this simple:

```
$ npm run rebuild
```

That, in turn, causes these steps to run:

```
$ npm run clean
  .. rm -rf out
$ npm run prebuild
  .. mkdir out
$ npm run copyassets
  .. globfs copy assets out
$ npm run build
  .. render the files
$ npm run postbuild
  .. epubtools mimetype out
  .. epubtools containerxml out book.yml
  .. epubtools makemeta out book.yml
$ npm run bundle
  .. epubtools package out book.yml
```

Here's a couple additional useful steps:

```
  "scripts": {
  ..
    "check": "java -jar /usr/bin/epubcheck book-file-name.epub",
    "kindle": "~/KindleGen/kindlegen book-file-name.epub"
  ..
  }
```

The first runs the official check for EPUB3 validity using the tool published by the EPUB Foundation.  The second converts the EPUB3 file into one suitable for upload to the Kindle marketplace.

# Book metadata, the YAML and Table of Contents files

What makes this tick is two files containing data about the book.  The YAML file we've designed for **epubtools** contains data like the book title, authors, copyrights, and related details.  The Table of Contents file is an EPUB3 compliant file that an EPUB3 reader uses to present book navigation.  In **epubtools** we consult that file to assist building two of the XML files required by EPUB3.

## YAML metadata file

YAML is a simple text format to record data structures.  It's very easy to use, yet lets us concisely describe a complex data structure that's easy for humans to read.  The best documentation I've found for YAML is the Wikipedia article: https://en.wikipedia.org/wiki/YAML

The data structure we use in **epubtools** holds the eBook data items required to build an EPUB3.

```
opf: opf-file-name.opf
epub: book-file-name.epub
toc: { id: "toc", href: "toc.html" }
ncx: { id: "ncx", href: "toc.ncx"  }
```

These items control the name of two generated files.  The `.opf` file is an XML metadata file used by EPUB3 containing the primary data about the book, as well as a manifest of its content.  The `.ncx` file is another XML metadata file that's held over from EPUB2 and earlier eBook reading systems, and which is still useful.  The `.epub` file is of course the final container to be constructed.  

The `toc` is an HTML file you construct containing, as the name implies, the Table of Contents.  It lists all entrypoints to the content, and therefore lists every HTML file to contain within the EPUB container.

```
title: "EPUBtools User Guide"
identifiers:
    - unique: true
      uuid: "1c86a870-bc19-11e5-93aa-6787c34b8cc5"
published:
    date: "January 14, 2016 07:21:38 UTC"
    modified: "January 14, 2016 07:21:38 UTC"
languages: [ en ]
creators:
    - id: author
      name: David Herron
      nameReversed: Herron, David
publisher: LongTailPipe.COM
```

These items are different ways to identify the book.

The `title` is of course the book title.

The `identifiers` list is official identifying numbers.  If you have an ISBN, you'd list it here.  

In `published` we list the publishing date.  The date string can be written in pretty much any format, those supported by the JavaScript Date object.  The date is internally converted to the official format.  The `modified` date is optional, and is meant to record the last modification to the eBook.  If no `modified` date is given, the current time that epubtools are run is substituted.

In `languages` we list applicable language codes.

In `creators` we list the people involved with creating this eBook, and their role.  The need for both `name` and `nameReversed` attributes is because different metadata files want the name in different ways.

The `publisher` identifies the organization responsible for publishing the eBook.

```
cover:
    coverHtml: { id: "cover", href: "cover.html" }
    idImage: "cover-image"
    src:  "images/Human-Skeleton.jpg"
    alt:  "Electric Vehicle Charging Guide"
    type: "image/jpeg"
```

This identifies the cover image.  It allows us to generate an HTML file for the cover image, as well as include it in the metadata files as just an image.

## Table of Contents

We've already talked a little about the Table of Contents, so perhaps an example is in order:

```
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
</head>
<body>
<nav epub:type="toc" id="toc">
<ol type="1" start="1">
    <li><a href="1-introduction.html" id="introduction">Introduction</a></li>
    <li><a href="2-installation.html" id="installation">Installation</a></li>
    <li><a href="3-writing-content.html" id="writing-content">Writing Content</a></li>
    <li><a href="4-rendering-epubtools.html" id="rendering-epubtools">Rendering the EPUB with epubtools</a></li>
</ol>
</nav>
</body>
</html>
```

This file is meant to be constructed by you, and copied directly to the build directory.  The structure within the `nav` element is what's interpreted by EPUB reading software as the table of contents.  Inside the `nav` element is a simple `ol` list that's the table of contents structure.  The `ol` list can have nested `ol` lists for subchapters (sections).

Inside **epubtools** the contents of this file is used to generate the manifests in the OPF and NCX files.
