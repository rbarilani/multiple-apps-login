(function () {

  var el = document.querySelector('#login-status');

  LoginClient
    .init('http://auth-app.com')
    .then(function () {
      console.log('current status', LoginClient.status());
    });

  LoginClient
    .on('logged_in', function () {
      console.log('TOKEN IS SET!', this.token()); // '123'
      el.innerText = 'You are LOGGED IN!';
    })
    .on('logged_out', function () {
      el.innerText = 'You are LOGGED OUT!';
      console.log('TOKEN IS NOT SET!');
    })
    .on('change_logged_out', function () {
      el.innerText = 'You are LOGGED OUT!';
      console.log('TOKEN IS NOT SET!');
      window.alert(el.innerText);
    })
    .on('error', function (error) {
      el.innerText = 'There was an ERROR!';
      console.log(error);
    });

})();
