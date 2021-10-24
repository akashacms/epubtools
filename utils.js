
const sprintf   = require("sprintf-js").sprintf;

module.exports.w3cdate = function w3cdate(date) {
    return sprintf("%04d-%02d-%02dT%02d:%02d:%02dZ",
           date.getUTCFullYear(),
          (date.getUTCMonth() + 1),
           date.getUTCDate(),
          (date.getUTCHours()),
          (date.getUTCMinutes() + 1),
          (date.getUTCSeconds() + 1)
    );
};

module.exports.nodeListIterator = function nodeListIterator(nodeList) {
    nodeList[Symbol.iterator] = function() {
        return {
            next: function() {
                if (this._index < nodeList.length) {
                    var ret = nodeList.item(this._index);
                    this._index++;
                    return { value: ret, done: false };
                } else {
                    return { done: true };
                }
            },
            _index: 0
        };
    };
    return nodeList;
};

module.exports.nodeList2Array = function(nodeList) {
    var ret = [];
    for (let item of module.exports.nodeListIterator(nodeList)) {
        ret.push(item);
    }
    return ret;
};
