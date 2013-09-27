const KEY = process.env['MANDRILL_KEY'];
const CEM_HOST = process.env['CEM_HOST'];

const mandrill = require('node-mandrill')(KEY);
const url = require('url');

function defaultCallback(err, res) {
  if (err) {
    console.log(JSON.stringify(err));
  }
}

function createPushUrl(badge, email) {
  return url.format({
    protocol: 'http',
    host: CEM_HOST,
    pathname: '/',
    hash: 'badgeaccept=' + encodeURIComponent(badge.shortname) + '&email=' + encodeURIComponent(email)
  });
}

module.exports = {

  // Send email to notify user that their badge application was rejected
  sendApplyFailure: function sendApplyFailure(badge, email, callback) {
    callback = callback || defaultCallback;
    mandrill('messages/send-template', {
      template_name: 'cem-apply-rejected',
      template_content: [],
      message: {
        to: [ { email: email } ],
        global_merge_vars: [
          { name: 'badgename', content: badge.name } ]
      }
    }, callback);
  },

  // Send email to notify user that their badge application was successful and that they were awarded a badge
  sendApplySuccess: function sendApplySuccess(badge, email, callback) {
    callback = callback || defaultCallback;
    mandrill('messages/send-template', {
      template_name: 'cem-badge-earned',
      template_content: [],
      message: {
        to: [ { email: email } ],
        global_merge_vars: [
          { name: 'badgename', content: badge.name },
          { name: 'badgeimage', content: badge.image },
          { name: 'badgedesc', content: badge.description },
          { name: 'pushurl', content: createPushUrl(badge, email) } ]
      }
    }, callback);
  },

  // Send email to notify giverEmail that their Peer to Peer badge award to recipientEmail was rejected
  sendGiveFailure: function sendGiveFailure(badge, giverEmail, recipientEmail, callback) {
    callback = callback || defaultCallback;
    mandrill('messages/send-template', {
      template_name: 'cem-give-failure',
      template_content: [],
      message: {
        to: [ { email: giverEmail } ],
        global_merge_vars: [
          { name: 'badgename', content: badge.name },
          { name: 'badgeimage', content: badge.image },
          { name: 'badgedesc', content: badge.description },
          { name: 'recipientemail', content: recipientEmail } ]
      }
    }, callback);
  },

  // Send email to notify giverEmail that their Peer to Peer badge award to recipientEmail was successful
  sendGiveSuccess: function sendGiveSuccess(badge, giverEmail, recipientEmail, callback) {
    callback = callback || defaultCallback;
    mandrill('messages/send-template', {
      template_name: 'cem-give-success',
      template_content: [],
      message: {
        to: [ { email: giverEmail } ],
        global_merge_vars: [
          { name: 'badgename', content: badge.name },
          { name: 'badgeimage', content: badge.image },
          { name: 'badgedesc', content: badge.description },
          { name: 'recipientemail', content: recipientEmail } ]
      }
    }, callback);
  },

  // Send email to notify recipientEmail that they were awarded a Peer to Peer badge by giverEmail
  sendGiveAward: function sendGiveAward(badge, giverEmail, recipientEmail, callback) {
    callback = callback || defaultCallback;
    mandrill('messages/send-template', {
      template_name: 'cem-peer-badge-earned',
      template_content: [],
      message: {
        to: [ { email: recipientEmail } ],
        global_merge_vars: [
          { name: 'badgename', content: badge.name },
          { name: 'badgeimage', content: badge.image },
          { name: 'badgedesc', content: badge.description },
          { name: 'giveremail', content: giverEmail },
          { name: 'pushurl', content: createPushUrl(badge, recipientEmail) } ]
      }
    }, callback);
  }
};
