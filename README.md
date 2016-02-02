# MULTIPLE APPS LOGIN

A simple demo to try out the usage of CrossStorage/PostMessageApi 
as a mechanism for sharing login info between multiple apps only client side.

## Requirements

* Node & Npm
* Bower

## INSTALL
  
```npm install && npm run install:all```

Adjust your hosts file (usually located @ ```/etc/hosts```), take a look at the ```.hosts``` file for an example:

```
127.0.1.1 client-app.com auth-app.com malicious-app.com 
``` 

## RUN

```
sudo npm start
```

> we need ```sudo``` because we are binding the proxy to port 80.


Watch the three running apps in your browser.

* http://auth-app.com (user: john, pw: doe)
* http://client-app.com 
* http://malicious-app.com

 
