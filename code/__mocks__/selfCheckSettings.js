export const selfCheckEnabled = {
     "ok": true,
     "status": 200,
     "statusText": "",
     "data": {
          "result": {
               "success": true,
               "settings": {
                    "isEnabled": 1,
                    "barcodeStyles": [
                         "codabar",
                         "code39"
                    ],
                    "barcodeEntryKeyboardType": 2
               }
          }
     }
};

export const selfCheckDisabled = {
     "ok": true,
     "status": 200,
     "statusText": "",
     "data": {
          "result": {
               "success": true,
               "settings": {
                    "isEnabled": 0,
                    "barcodeStyles": [],
                    "barcodeEntryKeyboardType": 2
               }
          }
     }
};
