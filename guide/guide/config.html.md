---
title: The EPUBTools configuration file
layout: ebook-page.html.ejs
---

The EPUBTools configuration file is written in YAML format, and has the extension `.epubtools`.  It's purpose is to describe where to get the files for the EPUB,  the metadata values to appear inside the EPUB, and other important particulars.

In the [EPUBTools repository test directory](https://github.com/akashacms/epubtools/tree/master/test), there are two example configuration files.  You may find it useful to refer to these files.

**Field `name`**: This is the project name.  This value is not used anywhere, it is simply a name.

**Field `rendered`**: This is the directory where the rendered files are.  The files in this directory must conform to EPUB v3 requirements.  For example all HTML files must be in XHTML format with the extension `.xhtml`, and any internal links must be relative rather than an absolute URL.

**Field `epub`**: This is the file name for the generated EPUB file.  This is to be relative to the location of the configuration file.

**Object `toc`**: This object describes the file which contains the Table of Contents markup.  The object has two fields, `href` and `id`.  The first is the filename, relative to the `rendered` directory, of this file.  The second is the `id` value which will be used within the OPF file.

This file must contain EPUB v3 ToC markup, which means:

```html
<nav epub:type="toc" id="toc">
    <ol>
        ...
    </ol>
</nav>
```

**Object `ncx`**: This object describes the NCX file which is to be generated.  The NCX file is optional, and is a hold-over from the EPUB v2 specification.  It serves as an index of the pages within the EPUB, and might be used by older EPUB software.   The object has two fields, `href` and `id`.  The first is the filename, relative to the `rendered` directory, of this file.  The second is the `id` value which will be used within the OPF file.

**Object `cover`**: This object describes the cover image for the EPUB.  It has two fields, `href` and `id`.  The first is the filename, relative to the `rendered` directory, of this file.  The second is the `id` value which will be used within the OPF file.

**Object `coverhtml`**: This object describes the HTML file for the cover image.  It has two fields, `href` and `id`.  The first is the filename, relative to the `rendered` directory, of this file.  The second is the `id` value which will be used within the OPF file.

**Object `opf`**: This is a large object describing content for the OPF file.  The OPF is an XML file within the EPUB containing a content manifest, as well as many metadata values.

**Field `opf.fileName`**: This is the file name, relative to the `rendered` directory, for the generated OPF file.

**Array `opf.titles`**: This describes one or more titles for the EPUB.  There are several possible roles for each title.  Each entry in the array is an object, with three fields.  The `id` field is the `id` value to use within the OPF file.  The `title` field is the string to use as the title.  The `type` field is the sort of title this is.

* `main`: The title that reading systems should normally display, for example in a user’s library or bookshelf. If no values for the title-type property are provided, it is assumed that the first or only dc:title should be considered the “main title.”
* `subtitle`: A secondary title that augments the main title but is separate from it.
* `short`: A shortened version of the main title, often used when referring to a book with a long title (for example, “Huck Finn” for The Adventures of Huckleberry Finn) or a brief expression by which a book is known (for example, “Strunk and White” for The Elements of Style or “Fowler” for A Dictionary of Modern English Usage).
* `collection`: A title given to a set (either finite or ongoing) to which the given publication is a member. This can be a “series title,” when the publications are in a specific sequence (e.g., The Lord of the Rings), or one in which the members are not necessarily in a particular order (e.g., “Columbia Studies in South Asian Art”).
* `edition`: A designation that indicates substantive changes from one to the next.
* `extended`: A fully expressed title that may be a combination of some of the other title types, for example: The Great Cookbooks of the World: Mon premier guide de caisson, un Mémoire. The New French Cuisine Masters, Volume Two.  Special Anniversary Edition.

**Array `opf.identifiers`**: This describes the identifiers for this EPUB.  Each entry in the array is an object describing an individual identifier.  There are three fields to this object.  The first, `unique`, indicates whether this is the unique identifier for the EPUB.  The second, `type`, is the type of identifier.  The last, `string`, is the identifier string.  The types are:

* `urn`: Universal Resource Name?
* `isbn`: International Standard Book Number
* `uuid`: Universal Unique ID

**Array `opf.languages`**: Lists the languages used in this EPUB.  Each entry in the array is an object describing a language.  The first field, `id`, is the identifier to use in the OPF file.  The second, `langcode`, is the code name for the language.  For example, the code for English is `en`.

**Array `opf.creators`**: Lists the people involved with creating this EPUB.  Each entry in the array is an object describing one creator.  The first field, `id`, is the identifier to use in the OPF file.  The second, `name`, is their name.  The third, `role`, is which role they played.  For example, `author` is a role.  The last, `file-as`, is .. don't remember

**Array `opf.contributors`**: Lists the people who contributed to this EPUB, as opposed to the creators.  Creators have a more significant role than contributors.  The structure of this array is the same as for `opf.creators`.

**Field `opf.publicationDate`**: A date string for when this EPUB was published.

**Field `opf.modificationDate`**: A date string for when this EPUB was last modified.

**Array `opf.subjects`**: An array of strings describing the subjects covered in the EPUB.

**Field `opf.description`**: A string with, as the name implies, the description.

**Field `opf.modified`**: ??

**Field `opf.format`**: ??

**Field `opf.relation`**: ??

**Field `opf.coverage`**: ??

**Field `opf.publisher`**: The name of the publisher of the EPUB.

**Field `opf.rights`**: The copyright statement.

**Object `opf.source`**: What is this for?  There are two fields to this object.  The first, `id`, is an identifier string for the source.  The second, `type`, is the type of identifier.

* `urn`: Universal Resource Name?
* `isbn`: International Standard Book Number
* `uuid`: Universal Unique ID

**Object `container`**: This is an object to describe information to be added to `META-INF/container.xml`.

**Array `container.rootfiles`**: This is an optional array describing additional `rootfiles` entries in `container.xml`.  The file in `opf.fileName` is automatically added to this file, so that `container.xml` automatically has a reference to the OPF.  Your project may need additional files.  Each entry in the array is an object with these fields.

* `fullpath` - is the string to put in the `full-path` attribute
* `mime` - is the MIME type for the file to be added
