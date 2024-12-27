const fs = require('fs');
console.log("Running preinstall.js");
fs.readFile('app.config.js', 'utf8', function (err, data) {
	if (err) {
          console.log("☒ Could not load app.config.js");
		return console.log(err);
	} else {
		console.log('✅ Found app.config.js');
		const result = data.replace('../app-configs/google-services.json', process.env.GOOGLE_SERVICES_JSON);
		fs.writeFile('app.config.js', result, 'utf8', function (err) {
			if (err) {
				return console.log(err);
			}
			console.log('✅ Updated app.config.js with Google Services JSON file');
		});
	}
});
