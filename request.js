var querystring = require('querystring');
var http = require('http');

var postData = querystring.stringify({
  'message': 'HelloWorld'
});

var options = {
  port: 8000,
  path: '/sendMail',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': postData.length,
    'subject': 'Test',
    'importance': 'low',
    'messageContent': 'Hello World',
    'recipientEmail': 'kalinduk.decosta@gmail.com',
    'emailId': 'id',
    'update': true
  }
};

var req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.')
  })
});

req.on('error', (e) => {
  console.log(`problem with request: ${e.message}`);
});

req.end();