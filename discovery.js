var polo = require("polo");
var apps = polo();

apps.put({
    name: "apf-central-hub",
    port: "2200",
    heartbeat: 1000,
});

console.log("Service discovery running here.");
