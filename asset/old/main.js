var socket = io();

$loginUser = $('#login_user');
$loginPass = $('#login_pass');

function login(){
  console.log("Te loghez cu ",$loginUser.val(), $loginPass.val());

  socket.emit('login', {
    "user": $loginUser.val(),
    "pass": $loginPass.val()
  });

  event.preventDefault();
}

var elements = [];

function addElement(name){
	elements.push({"name":name});
	var d = $("<div>").attr("id","id-"+name).addClass("tile tile-large tile-purple");
	d.append($("<h3/>").addClass("tile-text").html(name));
	d.append($("<br/>"));
	d.append($("<p/>").addClass("content"));
	$("#recipe_list").append(d);
}

function update(name, value){
	$("#id-"+name).find(".content").html("<em>"+getFormattedDate()+"</em>: &nbsp;&nbsp;"+value);
}

function getFormattedDate() {
    var date = new Date();
    var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    return str;
}

socket.on('logged in', function (data) {
    $(".login_page").hide();
    $(".recipes_page").show();
    $.each(data.devices,function(i,e){
    	addElement(e.name);
    })

})

socket.on('update', function (data) {
    update(data.name,data.value);
})
