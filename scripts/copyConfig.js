const fs = require('fs');

fs.copyFile("../app-config-templates/app.config.js", "../code/app.config.js", (err) => {
	if (err) {
		return console.log(err);
	} else {
		console.log("✅ Copied config file template.")
	}
});

fs.copyFile("../app-config-templates/eas.json", "../code/eas.json", (err) => {
     if (err) {
          return console.log(err);
     } else {
          console.log("✅ Copied eas.json file template.")
     }
});
