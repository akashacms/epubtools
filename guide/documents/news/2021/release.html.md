---
layout: blog.html.ejs
title: EPUBTools 0.8.0 released
publicationDate: December 26, 2021
blogtag: news
tags:
    - EPUBTools
    - Milestone
teaser: |
    EPUBTools version 0.8 has been released, in conjunction with release of AkashaRender 0.8.  All prior versions of EPUBTools have been deprecated, and are no longer supported.
---

As we noted earlier, EPUBTools has been under major rewrite conditions for a few years.  [](announce.html)

The milestones reached in November were

* Getting EPUBTools to a very mature state, which is easy to use
* Getting an associated tool, AkashaRenderEPUB, to a similar easy-to-use state
* Developing this website to publish EPUBTools documentation

What we've done since is to improve the EPUBTools release process, to make sure it, its test suite, and website build, are all automated.

Yesterday, December 25, 2021, I released version 0.8 and also deprecated 0.4, and earlier.  The earlier releases have a very different code base, use a very different configuration file, and so forth.  With 0.8, it is so much easier to use, plus the same configuration file is supported by the companion tool AkashaRender-EPUB.

A part of the long delay between releases was that EPUBTools and AkashaRender-EPUB are so closely related.  Several ideas were tried between the two, and at one time EPUBTools contained the functionality of AkashaRender-EPUB.  It was eventually decided the two should be kept as distinct tools, and AkashaRender itself has undergone a major transformation.

As of this writing AkashaRender-EPUB does not have a 0.8.x release, but that should be handled shortly.

