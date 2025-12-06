import { render } from '@testing-library/react-native';
import React from 'react';

import App from '../app/index';

// Mock expo-router to capture the generic <Redirect /> component
jest.mock('expo-router', () => ({
    Redirect: () => null,
}));

describe('<App />', () => {
    it('renders correctly', () => {
        const tree = render(<App />).toJSON();
        expect(tree).toBeTruthy();
    });
});
