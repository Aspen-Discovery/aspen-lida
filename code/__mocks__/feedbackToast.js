export const feedbackToastMessages = {
     toast: {
          title: 'Saved',
          description: 'Your changes were saved.',
          status: 'SUCCESS',
     },
     alert: {
          title: 'Hold thawed',
          description: 'Your hold was thawed successfully.',
          status: 'SUCCESS',
     },
     retry: {
          title: 'Retry path',
          description: 'Fallback global toast should display this.',
          status: 'ERROR',
     },
};

export function buildToastMock(shownId = 'shown-id') {
     return {
          show: jest.fn().mockReturnValue(shownId),
     };
}

