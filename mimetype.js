function getMimeType(filename) {
    var mimetypes = {
        'image/bmp': [
            /\.bmp$/i
        ],
        'image/gif': [
            /\.gif$/i
        ],
        'image/jpeg': [
            /\.jpe?g$/i,
            /\.jpe$/i,
        ],
        'image/png': [
            /\.png$/i
        ],
        'image/tiff': [
            /\.tiff?$/i
        ],
    };
    for (var mimetype in mimetypes) {
        var regexes = mimetypes[mimetype];
        for (var i = 0; i < regexes.length; ++i) {
            var regex = regexes[i];
            if (regex.test(filename)) {
                return mimetype;
            }
        }
    }
    return 'application/octet-stream';
}
