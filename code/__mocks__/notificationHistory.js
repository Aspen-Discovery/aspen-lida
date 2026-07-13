export const noNotificationHistory = {
     "ok": true,
     "status": 200,
     "statusText": "",
     "data": {
          "result": {
               "success": true,
               "title": "Success",
               "message": "Found all messages for user",
               "page_current": "1",
               "page_total": 0,
               "totalResults": 0,
               "inbox": []
          }
     }
};

export const threeNoticesInHistory = {
     "ok": true,
     "status": 200,
     "statusText": "",
     "data": {
          "result": {
               "success": true,
               "title": "Success",
               "message": "Found all messages for user",
               "page_current": "1",
               "page_total": 1,
               "totalResults": 3,
               "inbox": [
                    {
                         "id": 3,
                         "messageId": "3",
                         "userId": 1,
                         "type": "AUTO_RENEWALS",
                         "status": "sent",
                         "title": "Automatic renewal notice",
                         "content": "Dear Test User,\r\n\r\nThe following item, iPhone , has not been renewed because:\r\n\r\nThis item is on hold for another patron.",
                         "defaultContent": "Dear Test User,\r\n\r\nThe following item, iPhone , has not been renewed because:\r\n\r\nThis item is on hold for another patron.\r\n\r\n",
                         "dateQueued": 1783254392,
                         "dateSent": 1783263541,
                         "isRead": 0
                    },
                    {
                         "id": 2,
                         "messageId": "2",
                         "userId": 1,
                         "type": "PASSWORD_RESET",
                         "status": "sent",
                         "title": "Koha password recovery",
                         "content": "This email has been sent in response to your password recovery request for the account mark.\r\n\r\n\r\nYou can now create your new password using the following link:\r\n\r\n\r\nhttps://demo.groveforlibraries.com/MyAccount/PasswordRecovery?uniqueKey\u003d$2a$08$t71d7QRUCLN77FAN6OSZWe\r\n\r\nThis link will be valid for 2 days from this email\u0027s reception, then you must reapply if you do not change your password.\r\nThank you.",
                         "defaultContent": "\u003cp\u003eThis email has been sent in response to your password recovery request for the account \u003cstrong\u003emark\u003c/strong\u003e.\r\n\u003c/p\u003e\r\n\u003cp\u003e\r\nYou can now create your new password using the following link:\r\n\r\n\r\n\u003ca href\u003d\"https://demo.groveforlibraries.com/MyAccount/PasswordRecovery?uniqueKey\u003d$2a$08$t71d7QRUCLN77FAN6OSZWe\"\u003ehttps://demo.groveforlibraries.com/MyAccount/PasswordRecovery?uniqueKey\u003d$2a$08$t71d7QRUCLN77FAN6OSZWe\u003c/a\u003e\r\n\u003c/p\u003e\r\n\u003cp\u003eThis link will be valid for 2 days from this email\u0027s reception, then you must reapply if you do not change your password.\u003c/p\u003e\r\n\u003cp\u003eThank you.\u003c/p\u003e",
                         "dateQueued": 1782785867,
                         "dateSent": 1782831541,
                         "isRead": 0
                    },
                    {
                         "id": 1,
                         "messageId": "1",
                         "userId": 1,
                         "type": "HOLD",
                         "status": "sent",
                         "title": "Hold available for pickup at Mock Library",
                         "content": "Dear Test User,\r\n\r\nYou have a hold available for pickup as of 06/04/2026:\r\n\r\nTitle: Breaking dawn\r\nAuthor: Meyer, Stephenie\r\nCopy: \r\nLocation: Mock Library\r\n",
                         "defaultContent": "Dear Test User,\r\n\r\nYou have a hold available for pickup as of 06/04/2026:\r\n\r\nTitle: Breaking dawn\r\nAuthor: Meyer, Stephenie\r\nCopy: \r\nLocation: Mock Library\r\n",
                         "dateQueued": 1780587989,
                         "dateSent": 1780592344,
                         "isRead": 0
                    }
               ]
          }
     }
};
