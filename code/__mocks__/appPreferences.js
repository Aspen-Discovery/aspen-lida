export const noNotificationPreferences = {
     "ok": true,
     "status": 200,
     "statusText": "",
     "data": {
          "result": {
               "success": true,
               "onboardAppNotifications": 0,
               "shouldAskBrightness": 0,
               "notification_preferences": []
          }
     }
};

export const notificationsEnabled = {
     "ok": true,
     "status": 200,
     "statusText": "",
     "data": {
          "result": {
               "success": true,
               "onboardAppNotifications": 1,
               "shouldAskBrightness": 0,
               "notification_preferences": [
                    {
                         "device": "SM-S911U",
                         "token": "ExponentPushToken[-JMO2EFG6oIgB1ZFpkad9]",
                         "notifySavedSearch": 1,
                         "notifyCustom": 1,
                         "notifyAccount": 1,
                         "onboardStatus": 0
                    },
               ]
          }
     }
};
