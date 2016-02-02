(function () {

  var el = document.querySelector('#login-status');

  LoginClient
    .init('http://auth-app.com', { debug: true });

  LoginClient
    .on('logged_in', function () {
      console.log('YOU ARE LOGGED IN');
      el.innerText = 'You are LOGGED IN!';
    })
    .on('logged_out', function () {
      console.log('YOU ARE LOGGED OUT');
      el.innerText = 'You are LOGGED OUT!';
    })
    .on('change_logged_out', function () {
      el.innerText = 'You are LOGGED OUT!';
      window.alert(el.innerText);
    })
    .on('change_logged_in', function () {
      el.innerText = 'You are LOGGED IN!';
      window.alert(el.innerText);
    })
    .on('error', function (error) {
      el.innerText = 'There was an ERROR!';
      console.log(error);
    });

})();
