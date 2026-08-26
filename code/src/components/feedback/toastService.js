import React from 'react';
import { Toast, ToastTitle, ToastDescription, VStack } from '@gluestack-ui/themed';
import { logDebugMessage } from '../../util/logging.js';

let globalToastInstance = null;

export function registerGlobalToast(toast) {
     globalToastInstance = toast;
}

function buildToastRenderer(prefix, actionType, title, description) {
     return ({ id }) => {
          const uniqueToastId = `${prefix}-${id}`;
          return (
               <Toast nativeID={uniqueToastId} action={actionType} variant="accent" zIndex={9999} elevation={9999}>
                    <VStack space="xs">
                         <ToastTitle>{title}</ToastTitle>
                         {description && <ToastDescription>{description}</ToastDescription>}
                    </VStack>
               </Toast>
          );
     };
}

function showToast({
     level,
     idPrefix,
     title,
     description,
     status,
     duration,
}) {
     if (!globalToastInstance?.show) {
          logDebugMessage(`Toast instance is unavailable in ${level}`);
          return;
     }

     const actionType = status?.toLowerCase();
     const toastId = `${idPrefix}-${Date.now()}`;
     const render = buildToastRenderer(idPrefix, actionType, title, description);

     const showConfig = {
          id: toastId,
          placement: 'bottom',
          duration,
          render,
     };

     const shownId = globalToastInstance.show(showConfig);

     logDebugMessage(`${level} show returned id: ${shownId}`);
}

// Use for short, non-blocking feedback (quick confirmations or transient errors).
export function popToast(title, description, status) {
     logDebugMessage('Popping a toast');
     showToast({
          level: 'Toast',
          idPrefix: 'toast',
          title,
          description,
          status,
          duration: 3000,
     });
}

// Use for higher-priority feedback that should remain visible longer.
export function popAlert(title, description, status) {
     logDebugMessage('Popping an alert');
     showToast({
          level: 'Alert',
          idPrefix: 'alert',
          title,
          description,
          status,
          duration: 5000,
     });
}

