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
    $("#loginScreen").hide();
    
    $("#username").text($("#login_user").val());
  } else {
    $("#loginScreen").css("border", "1px solid red");
  }
});

socket.on("boolQuestion", function(id, message) {
  console.log("event:boolQuestion", id, message);
  ui.boolQuestion(message, function(answer) {
    socket.emit("boolAnswer", id, answer);
  });
});

function init() {
  console.log("initialised");

};
function login(){
    event.preventDefault();
    // console.log("Te loghez cu ",$loginUser.val(), $loginPass.val());

    socket.emit("auth", $("#login_user").val(), $("#login_pass").val());
    return false;
  };

window.addEventListener("load", init);
