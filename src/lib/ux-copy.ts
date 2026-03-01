export const uxCopy = {
  success: {
    created: (entity: string) => `${entity} created successfully.`,
    updated: (entity: string) => `${entity} updated successfully.`,
    archived: (entity: string) => `${entity} archived successfully.`,
  },
  error: {
    fallback: 'Something went wrong. Please try again.',
    retry: 'Unable to complete this action right now. Please retry.',
  },
  loading: {
    syncing: 'Syncing with your workspace...',
    processing: 'Processing your request...',
  },
};
