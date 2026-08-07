import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { View, Text } from 'react-native';

import { buildToastMock, feedbackToastMessages } from '../__mocks__/feedbackToast';
import { popAlert, popToast, registerGlobalToast } from '../src/components/feedback';
import { ToastRegistrar } from '../src/components/feedback';
import { useToast } from '@gluestack-ui/themed';

jest.mock('../src/util/logging.js', () => ({
     logDebugMessage: jest.fn(),
}));

jest.mock('@gluestack-ui/themed', () => {
     const ReactModule = require('react');
     const { View: RNView, Text: RNText } = require('react-native');

     return {
          Toast: ({ children, ...props }) => (
               <RNView testID="toast-root" {...props}>
                    {children}
               </RNView>
          ),
          ToastTitle: ({ children }) => <RNText>{children}</RNText>,
          ToastDescription: ({ children }) => <RNText>{children}</RNText>,
          VStack: ({ children }) => <RNView>{children}</RNView>,
          useToast: jest.fn(),
     };
});

describe('feedback toast service', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          registerGlobalToast(null);
          jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
     });

     afterEach(() => {
          jest.restoreAllMocks();
     });

     it('shows popToast with explicit toast instance and renders expected content', async () => {
          const toast = buildToastMock('toast-shown-id');
          const { title, description, status } = feedbackToastMessages.toast;

          popToast(toast, title, description, status);

          expect(toast.show).toHaveBeenCalledTimes(1);
          const showConfig = toast.show.mock.calls[0][0];
          expect(showConfig.placement).toBe('bottom');
          expect(showConfig.duration).toBe(3000);
          expect(showConfig.id).toBe('toast-1700000000000');

          const renderedToast = showConfig.render({ id: 'abc' });
          await render(renderedToast);
          expect(screen.getByText(title)).toBeTruthy();
          expect(screen.getByText(description)).toBeTruthy();
          expect(screen.getByTestId('toast-root').props.action).toBe('success');
          expect(screen.getByTestId('toast-root').props.nativeID).toBe('toast-abc');
     });

     it('shows popAlert using global toast registration and renders expected content', async () => {
          const globalToast = buildToastMock('alert-shown-id');
          registerGlobalToast(globalToast);

          const { title, description, status } = feedbackToastMessages.alert;
          popAlert(title, description, status);

          expect(globalToast.show).toHaveBeenCalledTimes(1);
          const showConfig = globalToast.show.mock.calls[0][0];
          expect(showConfig.placement).toBe('bottom');
          expect(showConfig.duration).toBe(5000);
          expect(showConfig.id).toBe('alert-1700000000000');

          const renderedAlert = showConfig.render({ id: '123' });
          await render(renderedAlert);
          expect(screen.getByText(title)).toBeTruthy();
          expect(screen.getByText(description)).toBeTruthy();
          expect(screen.getByTestId('toast-root').props.action).toBe('success');
          expect(screen.getByTestId('toast-root').props.nativeID).toBe('alert-123');
     });

     it('retries with global toast when local toast returns a falsy show id', () => {
          const localToast = buildToastMock('');
          const globalToast = buildToastMock('global-shown-id');
          registerGlobalToast(globalToast);

          const { title, description, status } = feedbackToastMessages.retry;
          popAlert(localToast, title, description, status);

          expect(localToast.show).toHaveBeenCalledTimes(1);
          expect(globalToast.show).toHaveBeenCalledTimes(1);

          const localConfig = localToast.show.mock.calls[0][0];
          const globalConfig = globalToast.show.mock.calls[0][0];
          expect(localConfig.id).toBe('alert-1700000000000');
          expect(globalConfig.id).toBe('alert-1700000000000');
     });

     it('does not throw when no toast instance is available', () => {
          registerGlobalToast(null);
          expect(() => popToast('No instance', 'Should safely noop', 'error')).not.toThrow();
          expect(() => popAlert('No instance', 'Should safely noop', 'error')).not.toThrow();
     });
});

describe('ToastRegistrar', () => {
     beforeEach(() => {
          jest.clearAllMocks();
     });

     it('registers useToast instance on mount', async () => {
          const toast = buildToastMock('hook-shown-id');
          useToast.mockReturnValue(toast);
          await render(<ToastRegistrar />);

          await waitFor(() => {
               expect(useToast).toHaveBeenCalledTimes(1);
          });

          popAlert('Registered title', 'Registered description', 'success');
          expect(toast.show).toHaveBeenCalledTimes(1);
     });
});

