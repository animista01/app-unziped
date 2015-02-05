var tokenModule = angular.module('tokenProvider', []);


tokenModule.provider('Token', function () {

  var token = localStorage.getItem("appToken");
  var expires = localStorage.getItem("expires");

  var tokenProvider = {
    isTokenValid: function() {

      var valid = false;
      if (expires != '' ) {

        // This should be returned in a format the client can parse.
        var date = new Date(expires);

        if (date > new Date())
          valid = true;
      }

      return valid;
    },

    getToken: function() {

      return token;
    },

    getExpires: function() {

      return expires;
    },

    update: function(newToken, newExpires) {
      token = newToken;
      expires = newExpires;

      localStorage.setItem('appToken', token);
      localStorage.setItem('expires', expires);
    },

    clear: function() {

      token = '';
      expires = '';

      localStorage.removeItem('appToken');
      localStorage.removeItem('expires');
    }
  };

  return {

    // Duplicated here so that we can access it in config
    isTokenValid: function() {

      return tokenProvider.isTokenValid()
    },

    $get: function () {

      return tokenProvider;
    }
  }
});