$.fn.serializeObject = function()
{
  var o = {};
  var a = this.serializeArray();
  $.each(a, function() {
    if (o[this.name] !== undefined) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || '');
    } else {
      o[this.name] = this.value || '';
    }
  });
  return o;
};

var socket = io();

socket.on("authentication", function(yes) {
  console.log("event:authentication", yes);
  if (yes === true) {
    $("#loginScreen").css("display", "none");
    $("#username").text($("#loginScreen").serializeObject()["user"]);
  } else {
    $("#loginScreen").css("border", "1px solid red");
  }
});

function init() {
  console.log("initialised");

  var loginScreen = $("#loginScreen");
  loginScreen.submit(function(e) {
    var data = loginScreen.serializeObject();
    console.log("emitting auth with", data);
    socket.emit("auth", data["user"], data["password"]);
    e.preventDefault();
    return false;
  });

};

window.addEventListener("load", init);
