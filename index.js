var server = require("./server");
var router = require("./router");
var authHelper = require("./authHelper");
var outlook = require("node-outlook");
var url = require("url");

var handle = {};
handle["/"] = home;
handle["/authorize"] = authorize;
handle["/mail"] = mail;
handle["/calendar"] = calendar;
handle["/contacts"] = contacts;
handle["/sendMail"] = sendMail;
handle["/createMail"] = createMail;
handle["/deleteMail"] = deleteMail;
handle["/sendDraftMail"] = sendDraftMail;

var token;
var email;

server.start(router.route, handle);

function home(response, request) {
  console.log("Request handler 'home' was called.");
  response.writeHead(200, {"Content-Type": "text/html"});
  response.write('<p>Please <a href="' + authHelper.getAuthUrl() + '">sign in</a> with your Office 365 or Outlook.com account.</p>');
  response.end();
}

function authorize(response, request) {
  console.log("Request handler 'authorize' was called.");

  // The authorization code is passed as a query parameter
  var url_parts = url.parse(request.url, true);
  var code = url_parts.query.code;
  console.log("Code: " + code);
  authHelper.getTokenFromCode(code, tokenReceived, response);
}

function tokenReceived(response, error, token) {
  if (error) {
    console.log("Access token error: ", error.message);
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('<p>ERROR: ' + error + '</p>');
    response.end();
  }
  else {
    var cookies = ['qwerty-token=' + token.token.access_token + ';Max-Age=3600',
                   'qwerty-email=' + authHelper.getEmailFromIdToken(token.token.id_token) + ';Max-Age=3600'];
    response.setHeader('Set-Cookie', cookies);
    response.writeHead(302, {'Location': 'http://localhost:8000/mail'});
    response.end();
  }
}

function getValueFromCookie(valueName, cookie) {
  if (cookie.indexOf(valueName) !== -1) {
    var start = cookie.indexOf(valueName) + valueName.length + 1;
    var end = cookie.indexOf(';', start);
    end = end === -1 ? cookie.length : end;
    return cookie.substring(start, end);
  }
}

function mail(response, request) {
  if(request.headers.cookie){
    token = getValueFromCookie('qwerty-token', request.headers.cookie);
    console.log("Token found in cookie: ", token);
    email = getValueFromCookie('qwerty-email', request.headers.cookie);
    console.log("Email found in cookie: ", email);
  }

  if (token) {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('<div><h1>Your inbox</h1></div>');

    var queryParams = {
      '$select': 'Subject,ReceivedDateTime,From',
      '$orderby': 'ReceivedDateTime desc',
      '$top': 30
    };

    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
    // Set the anchor mailbox to the user's SMTP address
    outlook.base.setAnchorMailbox(email);

    outlook.mail.getMessages({token: token, odataParams: queryParams},
      function(error, result){
        if (error) {
          console.log('getMessages returned an error: ' + error);
          response.write("<p>ERROR: " + error + "</p>");
          response.end();
        }
        else if (result) {
          console.log('getMessages returned ' + result.value.length + ' messages.');
          response.write('<table><tr><th>From</th><th>Subject</th><th>Received</th></tr>');
          result.value.forEach(function(message) {
            console.log('  Subject: ' + message.Subject);
            var from = message.From ? message.From.EmailAddress.Name : "NONE";
            response.write('<tr><td>' + from +
              '</td><td>' + message.Subject +
              '</td><td>' + message.ReceivedDateTime.toString() +
              '</td><td>' + message.Id + '</td></tr>');
          });

          response.write('</table>');
          response.end();
        }
      });
  }
  else {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('<p> No token found in cookie!</p>');
    response.end();
  }
}

function calendar(response, request) {
  if(request.headers.cookie){
    token = getValueFromCookie('qwerty-token', request.headers.cookie);
    console.log("Token found in cookie: ", token);
    email = getValueFromCookie('qwerty-email', request.headers.cookie);
    console.log("Email found in cookie: ", email);
  }
  if (token) {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('<div><h1>Your calendar</h1></div>');

    var queryParams = {
      '$select': 'Subject,Start,End',
      '$orderby': 'Start/DateTime desc',
      '$top': 30
    };

    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
    // Set the anchor mailbox to the user's SMTP address
    outlook.base.setAnchorMailbox(email);
    // Set the preferred time zone.
    // The API will return event date/times in this time zone.
    outlook.base.setPreferredTimeZone('Eastern Standard Time');

    outlook.calendar.getEvents({token: token, odataParams: queryParams},
      function(error, result){
        if (error) {
          console.log('getEvents returned an error: ' + error);
          response.write("<p>ERROR: " + error + "</p>");
          response.end();
        }
        else if (result) {
          console.log('getEvents returned ' + result.value.length + ' events.');
          response.write('<table><tr><th>Subject</th><th>Start</th><th>End</th></tr>');
          result.value.forEach(function(event) {
            console.log('  Subject: ' + event.Subject);
            response.write('<tr><td>' + event.Subject +
              '</td><td>' + event.Start.DateTime.toString() +
              '</td><td>' + event.End.DateTime.toString() + '</td></tr>');
          });

          response.write('</table>');
          response.end();
        }
      });
  }
  else {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('<p> No token found in cookie!</p>');
    response.end();
  }
}

function contacts(response, request) {
  if(request.headers.cookie){
    token = getValueFromCookie('qwerty-token', request.headers.cookie);
    console.log("Token found in cookie: ", token);
    email = getValueFromCookie('qwerty-email', request.headers.cookie);
    console.log("Email found in cookie: ", email);
  }
  if (token) {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('<div><h1>Your contacts</h1></div>');

    var queryParams = {
      '$select': 'GivenName,Surname,EmailAddresses',
      '$orderby': 'GivenName asc',
      '$top': 30
    };

    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
    // Set the anchor mailbox to the user's SMTP address
    outlook.base.setAnchorMailbox(email);

    outlook.contacts.getContacts({token: token, odataParams: queryParams},
      function(error, result){
        if (error) {
          console.log('getContacts returned an error: ' + error);
          response.write("<p>ERROR: " + error + "</p>");
          response.end();
        }
        else if (result) {
          console.log('getContacts returned ' + result.value.length + ' contacts.');
          response.write('<table><tr><th>First name</th><th>Last name</th><th>Email</th></tr>');
          result.value.forEach(function(contact) {
            var email = contact.EmailAddresses[0] ? contact.EmailAddresses[0].Address : "NONE";
            response.write('<tr><td>' + contact.GivenName +
              '</td><td>' + contact.Surname +
              '</td><td>' + email + '</td></tr>');
          });

          response.write('</table>');
          response.end();
        }
      });
  }
  else {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write('<p> No token found in cookie!</p>');
    response.end();
  }
}

function sendMail(response, request) {
  console.log(request);
  if(request.headers.cookie){
    token = getValueFromCookie('qwerty-token', request.headers.cookie);
    console.log("Token found in cookie: ", token);
    email = getValueFromCookie('qwerty-email', request.headers.cookie);
    console.log("Email found in cookie: ", email);
  }
  if (token) {
    var newMsg = {
      Subject: request.headers.subject,
      Importance: request.headers.importance,
      Body: {
        ContentType: 'HTML',
        Content: request.headers.messagecontent
      },
      ToRecipients: [
        {
          EmailAddress: {
            Address: request.headers.recipientemail
          }
        }
      ]
    };

    // Pass the user's email address
    var userInfo = {
      email: 'msfthacksQwerty@outlook.com'
    };

    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
    // Set the anchor mailbox to the user's SMTP address
    outlook.base.setAnchorMailbox(email);

    outlook.mail.sendNewMessage({token: token, message: newMsg, user: userInfo},
      function(error, result){
        if (error) {
          console.log('sendNewMessage returned an error: ' + error);
        }
        else if (result) {
          console.log(JSON.stringify(result, null, 2));
        }
      });
  }
  else {
    console.log('No token found in cookie!');
  }
}

function createMail(response, request){
  if(request.headers.cookie){
    token = getValueFromCookie('qwerty-token', request.headers.cookie);
    console.log("Token found in cookie: ", token);
    email = getValueFromCookie('qwerty-email', request.headers.cookie);
    console.log("Email found in cookie: ", email);
  }
  if (token) {
    var newMsg = {
      Subject: request.headers.subject,
      Importance: request.headers.importance,
      Body: {
        ContentType: 'HTML',
        Content: request.headers.messagecontent
      },
      ToRecipients: [
        {
          EmailAddress: {
            Address: request.headers.recipientemail
          }
        }
      ]
    };

    // Pass the user's email address
    var userInfo = {
      email: 'msfthacksQwerty@outlook.com'
    };

    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');

    outlook.mail.createMessage({token: token, message: newMsg, user: userInfo},
      function(error, result){
        if (error) {
          console.log('createNewMessage returned an error: ' + error);
        }
        else if (result) {
          console.log(JSON.stringify(result, null, 2));
        }
      });
  }
  else {
    console.log('No token found in cookie!');
  }
}

function deleteMail(response, request){
  if(request.headers.cookie){
    token = getValueFromCookie('qwerty-token', request.headers.cookie);
    console.log("Token found in cookie: ", token);
    email = getValueFromCookie('qwerty-email', request.headers.cookie);
    console.log("Email found in cookie: ", email);
  }
  if (token) {
    var msgId = request.headers.emailid;

    // Pass the user's email address
    var userInfo = {
      email: 'msfthacksQwerty@outlook.com'
    };

    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');

    outlook.mail.deleteMessage({token: token, messageId: msgId, user: userInfo},
      function(error, result){
        if (error) {
          console.log('deleteMessage returned an error: ' + error);
        }
        else if (result) {
          console.log('SUCCESS');
        }
      });
  }
  else {
    console.log('No token found in cookie!');
  }
}

function updateMail(response, request){
  if(request.headers.cookie){
    token = getValueFromCookie('qwerty-token', request.headers.cookie);
    console.log("Token found in cookie: ", token);
    email = getValueFromCookie('qwerty-email', request.headers.cookie);
    console.log("Email found in cookie: ", email);
  }
  if (token) {
    var msgId = request.headers.emailid;

    var update = {
      IsRead: request.update,
    };

    // Pass the user's email address
    var userInfo = {
      email: 'msfthacksQwerty@outlook.com'
    };

    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');

    outlook.mail.deleteMessage({token: token, messageId: msgId, update: update, user: userInfo},
      function(error, result){
        if (error) {
          console.log('updateMail returned an error: ' + error);
        }
        else if (result) {
          console.log('SUCCESS');
        }
      });
  }
  else {
    console.log('No token found in cookie!');
  }
}

function sendDraftMail(response, request){
  if(request.headers.cookie){
    token = getValueFromCookie('qwerty-token', request.headers.cookie);
    console.log("Token found in cookie: ", token);
    email = getValueFromCookie('qwerty-email', request.headers.cookie);
    console.log("Email found in cookie: ", email);
  }
  if (token) {
    var msgId = request.headers.messageid;

    // Pass the user's email address
    var userInfo = {
      email: 'msfthacksQwerty@outlook.com'
    };

    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');

    outlook.mail.sendDraftMessage({token: token, messageId: msgId, user: userInfo},
      function(error, result){
        if (error) {
          console.log('sendDraftMail returned an error: ' + error);
        }
        else if (result) {
          console.log('SUCCESS');
        }
      });
  }
  else {
    console.log('No token found in cookie!');
  }
}