/////////////////////////////////////////////////////////////////////
// Copyright 2022 Autodesk Inc
// Written by Develope Advocacy and Support
//
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

'use strict';

// Autodesk APS configuration
module.exports = {
  // set environment variables or hard-code here
  credentials: {
    client_id: process.env.APS_CLIENT_ID || '<Your APS Client ID>',
    client_secret: process.env.APS_CLIENT_SECRET || '<Your APS Client Secret>'
  },
  //ensure the callback url is same to what has been registered with the APS app
  callbackURL: process.env.APS_CALLBACK_URL || 'http://localhost:3000/api/APS/callback/oauth',

  // Required scopes for your application on server-side
  scopeInternal: ['bucket:create', 'bucket:read', 'data:read', 'data:create', 'data:write'],
  // Required scope of the token sent to the client
  scopePublic: ['viewables:read'],

  //some endpoints of BIM 360. No SDK at this moment..
  hqv1: {
    basedUrl: 'https://developer.api.autodesk.com',
    httpHeaders: function (access_token) {
      return {
        Authorization: 'Bearer ' + access_token,
        'Content-Type': 'application/json'
      }
    },
    getUserProfileAtMe: function () {
      return this.basedUrl + '/userprofile/v1/users/@me'
    }
  }
};