const fs = require('fs');

fs.copyFile("../code/app.config_template.js", "../code/app.config.js", (err) => {
	if (err) {
		return console.log(err);
	} else {
		console.log("✅ Copied config file template.")
	}
});

fs.copyFile("../code/eas_template.json", "../code/eas.json", (err) => {
     if (err) {
          return console.log(err);
     } else {
          console.log("✅ Copied eas.json file template.")
     }
});
