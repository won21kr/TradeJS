const
    fs = require('fs'),
    path = require('path'),
    argv = require('minimist')(process.argv.slice(2));

let base = path.join(__dirname, 'node_modules', 'sqlite3', 'lib', 'binding');
let origin = '';
let destination = '';

new Promise((resolve, reject) => {
    fs.readdir(base, (err, files) => {
        if (err) throw new Error(err);

        files.forEach(file => {
            console.log(file);

            if (file.indexOf('electron') > -1) {
                origin = file;
            } else {
                destination = file;
            }

            resolve();
        });
    });
}).then(() => {

	if (!destination)
		throw new Error('Cannot find sqlite3 to rename like! (used by electron)');

	if (!origin)
		return;

    // Create new dir name
    destination = path.join(base, destination.split('-').map((p, i) => i === 1 ? `v${argv.version}` : p).join('-'));
    origin = path.join(base, origin);

    fs.rename(origin, destination, function (err) {
        if (err) throw new Error(err);
    });
});