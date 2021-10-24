
epubuilder=../../../
# EPUBCHECK=../lib/epubcheck/epubcheck.jar
EPUBCHECK=${HOME}/bin/epubcheck-4.0.2/epubcheck.jar

for dirnm in accessible_epub_3 cc-shared-culture \
        childrens-literature childrens-media-query \
        cole-voyage-of-life cole-voyage-of-life-tol	 \
        epub30-spec \
        figure-gallery-bindings	georgia-cfi georgia-pls-ssml \
        haruko-ahl haruko-html-jpeg haruko-jpeg \
        hefty-water horizontally-scrollable-emakimono \
        indexing-for-eds-and-auths-3f \
        indexing-for-eds-and-auths-3md \
        internallinks \
        israelsailing \
        jlreq-in-english \
        jlreq-in-japanese \
        kusamakura-japanese-vertical-writing \
        kusamakura-preview \
        kusamakura-preview-embedded \
        linear-algebra \
        mahabharata \
        moby-dick moby-dick-mo \
        mymedia_lite \
        page-blanche page-blanche-bitmaps-in-spine \
        quiz-bindings \
        regime-anticancer-arabic \
        sous-le-vent \
        sous-le-vent_svg-in-spine \
        svg-in-spine \
        trees \
        vertically-scrollable-manga \
        wasteland \
        wasteland-otf \
        wasteland-otf-obf \
        wasteland-woff \
        wasteland-woff-obf; do

(
    cd epub3-samples/30

    echo java -jar ${EPUBCHECK} ${dirnm}.epub
    java -jar ${EPUBCHECK} ${dirnm}.epub

)

done


 