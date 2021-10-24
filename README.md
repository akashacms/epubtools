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

To facilitate using the CLI tool, add `./node_modules/.bin` to your PATH variable.  By doing so you can easily run any CLI tool installed by a Node.js package.

There is both an API and a CLI tool.

# CLI

To get help run: `epubtools --help`

```
$ epubtools package configFileFN
```

Package the EPUB described by the configuration file.

```
$ epubtools unpack file-name.epub
```

Unpacks the given EPUB file. TODO this command does not work as advertised

```
$ epubtools import path/to/EPUB/directory config.epubtools
```

Reads information from the OPF file in the EPUB directory, and constructs the configuration file.

# Configuration file

Configuration files are named with the extension `.epubtools`.  They are in YAML format, and describe some EPUB3 metadata and other information required to build an EPUB3 package.
