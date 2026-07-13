export const noLinkedAccounts = {
     "ok": true,
     "status": 200,
     "statusText": "",
     "data": {
          "result": {
               "success": true,
               "linkedAccounts": []
          }
     }
};

export const threeLinkedAccounts = {
     "ok": true,
     "status": 200,
     "statusText": "",
     "data": {
          "result": {
               "success": true,
               "linkedAccounts": {
                    "2": {
                         "displayName": "T. User 2",
                         "homeLocation": "Mock Library",
                         "barcode": "11112222333342",
                         "barcodeStyle": "CODE128",
                         "id": 2,
                         "expired": false,
                         "expires": "Feb 19, 2044",
                         "ils_barcode": "11112222333342",
                         "alternateLibraryCard": "",
                         "alternateLibraryCardPassword": "",
                         "alternateLibraryCardOptions": {
                              "showAlternateLibraryCard": 1,
                              "alternateLibraryCardFormMessage": "",
                              "alternateLibraryCardLabel": "",
                              "alternateLibraryCardStyle": "none",
                              "alternateLibraryCardPasswordLabel": "",
                              "showAlternateLibraryCardPassword": 0,
                              "useAlternateLibraryCardForCloudLibrary": false
                         }
                    },
                    "3": {
                         "displayName": "T. User 3",
                         "homeLocation": "Mock Library",
                         "barcode": "11112222333343",
                         "barcodeStyle": "CODE128",
                         "id": 3,
                         "expired": false,
                         "expires": "Feb 20, 2044",
                         "ils_barcode": "11112222333343",
                         "alternateLibraryCard": "",
                         "alternateLibraryCardPassword": "",
                         "alternateLibraryCardOptions": {
                              "showAlternateLibraryCard": 1,
                              "alternateLibraryCardFormMessage": "",
                              "alternateLibraryCardLabel": "",
                              "alternateLibraryCardStyle": "none",
                              "alternateLibraryCardPasswordLabel": "",
                              "showAlternateLibraryCardPassword": 0,
                              "useAlternateLibraryCardForCloudLibrary": false
                         }
                    },
                    "4": {
                         "displayName": "T. User 4",
                         "homeLocation": "Mock Library",
                         "barcode": "11112222333344",
                         "barcodeStyle": "CODE128",
                         "id": 4,
                         "expired": false,
                         "expires": "Apr 4, 2044",
                         "ils_barcode": "11112222333344",
                         "alternateLibraryCard": "",
                         "alternateLibraryCardPassword": "",
                         "alternateLibraryCardOptions": {
                              "showAlternateLibraryCard": 0,
                              "alternateLibraryCardFormMessage": "",
                              "alternateLibraryCardLabel": "",
                              "alternateLibraryCardStyle": "none",
                              "alternateLibraryCardPasswordLabel": "",
                              "showAlternateLibraryCardPassword": 0,
                              "useAlternateLibraryCardForCloudLibrary": false
                         }
                    }
               }
          }
     }
};
