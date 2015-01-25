var ui = {
  boolQuestion: function(message, callback) {
    var result = confirm(message);
    callback(result);
  }
};
