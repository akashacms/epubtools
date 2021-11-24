---
title: Examining EPUB content in EPUBTools
layout: ebook-page.html.ejs
---

We don't just want to package EPUB's, and generate the metadata files.  We're also interested in any statistics we can collect about the text in the book, and introspecting the EPUB content in other ways.

# Looking at the EPUB "manifest"

A core feature of the OPF and NCX files is a list of the content files in the EPUB.  This list is called the _manifest_.  It is sometimes important to double check that EPUBTools is generating a correct manifest.

```
s manifest CONFIG-FILE.epubtools
```

This prints out the JavaScript object for each item in the manifest.  This is useful to those implementing EPUBTools code, for debugging the code.  It may be useful to those using EPUBTools for book production, to give more insight into things.

# Unpacking an EPUB

You may have an EPUB and need to examine the contents as individual files.

```
$ epubtools unpack EPUB-FILE.epub DIRECTORY-NAME
```

You could perform this task with the `unzip` command if you like.  In any case, this extracts the files from the EPUB into the named directory.

# Non-functioning commands

EPUBTools requires some more work on these commands:

* `import` - This is meant to generate a `.epubtools` configuration file from a directory containing EPUB files
* `toc` - This should print the table of contents
* `stats` - This should print text characteristics (readability, etc)
* `words` - This should print a word count of the book
