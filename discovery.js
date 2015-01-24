var polo = require("polo");
var apps = polo();

apps.put({
    name: "apf-central-hub",
    port: "8012",
});

console.log("Service discovery running here.");
