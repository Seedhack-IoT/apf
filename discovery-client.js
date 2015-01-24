var polo = require("polo");
var apps = polo();

console.log("Starting discovery mode...");

apps.get("apf-central-hub", function(address) {
    console.log("Found service at ", address);
});

