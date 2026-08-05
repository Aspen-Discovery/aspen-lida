import React from 'react';
import { Toast, ToastTitle, ToastDescription, VStack } from '@gluestack-ui/themed';
import { logDebugMessage } from '../../util/logging.js';

let globalToastInstance = null;

export function registerGlobalToast(toast) {
     globalToastInstance = toast;
}

function getToastInstance(toast) {
     if (toast?.show) {
          return toast;
     }

     return globalToastInstance;
}

function parseToastArgs(toastOrTitle, titleOrDescription, descriptionOrStatus, status) {
     if (toastOrTitle?.show) {
          return {
               toast: toastOrTitle,
               title: titleOrDescription,
               description: descriptionOrStatus,
               status,
          };
     }

     return {
          toast: null,
          title: toastOrTitle,
          description: titleOrDescription,
          status: descriptionOrStatus,
     };
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

function showToastWithRetry(toast, {
     level,
     idPrefix,
     title,
     description,
     status,
     duration,
}) {
     const toastInstance = getToastInstance(toast);
     if (!toastInstance?.show) {
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

     let shownId = toastInstance.show(showConfig);
     if (!shownId && toastInstance !== globalToastInstance && globalToastInstance?.show) {
          // Retry with provider-scoped instance when a no-op toast object is passed.
          shownId = globalToastInstance.show(showConfig);
     }

     logDebugMessage(`${level} show returned id: ${shownId}`);
}

export function popToast(toastOrTitle, titleOrDescription, descriptionOrStatus, status) {
     const { toast, title, description, status: resolvedStatus } = parseToastArgs(toastOrTitle, titleOrDescription, descriptionOrStatus, status);
     logDebugMessage('Popping a toast');
     showToastWithRetry(toast, {
          level: 'Toast',
          idPrefix: 'toast',
          title,
          description,
          status: resolvedStatus,
          duration: 3000,
     });
}

export function popAlert(toastOrTitle, titleOrDescription, descriptionOrStatus, status) {
     const { toast, title, description, status: resolvedStatus } = parseToastArgs(toastOrTitle, titleOrDescription, descriptionOrStatus, status);
     logDebugMessage('Popping an alert');
     showToastWithRetry(toast, {
          level: 'Alert',
          idPrefix: 'alert',
          title,
          description,
          status: resolvedStatus,
          duration: 5000,
     });
}

