jest.mock('@expo/vector-icons/FontAwesome', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      React.createElement('FontAwesome', props),
  };
});
