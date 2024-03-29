import React from 'react';
import ReactDOM from 'react-dom';
import App from 'App';
import HistoryService from 'HistoryService';
import AuthService from 'AuthService';
import axios from 'axios';
import renderer from 'react-test-renderer';
const axiosInstance = axios;
const authInstance = new AuthService(axiosInstance);

describe('App', () => {
    it('renders correctly', () => {
        const tree = renderer
          .create(<App auth={authInstance}/>)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });
});