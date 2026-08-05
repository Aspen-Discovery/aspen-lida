import React from 'react';
import { useToast } from '@gluestack-ui/themed';
import { registerGlobalToast } from './toastService';

export const ToastRegistrar = () => {
     const toast = useToast();

     React.useEffect(() => {
          registerGlobalToast(toast);
     }, [toast]);

     return null;
};

